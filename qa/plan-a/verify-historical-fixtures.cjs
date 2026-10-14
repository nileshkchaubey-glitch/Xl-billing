'use strict';

// Tests code-defined fixture integrity, not application correctness or restore
// acceptance. Future runtime gates are in the outside reviewed test/risk docs
// referenced by historical-fixtures.cjs. Only hash-pinned codec factories are
// executed for the final parse/decode smoke; no bootstrap or restore is run.
const {createHash, webcrypto} = require('node:crypto');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {SCALES, INVOICE_CASES, PURCHASE_CASES, generateFixture, generateCompatibleFormatFixture, summarizeFixture, buildPrivateV1, buildLegacyV4} = require('./historical-fixtures.cjs');

const failures = [];
let checks = 0;
function verify(condition, reason) {
  if (!condition) {
    const error = new Error('Fixture integrity assertion failed.');
    error.fixtureReason = reason; // Only fixed code-defined labels are printed.
    throw error;
  }
}
function check(label, fn) {
  checks++;
  try { fn(); } catch (error) { failures.push({check: label, reason: error.fixtureReason || 'Unexpected verifier error; details omitted to avoid record logs.'}); }
}
async function checkAsync(label, fn) {
  checks++;
  try { await fn(); } catch (error) { failures.push({check: label, reason: error.fixtureReason || 'Unexpected verifier error; details omitted to avoid record logs.'}); }
}
const raw = (fixture, key) => fixture.snapshot.find(row => row.key === key)?.value ?? null;
const rows = (fixture, group) => JSON.parse(raw(fixture, 'shop4_' + group));
const history = (fixture, caseId) => fixture.cases.find(c => c.id === caseId);
const fixture = generateFixture({scale: 86, largePayloadChars: 0});
const invoices = rows(fixture, 'invoices');
const purchases = rows(fixture, 'purchases');
const invoice = caseId => invoices[history(fixture, caseId).firstIndex];
const purchase = caseId => purchases[history(fixture, caseId).firstIndex];

check('determinism and seed isolation', () => {
  const again = generateFixture({scale: 86, largePayloadChars: 0});
  verify(JSON.stringify(fixture) === JSON.stringify(again), 'Identical inputs must produce identical source bytes and metadata.');
  const changed = generateFixture({scale: 86, seed: fixture.seed + 1, largePayloadChars: 0});
  verify(changed.summary.sha256 !== fixture.summary.sha256, 'A different seed must change source identity.');
  verify(JSON.stringify(changed.summary.counts) === JSON.stringify(fixture.summary.counts), 'A different seed must preserve collection sizes.');
  verify(rows(changed, 'invoices')[0].id !== invoices[0].id, 'A different seed must change synthetic record IDs.');
});

check('scale counts, unique identities and linked master roles', () => {
  let priorBytes = 0;
  for (const scale of SCALES) {
    const generated = generateFixture({scale, largePayloadChars: 0});
    const expected = {items: scale ? 12 : 0, parties: scale ? 9 : 0, invoices: scale, purchases: Math.ceil(scale / 4), retail: Math.ceil(scale / 3), audit: Math.min(scale, 3)};
    for (const [group, count] of Object.entries(expected)) {
      const records = rows(generated, group);
      verify(records.length === count && generated.summary.counts[group] === count, 'Each collection must have its specified independently calculated size.');
      verify(new Set(records.map(row => row.id)).size === count, 'Synthetic IDs must be unique within each collection.');
      verify(records.every(row => row.id.startsWith('SYNTHETIC-')), 'Synthetic IDs must be unmistakably artificial.');
    }
    const masters = new Map(rows(generated, 'parties').map(p => [p.id, p]));
    const itemIds = new Set(rows(generated, 'items').map(i => i.id));
    for (const [group, excludedRole] of [['invoices', 'supplier'], ['purchases', 'customer']]) {
      for (const record of rows(generated, group)) {
        const master = masters.get(record.partyId);
        verify(master && master.type !== excludedRole && master.name === record.partyName, 'Bills must reference the correct master by ID and retain its name.');
        verify(record.items.every(item => itemIds.has(item.itemId)), 'Bill lines must link to synthetic item masters.');
      }
    }
    verify(rows(generated, 'retail').every(r => !Object.hasOwn(r, 'partyId') && Number.isFinite(r.amount)), 'Retail must retain the actual unlinked amount shape.');
    verify(generated.summary.utf8Bytes > priorBytes, 'Source byte sizes must grow across these increasing scales.');
    priorBytes = generated.summary.utf8Bytes;
  }
});

check('absent, empty, matching and conflicting histories', () => {
  const absent = invoice('history-absent'), empty = invoice('history-empty'), matching = invoice('history-matching'), conflicting = invoice('history-conflicting');
  verify(!Object.hasOwn(absent, 'payments') && absent.paid === 20 && absent.balance === 80, 'Absent history must preserve valid paid20 and due80.');
  verify(Array.isArray(empty.payments) && empty.payments.length === 0 && empty.paid === 20, 'Empty history must preserve paid20 rather than replace it with0.');
  verify(matching.payments.length === 1 && matching.payments[0].amt === 20 && matching.paid === 20, 'Matching explicit history must remain20.');
  verify(conflicting.paid === 20 && conflicting.payments[0].amt === 10 && conflicting.balance === 80, 'Conflicting nonempty history must retain paid20, receipt10 and due80.');
  verify(history(fixture, 'history-conflicting').classification === 'legacy-ambiguous', 'Conflicting history must be labeled ambiguous.');
  verify(history(fixture, 'history-absent').classification === 'accepted-aggregate' && history(fixture, 'history-empty').classification === 'accepted-aggregate', 'Valid aggregates must not require fabricated receipts.');
  verify(purchase('purchase-history-absent').paid === 20 && !Object.hasOwn(purchase('purchase-history-absent'), 'payments'), 'Purchase absent history must retain paid20.');
  verify(purchase('purchase-history-empty').payments.length === 0 && purchase('purchase-history-empty').paid === 20, 'Purchase empty history must retain paid20.');
  verify(purchase('purchase-history-matching').payments[0].amt === 20, 'Purchase explicit receipt20 must survive.');
  verify(purchase('purchase-history-conflicting').paid === 20 && purchase('purchase-history-conflicting').payments[0].amt === 10, 'Purchase conflicting amounts must remain distinct.');
});

check('opening components and role-independent opening signs', () => {
  for (const role of ['customer', 'supplier', 'both']) {
    const masters = rows(fixture, 'parties').filter(p => p.type === role);
    verify(masters.length === 3 && masters[0].openingBal === 25 && masters[1].openingBal === -25 && masters[2].openingBal === -200, 'Each role must retain positive25 receivable and negative25/200 credits.');
    verify(new Set(masters.map(p => p.name)).size === 1 && new Set(masters.map(p => p.id)).size === 3, 'Same-name masters must keep separate IDs.');
  }
  for (const opening of [invoice('opening-paid'), purchase('purchase-opening-paid')]) {
    verify(opening.openingPaid === 10 && opening.payments.length === 1 && opening.payments[0].amt === 10 && opening.paid === 20, 'Opening10 and receipt10 must remain separate components of paid20.');
    verify(!Object.hasOwn(opening, 'openingPaidDate'), 'Undated opening must not receive an invented payment date.');
  }
  verify(history(fixture, 'opening-paid').provenance === 'historical-hypothesis', 'openingPaid must not be presented as an established current field.');
});

check('cash, settlement discount and independent supplier discount', () => {
  const settlement = invoice('invoice-discount');
  verify(settlement.payments[0].amt === 15 && settlement.payments[0].mode === 'Cash' && settlement.payments[1].amt === 5 && settlement.payments[1].mode === 'Discount' && settlement.paid === 20, 'Cash15 must remain separate from included settlement discount5.');
  const supplier = purchase('purchase-separate-discount');
  verify(supplier.paid === 20 && supplier.payments.length === 1 && supplier.payments[0].amt === 20 && supplier.discounts[0].amt === 5 && supplier.balance === 75, 'Supplier cash20 and separate discount5 must leave due75 without rewriting paid to25.');
  verify(supplier.total - supplier.paid - supplier.discounts[0].amt === supplier.balance, 'The declared independent supplier components must be arithmetically consistent.');
  verify(history(fixture, 'purchase-separate-discount').provenance === 'historical-hypothesis', 'Separate purchase discounts must not imply current runtime acceptance.');
  const scalar = purchase('purchase-scalar-discount');
  verify(scalar.total === 500 && scalar.paid === 20 && scalar.discount === 10 && scalar.balance === 470 && scalar.payments[0].amt === 20, 'The historical R1 scalar supplier shape must retain total500, paid20, discount10 and due470.');
  verify(!Object.hasOwn(scalar, 'discounts') && !Object.hasOwn(supplier, 'discount'), 'Scalar and array supplier discounts must remain distinct historical shapes.');
  verify(history(fixture, 'purchase-scalar-discount').provenance === 'historical-hypothesis', 'The R1 scalar supplier shape must not imply current runtime acceptance.');
});

check('fractional values, canonical zero and aliases', () => {
  for (const fractional of [invoice('fractional-total'), purchase('purchase-fractional-total')]) {
    verify(fractional.total === 2719.4895 && fractional.paid === 20 && fractional.balance === 2699.4895, 'Fractional total and due must retain four decimal places.');
    verify(Number(fractional.total.toFixed(2)) !== fractional.total, 'The fixture must exercise a value that currency rounding would change.');
  }
  const aliasOnly = invoice('payment-amount-only').payments[0];
  verify(!Object.hasOwn(aliasOnly, 'amt') && aliasOnly.amount === 20, 'Amount-only payment must retain the absent canonical field.');
  const zero = invoice('payment-canonical-zero');
  verify(zero.payments[0].amt === 0 && zero.payments[0].amount === 20 && zero.paid === 0 && zero.balance === 100, 'Canonical payment zero must retain its precedence over a nonzero alias.');
  const both = invoice('payment-aliases-both').payments[0];
  verify(both.amt === 20 && both.amount === 30, 'Differing alias values must both remain present.');
  const legacyLine = invoice('item-amount-only').items[0];
  verify(!Object.hasOwn(legacyLine, 'amt') && legacyLine.amount === 100 && legacyLine.packType === 'Box' && legacyLine.packCount === 2, 'Legacy item amount and packing must remain intact.');
  const zeroLine = invoice('item-canonical-zero').items[0];
  verify(zeroLine.amt === 0 && zeroLine.amount === 100 && zeroLine.qty === 0, 'Canonical line zero must not be substituted from amount.');
});

check('cancelled receipts, ambiguous modes and date absence', () => {
  for (const caseId of ['cancelled-status', 'cancelled-dispatch']) {
    const cancelled = invoice(caseId);
    verify(cancelled.paid === 20 && cancelled.payments.length === 1 && cancelled.payments[0].amt === 20 && cancelled.payments[0].mode === 'Cash', 'Cancellation must retain recorded cash20 without rewriting history.');
    verify(history(fixture, caseId).classification === 'retained-history', 'Cancellation fixture integrity must not be a safety verdict.');
  }
  verify(invoice('cancelled-status').status === 'cancelled' && invoice('cancelled-status').dispatchStatus === 'pending', 'Status cancellation must be independently represented.');
  verify(invoice('cancelled-dispatch').dispatchStatus === 'cancelled' && !Object.hasOwn(invoice('cancelled-dispatch'), 'status'), 'Dispatch cancellation must be independently represented.');
  verify(invoice('credit-mode').payments[0].mode === 'Credit' && history(fixture, 'credit-mode').classification === 'legacy-ambiguous', 'Credit mode must not receive an inferred cash interpretation.');
  verify(history(fixture, 'unknown-mode').classification === 'legacy-ambiguous' && !Object.hasOwn(invoice('undated-receipt').payments[0], 'date'), 'Unknown modes and undated receipts must retain ambiguity.');
});

check('missing stores, present-empty stores and explicit null', () => {
  const missing = generateFixture({scale: 0, storageShape: 'missing', largePayloadChars: 0});
  const empty = generateFixture({scale: 0, largePayloadChars: 0});
  verify(missing.snapshot.length === 0 && raw(missing, 'shop4_invoices') === null && missing.absentKeys.includes('shop4_invoices'), 'Missing-store representation must return native absent null.');
  verify(raw(empty, 'shop4_invoices') === ' [ ]\n' && rows(empty, 'invoices').length === 0 && !empty.absentKeys.includes('shop4_invoices'), 'Present-empty store must retain its exact source string.');
  verify(missing.summary.sha256 !== empty.summary.sha256, 'Missing and present-empty stores must have different snapshot hashes.');
  verify(raw(fixture, 'shop4_synthetic_null') === ' \nnull\t' && JSON.parse(raw(fixture, 'shop4_synthetic_null')) === null, 'Stored JSON null must remain a string distinct from absent storage null.');
  verify(invoice('history-null').payments === null && purchase('purchase-history-null').payments === null, 'Explicit null histories must remain null.');
  verify(!Object.hasOwn(invoice('balance-absent'), 'balance') && invoice('balance-null').balance === null, 'Absent and null balance fields must remain different.');
  verify(raw(fixture, 'shop4_import_pending') === null && fixture.absentKeys.includes('shop4_import_pending'), 'The default fixture must not imply an import in progress.');
});

check('exact raw source preservation and format-specific copies', () => {
  const before = JSON.stringify(fixture.snapshot);
  verify(raw(fixture, 'shop4_invoices').includes('"paid":2e1') && raw(fixture, 'shop4_invoices').includes('2719.4895'), 'Raw invoice JSON must retain noncanonical numeric spelling and fractional literal.');
  verify(raw(fixture, 'shop4_synthetic_extra').includes('"\\u00e9 🧾"'), 'Unknown supported key must retain the raw Unicode escape spelling.');
  const v1 = buildPrivateV1(fixture);
  const v4 = buildLegacyV4(fixture);
  const copied = new Map(v1.payload.records.map(row => [row.key, row.value]));
  verify(v1.format === 'xl-billing-private' && v1.version === 1 && copied.get('shop4_invoices') === raw(fixture, 'shop4_invoices'), 'V1 wrapper must carry exact source raw values.');
  verify(copied.get('v8_compact') === '1' && copied.get('v8_slcols') === raw(fixture, 'v8_slcols') && copied.get('shop4_synthetic_extra') === raw(fixture, 'shop4_synthetic_extra'), 'V1 must preserve preferences and supported unknown keys.');
  verify(!copied.has('unrelated_synthetic') && raw(fixture, 'unrelated_synthetic') !== null, 'Unrelated storage must remain in the source snapshot outside V1 membership.');
  const signed = JSON.stringify({format: v1.format, version: v1.version, createdAt: v1.createdAt, payload: v1.payload});
  verify(v1.checksum.algorithm === 'SHA-256' && v1.checksum.value === createHash('sha256').update(signed, 'utf8').digest('hex'), 'The synthetic V1 envelope must bind its own payload.');
  verify(v4.v === 4 && v4.invoices.length === 86 && !Object.hasOwn(v4, 'v8_compact') && !Object.hasOwn(v4, 'shop4_synthetic_extra'), 'V4 must expose only its legacy semantic sections.');
  verify(!Object.hasOwn(v4.invoices[0], 'payments') && v4.invoices[4].payments === null && v4.invoices[8].payments[0].amount === 20, 'Format wrappers must retain histories that current V4 may reject.');
  v1.payload.records[0].value = 'changed synthetic wrapper';
  v4.invoices[0].paid = 0;
  summarizeFixture(fixture);
  verify(JSON.stringify(fixture.snapshot) === before, 'Summaries and format wrapper mutations must never rewrite source strings.');
});

check('independent UTF8 measurement and Unicode/photo payload scaling', () => {
  const large = generateFixture({scale: 86, largePayloadChars: 1000});
  const shortNotes = invoices[0].notes, largeNotes = rows(large, 'invoices')[0].notes;
  verify(new TextEncoder().encode(largeNotes).length - new TextEncoder().encode(shortNotes).length === 4000, 'One thousand supplementary Unicode scalars must add exactly four thousand UTF8 bytes.');
  verify(largeNotes.length - shortNotes.length === 2000, 'Supplementary scalars must exercise UTF16/UTF8 size differences.');
  const photoBytes = f => Buffer.from(rows(f, 'purchases')[0].photoData.split(',')[1], 'base64').length;
  verify(photoBytes(large) - photoBytes(fixture) === 1000, 'Synthetic SVG metadata must add the requested unencoded payload bytes.');
  const independentBytes = large.snapshot.reduce((sum, row) => sum + new TextEncoder().encode(row.value).length, 0);
  verify(large.summary.utf8Bytes === independentBytes && large.summary.utf8Bytes > fixture.summary.utf8Bytes, 'Summary raw-value bytes must match independently encoded source strings.');
  verify(large.summary.utf8Bytes > large.snapshot.reduce((sum, row) => sum + row.value.length, 0), 'Unicode source bytes must exceed UTF16 character counts.');
  verify(large.summary.sha256 !== fixture.summary.sha256, 'Payload changes must change the exact-source snapshot hash.');
});

check('case coverage and explicit characterization labels', () => {
  verify(INVOICE_CASES.length === 20 && PURCHASE_CASES.length === 9, 'The fixture catalogue must cover its reviewed distinct shapes.');
  verify(fixture.cases.filter(c => c.collection === 'invoices').reduce((sum, c) => sum + c.occurrences, 0) === 86, 'Invoice case occurrence counts must sum to the requested scale.');
  verify(fixture.cases.filter(c => c.collection === 'purchases').reduce((sum, c) => sum + c.occurrences, 0) === 22, 'Purchase case occurrence counts must sum to independently expected twenty-two.');
  verify(history(fixture, 'history-absent').occurrences === 5 && history(fixture, 'undated-receipt').occurrences === 4, 'Catalogue occurrence counts must cover partial final cycles correctly.');
  verify(fixture.summary.assessment === 'fixture-integrity-only' && fixture.summary.productionSafety === 'unverified', 'Fixture characterization must not report production safety.');
});

check('CLI summaries and failure logs contain no record payloads', () => {
  const script = path.join(__dirname, 'historical-fixtures.cjs');
  const result = spawnSync(process.execPath, [script, '86'], {encoding: 'utf8'});
  verify(result.status === 0 && result.stderr === '', 'The summary CLI must succeed with a supported scale.');
  const report = JSON.parse(result.stdout);
  verify(report.scope === 'synthetic-fixture-metadata-only' && report.fixtures.length === 1 && report.fixtures[0].counts.invoices === 86, 'CLI output must expose the agreed metadata contract.');
  verify(!/SYNTHETIC-INV|SYNTHETIC-PARTY|SYNTHETIC QA ONLY|data:image|"(?:shopName|partyName|photoData|openingPaid|payload|snapshot)"\s*:/.test(result.stdout), 'CLI output must omit source records and raw values.');
  const invalid = spawnSync(process.execPath, [script, 'SYNTHETIC-private-input'], {encoding: 'utf8'});
  verify(invalid.status === 1 && invalid.stdout === '' && !invalid.stderr.includes('SYNTHETIC-private-input'), 'Invalid arguments must not be echoed to logs.');
});

check('invalid generator options fail without accidental coercion', () => {
  for (const options of [{scale: 1}, {scale: '86'}, {seed: -1}, {seed: 'private'}, {seed: 1.5}, {largePayloadChars: -1}, {largePayloadChars: 1000001}, {scale: 86, storageShape: 'missing'}]) {
    let rejected = false;
    try { generateFixture(options); } catch (error) { rejected = error instanceof RangeError; }
    verify(rejected, 'Invalid synthetic fixture options must be explicitly rejected.');
  }
});

check('independent nonempty compatible format input', () => {
  const compatible = generateCompatibleFormatFixture();
  verify(JSON.stringify(compatible) === JSON.stringify(generateCompatibleFormatFixture()), 'Fresh literal positive input must be deterministic.');
  const compatibleInvoices = rows(compatible, 'invoices');
  verify(compatibleInvoices.length === 3 && !Object.hasOwn(compatibleInvoices[0], 'payments') && compatibleInvoices[1].payments.length === 0 && compatibleInvoices[2].payments[0].amt === 20, 'Positive input must independently preserve absent, empty and matching histories.');
  verify(compatibleInvoices.every(inv => inv.paid === 20) && compatibleInvoices[2].total === 2719.4895, 'Positive format input must retain valid legacy paid aggregates and precision.');
  verify(compatibleInvoices.every(inv => !invoices.some(mixed => mixed.id === inv.id)), 'Positive input identities must be independent of the mixed generator.');
  verify(rows(compatible, 'purchases').length === 1 && rows(compatible, 'purchases')[0].balance === 480 && rows(compatible, 'retail')[0].amount === 12.3456, 'Positive input must include nonempty independent purchase and retail sections.');
  for (const role of ['customer', 'supplier', 'both']) {
    verify(JSON.stringify(rows(compatible, 'parties').filter(p => p.type === role).map(p => p.openingBal)) === '[25,-25,-200]', 'Compatible signed masters must preserve all approved role-independent opening signs.');
  }
  verify(compatible.summary.productionSafety === 'unverified', 'Compatible input integrity must not become a runtime safety verdict.');
});

let codecInputSmoke = 'FAIL';
checkAsync('hash-pinned isolated V4 parse and V1 decode of compatible input', async () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../index.html'));
  const originalBytes = createHash('sha256').update(source).digest('hex') === 'd5fbcd1a47a5bf6e8d2ec735b561f46108e3c905878ba301acd322040b52b70a';
  let authorizedRevision = false;
  if (JSON.stringify(process.argv.slice(2)) === JSON.stringify(['--runtime-revision', 'qa/plan-a2/runtime-revision.json'])) {
    const revision = require('../plan-a2/verify-runtime-revision.cjs').verifyRuntimeRevision(path.resolve(__dirname, '../..'));
    authorizedRevision = revision.status === 'verified-authorized-A2-revision';
  }
  verify(originalBytes || authorizedRevision, 'Original full index bytes or explicitly approved A2 scope and unchanged codecs required before VM execution.');
  const html = source.toString('utf8');
  let forbiddenAccesses = 0;
  const reject = () => { forbiddenAccesses++; throw new Error('Forbidden codec environment access.'); };
  const forbidden = new Proxy(Object.create(null), {get: reject, set: reject});
  function loadFactory(scriptId, globalName, invocation) {
    const match = html.match(new RegExp('<script id="' + scriptId + '">([\\s\\S]*?)<\\/script>'));
    verify(Boolean(match), 'A named standalone codec script must exist.');
    const boundary = match[1].indexOf('\nwindow.' + globalName + '=');
    verify(boundary > 0, 'Codec extraction must stop before browser initialization.');
    // Each factory gets a fresh VM and blocked browser/storage/network ports.
    return new vm.Script(match[1].slice(0, boundary) + '\n' + invocation, {filename: 'synthetic-codec-input-smoke.js'}).runInNewContext({TextEncoder, fixtureCrypto: webcrypto, window: forbidden, document: forbidden, localStorage: forbidden, fetch: reject, console: forbidden}, {timeout: 1000});
  }
  const compatible = generateCompatibleFormatFixture();
  const before = JSON.stringify(compatible.snapshot);
  const complete = loadFactory('xl-complete-backup', 'XLCompleteBackup', 'createXLCompleteBackup({crypto:fixtureCrypto});');
  const legacy = loadFactory('xl-backup-import-guard', 'XLLegacyImportGuard', 'createXLLegacyImportGuard();');
  const v4 = legacy.parse(JSON.stringify(buildLegacyV4(compatible)));
  const v1 = await complete.decode(JSON.stringify(buildPrivateV1(compatible)));
  verify(v4.counts.invoices === 3 && v4.counts.parties === 9 && v4.counts.purchases === 1 && v4.counts.retail === 1, 'Current V4 parser must accept the independent nonempty input counts.');
  verify(v1.verified === true && v1.counts.invoices === 3 && v1.counts.audit === 1, 'Current V1 decoder must accept this structural checksum-bound input.');
  const v4Invoices = JSON.parse(v4.rows.find(row => row[0] === 'shop4_invoices')[1]);
  verify(!Object.hasOwn(v4Invoices[0], 'payments') && v4Invoices[0].paid === 20 && v4Invoices[1].payments.length === 0 && v4Invoices[1].paid === 20, 'V4 parse must not normalize absent/empty paid20 histories.');
  verify(v1.rows.every(([key, value]) => value === raw(compatible, key)), 'V1 decode must return exact positive source strings.');
  verify(forbiddenAccesses === 0 && JSON.stringify(compatible.snapshot) === before, 'Parse/decode smoke must perform no browser/storage/network access or source mutation.');
  codecInputSmoke = 'PASS'; // Structural input acceptance, never full restore acceptance.
}).then(() => {
  process.stdout.write(JSON.stringify({scope: 'synthetic-fixture-integrity-only', fixtureIntegrity: failures.length ? 'FAIL' : 'PASS', codecInputSmoke, productionSafety: 'UNVERIFIED', restoreAcceptance: 'NOT_TESTED', checks, failures}, null, 2) + '\n');
  if (failures.length) process.exitCode = 1;
});
