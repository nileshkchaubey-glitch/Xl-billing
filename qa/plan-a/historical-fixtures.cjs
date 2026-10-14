'use strict';

// A1a fixture characterization only; never imports/runs the application.
// Reviewed outside-repository references (2026-10-14):
// XL_Billing_Plan_A_Review_2026-10-14/PLAN_A_IMPLEMENTATION.md: A1-06, A4-05.
// XL_Billing_Plan_A_Review_2026-10-14/PLAN_A_TEST_MATRIX.md: A-PAY-HIST-01,
// A-REPORT-01 and the fixture/browser matrix; PLAN_A_RISK_TRACEABILITY.md: R1-09.
// Current index.html shapes: DB/getters, saveSaleInvoice, saveRetail, savePurchase,
// migrateV5 (item amount alias), V14 purchases and auditLog. openingPaid, payment
// amount aliases and separate purchase discounts are historical hypotheses,
// not fields whose runtime compatibility has been established on this main.

const {createHash} = require('node:crypto');
const SCALES = Object.freeze([0, 86, 500, 2000, 5000]); // Invoice counts, not bytes.
const DEFAULT_SEED = 0xA1A2026;
const CREATED_AT = '2026-04-01T00:00:00.000Z';
const GROUPS = Object.freeze(['items', 'parties', 'invoices', 'purchases', 'retail', 'audit']);
const ABSENT_KEYS = Object.freeze(['shop4_import_pending', 'shop4_synthetic_missing']);
const KNOWN_KEYS = ['settings', ...GROUPS].map(k => 'shop4_' + k);

const INVOICE_CASES = Object.freeze([
  ['history-absent', 'accepted-aggregate', 'current-source', 'Paid aggregate valid; receipt provenance absent.'],
  ['history-empty', 'accepted-aggregate', 'current-source', 'Paid aggregate valid; empty history does not erase it.'],
  ['history-matching', 'accepted-history', 'current-source', 'Explicit receipt matches paid aggregate.'],
  ['history-conflicting', 'legacy-ambiguous', 'current-source', 'Paid20 versus receipt10; retain both without choosing truth.'],
  ['history-null', 'legacy-ambiguous', 'historical-hypothesis', 'Explicit null history remains distinct from absent/empty.'],
  ['opening-paid', 'accepted-components', 'historical-hypothesis', 'Undated opening10 plus receipt10 equals paid20; do not invent a receipt.'],
  ['invoice-discount', 'accepted-components', 'current-source', 'Cash15 and settlement discount5 remain distinct within paid20.'],
  ['fractional-total', 'accepted-history', 'current-source', '2719.4895 is retained without currency rounding.'],
  ['payment-amount-only', 'legacy-ambiguous', 'historical-hypothesis', 'Old payment amount20 is retained; current payment readers use amt.'],
  ['payment-canonical-zero', 'accepted-precedence', 'historical-hypothesis', 'Present amt0 takes precedence over amount20; zero is not missing.'],
  ['payment-aliases-both', 'accepted-precedence', 'historical-hypothesis', 'Present amt20 takes precedence; differing amount30 is retained.'],
  ['cancelled-status', 'retained-history', 'current-source', 'Cancelled invoice retains recorded receipt20.'],
  ['cancelled-dispatch', 'retained-history', 'current-source', 'Cancelled dispatch retains recorded receipt20.'],
  ['credit-mode', 'legacy-ambiguous', 'current-source', 'Paid aggregate valid; Credit is not automatically cash.'],
  ['unknown-mode', 'legacy-ambiguous', 'current-source', 'Unknown mode is not automatically cash.'],
  ['balance-absent', 'accepted-aggregate', 'current-source', 'Missing balance remains absent; no derived value is written.'],
  ['balance-null', 'accepted-aggregate', 'current-source', 'Null balance remains null; no derived value is written.'],
  ['item-amount-only', 'accepted-precedence', 'current-source', 'V5 recognizes legacy item amount when amt is absent.'],
  ['item-canonical-zero', 'accepted-precedence', 'current-source', 'V5 leaves present item amt0 intact despite amount100.'],
  ['undated-receipt', 'legacy-ambiguous', 'historical-hypothesis', 'Receipt amount retained; missing business date is not inferred.']
].map(([id, classification, provenance, note]) => Object.freeze({id, classification, provenance, note})));
const PURCHASE_CASES = Object.freeze([
  ['purchase-history-absent', 'accepted-aggregate', 'current-source', 'Valid paid20 with absent history.'],
  ['purchase-history-empty', 'accepted-aggregate', 'current-source', 'Valid paid20 with empty history.'],
  ['purchase-history-matching', 'accepted-history', 'current-source', 'Receipt20 matches paid20.'],
  ['purchase-history-conflicting', 'legacy-ambiguous', 'current-source', 'Paid20 versus receipt10; neither is rewritten.'],
  ['purchase-opening-paid', 'accepted-components', 'historical-hypothesis', 'Opening10 and receipt10 stay separate.'],
  ['purchase-separate-discount', 'accepted-components', 'historical-hypothesis', 'Paid20 cash and separate discount5 leave due75; paid is not increased to25.'],
  ['purchase-fractional-total', 'accepted-history', 'current-source', 'Fractional purchase total2719.4895 remains exact.'],
  ['purchase-history-null', 'legacy-ambiguous', 'historical-hypothesis', 'Explicit null history is retained.'],
  ['purchase-scalar-discount', 'accepted-components', 'historical-hypothesis', 'Historical R1 shape: total500, cash paid20, scalar discount10, balance470.']
].map(([id, classification, provenance, note]) => Object.freeze({id, classification, provenance, note})));

const sha256 = raw => createHash('sha256').update(raw, 'utf8').digest('hex');
const collectionRaw = rows => rows.length ? '[\n  ' + rows.map(row => JSON.stringify(row)).join(',\n  ') + '\n]\n' : ' [ ]\n';
const payment = (amt, mode = 'Cash') => ({date: '2026-03-31', amt, mode, note: 'SYNTHETIC receipt'});
const supportedKey = key => (/^shop4_[A-Za-z0-9_-]+$/.test(key) && key !== 'shop4_import_pending') || ['v8_slcols', 'v8_compact'].includes(key);

function generateFixture({scale = 86, seed = DEFAULT_SEED, largePayloadChars = 32768, storageShape = 'present'} = {}) {
  if (!SCALES.includes(scale)) throw new RangeError('Unsupported synthetic invoice scale.');
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('Seed must be a nonsecret uint32.');
  if (!Number.isInteger(largePayloadChars) || largePayloadChars < 0 || largePayloadChars > 1000000) throw new RangeError('Invalid synthetic payload size.');
  if (!['present', 'missing'].includes(storageShape) || (storageShape === 'missing' && scale !== 0)) throw new RangeError('Missing-store fixtures require scale0.');
  const id = (kind, n) => 'SYNTHETIC-' + seed.toString(16) + '-' + kind + '-' + String(n).padStart(5, '0');
  const items = scale ? Array.from({length: 12}, (_, i) => ({id: id('ITEM', i), name: 'SYNTHETIC item café ' + i, unit: 'Pcs', saleRate: 100, purchaseRate: 80, gst: 0, hsn: '', createdAt: CREATED_AT})) : [];
  // Opening signs do not depend on master role and never net against purchases.
  const parties = scale ? ['customer', 'supplier', 'both'].flatMap(type => [25, -25, -200].map((openingBal, i) => ({
    id: id('PARTY-' + type, i), name: 'SYNTHETIC same-name ' + type,
    type, phone: '', address: 'SYNTHETIC address café', gstin: '', area: '',
    description: 'SYNTHETIC master', openingBal, createdAt: CREATED_AT
  }))) : [];
  const buyers = parties.filter(p => p.type !== 'supplier');
  const suppliers = parties.filter(p => p.type !== 'customer');
  const line = (i, total = 100) => ({id: id('LINE', i), itemId: items[i % items.length].id, name: items[i % items.length].name, unit: 'Pcs', packType: 'Box', packCount: 2, qty: 1, rate: total, amt: total});
  const invoices = Array.from({length: scale}, (_, i) => {
    const party = buyers[i % buyers.length];
    const inv = {id: id('INV', i), invoiceNo: 'SYNTHETIC-INV-' + (1001 + i), date: '2026-04-01', due: '', partyId: party.id, partyName: party.name,
      items: [line(i)], subtotal: 100, discount: 0, taxPct: 0, taxAmt: 0, total: 100, paid: 20, balance: 80,
      notes: 'SYNTHETIC café 🧾 e\u0301', paymentType: 'Cash', dispatchStatus: 'pending', customFieldValues: {synthetic: null}, createdAt: CREATED_AT};
    switch (INVOICE_CASES[i % INVOICE_CASES.length].id) {
      case 'history-empty': inv.payments = []; break;
      case 'history-conflicting': inv.payments = [payment(10)]; break;
      case 'history-null': inv.payments = null; break;
      case 'opening-paid': inv.openingPaid = 10; inv.payments = [payment(10)]; break;
      case 'invoice-discount': inv.payments = [payment(15), payment(5, 'Discount')]; break;
      case 'fractional-total': inv.total = inv.subtotal = 2719.4895; inv.balance = 2699.4895; inv.items = [line(i, 2719.4895)]; inv.payments = [payment(20)]; break;
      case 'payment-amount-only': inv.payments = [{date: '2026-03-31', amount: 20, mode: 'Cash', note: 'SYNTHETIC legacy alias'}]; break;
      case 'payment-canonical-zero': inv.paid = 0; inv.balance = 100; inv.payments = [{...payment(0), amount: 20}]; break;
      case 'payment-aliases-both': inv.payments = [{...payment(20), amount: 30}]; break;
      case 'cancelled-status': inv.status = 'cancelled'; inv.payments = [payment(20)]; break;
      case 'cancelled-dispatch': inv.dispatchStatus = 'cancelled'; inv.payments = [payment(20)]; break;
      case 'credit-mode': inv.payments = [payment(20, 'Credit')]; break;
      case 'unknown-mode': inv.payments = [payment(20, 'SYNTHETIC-unknown-mode')]; break;
      case 'balance-absent': delete inv.balance; inv.payments = [payment(20)]; break;
      case 'balance-null': inv.balance = null; inv.payments = [payment(20)]; break;
      case 'item-amount-only': inv.items[0].amount = 100; delete inv.items[0].amt; inv.payments = [payment(20)]; break;
      case 'item-canonical-zero': inv.items = [{...line(i), qty: 0, amt: 0, amount: 100}, {...line(i), id: id('EXTRA-LINE', i)}]; inv.payments = [payment(20)]; break;
      case 'undated-receipt': inv.payments = [payment(20)]; delete inv.payments[0].date; break;
      case 'history-matching': inv.payments = [payment(20)]; break;
    }
    if (i === 0) inv.notes += '\n' + '🧾'.repeat(largePayloadChars);
    return inv;
  });
  const purchases = Array.from({length: Math.ceil(scale / 4)}, (_, i) => {
    const party = suppliers[i % suppliers.length];
    const pur = {id: id('PUR', i), billNo: 'SYNTHETIC-PB-' + (i + 1), date: '2026-04-01', partyId: party.id, partyName: party.name, mode: i % 2 ? 'amount' : 'items',
      total: 100, paid: 20, balance: 80, payType: 'Cash', items: i % 2 ? [] : [line(i)], notes: 'SYNTHETIC purchase', photoData: '', createdAt: CREATED_AT};
    switch (PURCHASE_CASES[i % PURCHASE_CASES.length].id) {
      case 'purchase-history-empty': pur.payments = []; break;
      case 'purchase-history-matching': pur.payments = [payment(20)]; break;
      case 'purchase-history-conflicting': pur.payments = [payment(10)]; break;
      case 'purchase-opening-paid': pur.openingPaid = 10; pur.payments = [payment(10)]; break;
      case 'purchase-separate-discount': pur.payments = [payment(20)]; pur.discounts = [payment(5, 'Discount')]; pur.balance = 75; break;
      case 'purchase-fractional-total': pur.total = 2719.4895; pur.balance = 2699.4895; pur.items = pur.items.length ? [line(i, 2719.4895)] : []; pur.payments = [payment(20)]; break;
      case 'purchase-history-null': pur.payments = null; break;
      case 'purchase-scalar-discount': pur.total = 500; pur.discount = 10; pur.balance = 470; pur.items = pur.items.length ? [line(i, 500)] : []; pur.payments = [payment(20)]; break;
    }
    if (i === 0) pur.photoData = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><metadata>SYNTHETIC ' + 'x'.repeat(largePayloadChars) + '</metadata><rect width="1" height="1"/></svg>', 'utf8').toString('base64');
    return pur;
  });
  // saveRetail has no master/bill reference: do not invent a party association.
  const retail = Array.from({length: Math.ceil(scale / 3)}, (_, i) => ({id: id('RETAIL', i), date: '2026-04-01', amount: i % 2 ? 12.3456 : 25, notes: 'SYNTHETIC retail café 🧾', createdAt: CREATED_AT}));
  const audit = invoices.slice(0, 3).map((inv, i) => ({id: id('AUDIT', i), type: 'create', entityType: 'invoice', entityId: inv.id, label: 'SYNTHETIC audit', details: 'SYNTHETIC metadata', ts: CREATED_AT, user: 'SYNTHETIC owner'}));
  const settings = {shopName: 'SYNTHETIC QA ONLY', owner: 'SYNTHETIC owner', address: '', phone: '', gstin: '', state: '', prefix: 'SYNTHETIC-INV-', invNo: 1001 + scale, fy: '2026-27', terms: 'SYNTHETIC\nUnicode café 🧾', bank: '', customFields: [], modules: {packing: true, dispatch: true, retail: true, gst: true}};
  const data = {items, parties, invoices, purchases, retail, audit};
  const snapshot = storageShape === 'missing' ? [] : [
    {key: 'shop4_settings', value: JSON.stringify(settings, null, 2) + '\n'},
    ...GROUPS.map(group => ({key: 'shop4_' + group, value: collectionRaw(data[group])})),
    {key: 'shop4_app_version', value: '5'},
    {key: 'v8_slcols', value: '{ "party": true, "total": true, "balance": false }\n'},
    {key: 'v8_compact', value: '1'},
    {key: 'shop4_synthetic_extra', value: '{  "unicode": "\\u00e9 🧾", "unused": null, "seed": ' + seed + ' }\n'},
    {key: 'shop4_synthetic_null', value: ' \nnull\t'},
    {key: 'unrelated_synthetic', value: 'SYNTHETIC unrelated raw value'}
  ];
  // Noncanonical numeric spelling proves that source raw strings are authoritative.
  const invoiceEntry = snapshot.find(row => row.key === 'shop4_invoices');
  if (scale && invoiceEntry) invoiceEntry.value = invoiceEntry.value.replace('"paid":20', '"paid":2e1');
  const cases = [
    ...INVOICE_CASES.map((c, index) => ({...c, collection: 'invoices', firstIndex: index < scale ? index : null, occurrences: Math.max(0, Math.ceil((scale - index) / INVOICE_CASES.length))})),
    ...PURCHASE_CASES.map((c, index) => ({...c, collection: 'purchases', firstIndex: index < purchases.length ? index : null, occurrences: Math.max(0, Math.ceil((purchases.length - index) / PURCHASE_CASES.length))}))
  ];
  const fixture = {kind: 'code-defined-synthetic-history', scale, seed, largePayloadChars, storageShape, snapshot,
    absentKeys: storageShape === 'missing' ? [...KNOWN_KEYS, 'shop4_app_version', 'v8_slcols', 'v8_compact', 'shop4_synthetic_extra', 'shop4_synthetic_null', 'unrelated_synthetic', ...ABSENT_KEYS] : [...ABSENT_KEYS], cases};
  fixture.summary = summarizeFixture(fixture);
  return fixture;
}

function summarizeFixture(fixture) {
  const rawByKey = new Map(fixture.snapshot.map(({key, value}) => [key, value]));
  const counts = Object.fromEntries(GROUPS.map(group => [group, rawByKey.has('shop4_' + group) ? JSON.parse(rawByKey.get('shop4_' + group)).length : 0]));
  const framed = JSON.stringify({snapshot: fixture.snapshot, absentKeys: fixture.absentKeys});
  return {assessment: 'fixture-integrity-only', productionSafety: 'unverified', seed: fixture.seed, scale: fixture.scale, storageShape: fixture.storageShape,
    largePayloadChars: fixture.largePayloadChars, counts, storedKeyCount: fixture.snapshot.length, absentKeyCount: fixture.absentKeys.length,
    utf8Bytes: fixture.snapshot.reduce((sum, row) => sum + Buffer.byteLength(row.value, 'utf8'), 0),
    serializedSnapshotUtf8Bytes: Buffer.byteLength(framed, 'utf8'), sha256: sha256(framed),
    caseCounts: Object.fromEntries(fixture.cases.map(c => [c.id, c.occurrences]))};
}

// Format wrappers are synthetic input artifacts, not successful restore evidence.
// V1 retains exact raw source values; V4 is a semantic view and necessarily omits
// unknown/preference/unrelated storage. Some histories are intentionally rejected
// by today's V4 guard (null/payment amount-only). Neither wrapper normalizes them.
function buildPrivateV1(fixture) {
  const backup = {format: 'xl-billing-private', version: 1, createdAt: CREATED_AT,
    payload: {records: fixture.snapshot.filter(row => supportedKey(row.key)).map(row => ({...row}))}};
  backup.checksum = {algorithm: 'SHA-256', value: sha256(JSON.stringify(backup))};
  return backup;
}
function buildLegacyV4(fixture) {
  const values = new Map(fixture.snapshot.map(row => [row.key, row.value]));
  const backup = {v: 4, exportDate: CREATED_AT};
  for (const group of ['settings', ...GROUPS]) if (values.has('shop4_' + group)) backup[group] = JSON.parse(values.get('shop4_' + group));
  return backup;
}

module.exports = {SCALES, DEFAULT_SEED, INVOICE_CASES, PURCHASE_CASES, generateFixture, summarizeFixture, buildPrivateV1, buildLegacyV4};
if (require.main === module) {
  const requested = process.argv[2];
  if (process.argv.length > 3 || (requested !== undefined && !/^(0|86|500|2000|5000)$/.test(requested))) {
    process.stderr.write('Usage: node qa/plan-a/historical-fixtures.cjs [0|86|500|2000|5000]\n');
    process.exitCode = 1;
  } else {
    const scales = requested === undefined ? SCALES : [Number(requested)];
    process.stdout.write(JSON.stringify({scope: 'synthetic-fixture-metadata-only', fixtures: scales.map(scale => generateFixture({scale}).summary)}, null, 2) + '\n');
  }
}
