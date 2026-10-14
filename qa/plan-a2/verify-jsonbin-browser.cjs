'use strict';
// Full ordinary app script order, disposable profiles, synthetic data only.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const {chromium, firefox, webkit} = require('playwright');
const root = path.resolve(__dirname, '../..');
const sourcePath = process.argv[2] || path.join(root, 'index.html');
const html = fs.readFileSync(sourcePath);
const diagnostic = fs.readFileSync(path.join(root, 'storage-diagnostics.html'));
const disabled = 'Legacy JSONBin cloud sync is disabled for data safety';
const sentinel = 'SYNTHETIC-A2-SECRET';
const cases = [];
const demand = (ok, label) => { if (!ok) { const error = new Error(label); error.gate = label; throw error; } };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const configurations = [
  ['absent', {}], ['empty', {jsonbinKey: '', jsonbinId: ''}],
  ['populated', {jsonbinKey: sentinel + '-KEY', jsonbinId: sentinel + '-ID'}],
  ['whitespace', {jsonbinKey: '  ' + sentinel + '-KEY  ', jsonbinId: '\t' + sentinel + '-ID\n'}],
  ['hostile', {jsonbinKey: sentinel + '\"<img src=x onerror="window.__secretExecuted=true">', jsonbinId: sentinel + "'<script>bad</script>"}],
  ['typed', {jsonbinKey: false, jsonbinId: null}]
];
function values(extra = {}, pretty = false) {
  const settings = {shopName: 'SYNTHETIC QA ONLY', owner: 'SYNTHETIC', address: '', phone: '', gstin: '', state: '', prefix: 'SYNTHETIC-INV-', invNo: 1001, fy: '2026-27', terms: '', bank: '', customFields: [],
    modules: {packing: true, dispatch: true, retail: true, gst: true}, deletePin: '1234', invoiceEntry: {showBrand: true, showPacking: true, multiplyPacks: true}, preservedExtra: {flag: false, value: null}, ...extra};
  return {
    shop4_settings: JSON.stringify(settings, null, pretty ? 2 : undefined), shop4_app_version: '16',
    shop4_items: JSON.stringify([{id: 'SYNTHETIC-ITEM', name: 'SYNTHETIC ITEM', unit: 'Pcs', saleRate: 25, purchaseRate: 20, gst: 0}]),
    shop4_parties: JSON.stringify([{id: 'SYNTHETIC-CUSTOMER', name: 'SYNTHETIC CUSTOMER', type: 'customer', openingBal: 25}, {id: 'SYNTHETIC-SUPPLIER', name: 'SYNTHETIC SUPPLIER', type: 'supplier', openingBal: -25}]),
    shop4_invoices: JSON.stringify([{id: 'SYNTHETIC-OLD', invoiceNo: 'SYNTHETIC-INV-99', date: '2026-10-01', partyId: 'SYNTHETIC-CUSTOMER', partyName: 'SYNTHETIC CUSTOMER', items: [{name: 'SYNTHETIC ITEM', qty: 4, rate: 25, amt: 100}], subtotal: 100, total: 100, paid: 20, balance: 80, payments: [{date: '2026-10-01', amt: 20, mode: 'Cash'}], paymentType: 'Cash', dispatchStatus: 'pending'}]),
    shop4_purchases: JSON.stringify([{id: 'SYNTHETIC-PUR', billNo: 'SYNTHETIC-PUR-1', date: '2026-10-01', partyId: 'SYNTHETIC-SUPPLIER', partyName: 'SYNTHETIC SUPPLIER', total: 100, paid: 20, balance: 80, payments: [{date: '2026-10-01', amt: 20, mode: 'Cash'}]}]),
    shop4_retail: JSON.stringify([{id: 'SYNTHETIC-RETAIL', date: '2026-10-01', amount: 5}]), shop4_audit: '[]',
    v8_compact: '1', v8_slcols: '{ "amount": true }', shop4_synthetic_extra: '  {"unused":null} \n', unrelated_synthetic: 'unchanged'
  };
}
const snapshot = page => page.evaluate(() => {
  const keys = []; for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key === null) throw new Error('Incomplete synthetic enumeration.'); keys.push(key); }
  return Object.fromEntries(keys.sort().map(key => { const value = localStorage.getItem(key); if (value === null) throw new Error('Missing synthetic value.'); return [key, value]; }));
});
async function environment(browser, origin, initial) {
  const context = await browser.newContext({serviceWorkers: 'block', acceptDownloads: true});
  const external = [], pageErrors = [];
  await context.route('**/*', route => {
    const url = route.request().url();
    if (![origin + '/seed', origin + '/index.html', origin + '/storage-diagnostics.html'].includes(url)) {
      external.push(/jsonbin\.io/i.test(url) ? 'JSONBin' : 'other'); return route.abort('blockedbyclient');
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', error => pageErrors.push(digest(error.name + ':' + error.message)));
  await page.goto(origin + '/seed');
  await page.evaluate(data => { for (const [key, value] of Object.entries(data)) localStorage.setItem(key, value); }, initial);
  await context.addInitScript(() => {
    window.__a2Writes = []; window.__a2ConfirmCalls = 0;
    for (const method of ['setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function(...args) { window.__a2Writes.push({method, key: method === 'clear' ? null : String(args[0])}); return original.apply(this, args); };
    }
  });
  const seeded = await snapshot(page);
  await page.goto(origin + '/index.html', {waitUntil: 'load'});
  await page.waitForTimeout(350); // Existing 200ms settings/PIN and 80ms UI tasks.
  return {context, page, external, pageErrors, seeded};
}
async function settingsPage(page) {
  await page.evaluate(() => window.nav('settings'));
  await page.waitForSelector('#s-delete-pin', {state: 'attached'});
}
async function runCase(browser, origin, name, initial, task) {
  const env = await environment(browser, origin, initial);
  let outcome = {engine: browser.browserType().name(), browserVersion: browser.version(), case: name, status: 'PASS'};
  try {
    await task(env);
    demand(env.external.length === 0 && env.pageErrors.length === 0, 'scenario-errors-or-network');
    if (env.observation) { outcome.status = 'OBSERVED_UNSAFE_STARTUP'; outcome.startupWrites = env.startupWrites; }
  }
  catch (error) { outcome.status = 'FAIL'; outcome.failure = error.gate || 'harness-or-application-error'; outcome.stage = env.stage || 'scenario'; outcome.errorType = error.name; }
  finally { if (env.rawSettingsReserialized !== undefined) outcome.rawSettingsReserialized = env.rawSettingsReserialized; outcome.externalAttempts = env.external.length; outcome.pageErrorCount = env.pageErrors.length; cases.push(outcome); await env.context.close(); }
}
async function blockedActions(env) {
  const {page} = env;
  demand(env.pageErrors.length === 0 && env.external.length === 0, 'full-bootstrap-errors-or-network');
  demand(same(await snapshot(page), env.seeded), 'stable-bootstrap-changed-data');
  await settingsPage(page);
  const before = await snapshot(page);
  demand(await page.locator('#s-jsonbin-key,#s-jsonbin-id').count() === 0, 'credential-inputs-still-visible');
  demand((await page.locator('#sync-status').innerText()).includes(disabled), 'disabled-status-missing');
  demand(await page.locator('#sync-status').getAttribute('role') === 'status' && await page.locator('#sync-status').getAttribute('aria-live') === 'polite', 'status-not-accessible');
  const privacy = await page.evaluate(secret => ({exposed: Array.from(document.querySelectorAll('input,textarea')).some(node => node.value.includes(secret)) || document.body.innerText.includes(secret), executed: window.__secretExecuted === true}), sentinel);
  demand(!privacy.exposed && !privacy.executed, 'credential-value-exposed-or-executed');
  for (const decision of [true, false]) for (const name of ['cloudPush', 'cloudPull', 'createNewBin']) {
    const result = await page.evaluate(async ({name, decision}) => {
      window.confirm = () => { window.__a2ConfirmCalls++; return decision; };
      window.__a2Writes = [];
      const status = document.getElementById('sync-status'); status.textContent = 'Uploaded successfully';
      document.getElementById('toast').textContent = '';
      const refused = await window[name]();
      return {refused, writes: window.__a2Writes.length, confirms: window.__a2ConfirmCalls, status: status.textContent, toast: document.getElementById('toast').textContent};
    }, {name, decision});
    demand(result.refused === false && result.writes === 0 && result.confirms === 0, 'action-did-not-fail-closed');
    demand(result.status === disabled && result.toast === disabled, 'action-misleading-notification');
    demand(same(await snapshot(page), before), 'action-changed-raw-storage');
    demand(env.external.length === 0, 'action-attempted-network');
    const button = page.locator('button[onclick="' + name + '()"]');
    demand(await button.isDisabled() && await button.getAttribute('aria-describedby') === 'sync-status', 'dangerous-button-enabled');
    // Native click must be suppressed; invoking the installed UI handler directly
    // must still reach the guarded function, rather than a retained old closure.
    await button.evaluate(node => { node.click(); node.onclick.call(node, new Event('click')); });
    demand(same(await snapshot(page), before) && env.external.length === 0, 'UI-handler-changed-data-or-network');
    demand(await page.evaluate(() => window.__a2Writes.length) === 0, 'UI-handler-attempted-storage-write');
  }
  // Cancel is a normal navigation without Save; no secret display or writes.
  await page.evaluate(() => window.nav('dashboard'));
  demand(same(await snapshot(page), before), 'settings-cancel-changed-data');
  await settingsPage(page);
  await page.evaluate(() => {
    for (const id of ['s-jsonbin-key', 's-jsonbin-id']) { const input = document.createElement('input'); input.id = id; input.value = 'SYNTHETIC injected replacement'; document.body.appendChild(input); }
    window.saveSettings();
  });
  demand(same(await snapshot(page), before), 'canonical-settings-save-changed-values-or-credentials');
  await page.reload({waitUntil: 'load'}); await settingsPage(page);
  demand(same(await snapshot(page), before) && env.external.length === 0, 'reload-changed-data-or-network');
  demand((await page.locator('#sync-status').innerText()).includes(disabled), 'reload-status-misleading');
  demand(await page.locator('#s-jsonbin-key,#s-jsonbin-id').count() === 0, 'reload-reintroduced-credential-inputs');
  demand(await page.evaluate(secret => !document.body.innerText.includes(secret) && !Array.from(document.querySelectorAll('input,textarea')).some(node => node.value.includes(secret)), sentinel), 'reload-exposed-credentials');
}
async function missingAndDenied(env) {
  const {page} = env; await settingsPage(page); const before = await snapshot(page);
  const result = await page.evaluate(async () => {
    for (const name of ['cloudPush', 'cloudPull', 'createNewBin']) document.querySelector('button[onclick="' + name + '()"]')?.remove();
    for (const id of ['sync-status', 'toast', 's-jsonbin-key', 's-jsonbin-id']) document.getElementById(id)?.remove();
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage'), settings = window.getSettings;
    let forbidden = 0; const reject = () => { forbidden++; throw new Error('Synthetic SecurityError.'); };
    Object.defineProperty(window, 'localStorage', {configurable: true, get: reject}); window.getSettings = reject; window.confirm = reject;
    const results = []; window.__a2Writes = [];
    try { for (const name of ['cloudPush', 'cloudPull', 'createNewBin']) results.push(await window[name]()); }
    finally { Object.defineProperty(window, 'localStorage', descriptor); window.getSettings = settings; }
    return {results, forbidden, writes: window.__a2Writes.length};
  });
  demand(result.forbidden === 0 && result.writes === 0 && result.results.every(value => value === false), 'missing-or-denied-state-not-refused');
  demand(same(await snapshot(page), before) && env.external.length === 0, 'missing-state-mutated-or-requested');
}
async function backupCompatibility(env, browser, origin) {
  const {page} = env; env.stage = 'open-settings'; await settingsPage(page); const before = await snapshot(page);
  env.stage = 'actual-export-button';
  const requested = page.waitForEvent('download');
  await page.locator('#page-settings button[onclick="exportData()"]').click();
  env.stage = 'download-event'; const download = await requested;
  const archive = fs.readFileSync(await download.path(), 'utf8');
  demand(JSON.parse(archive).format === 'xl-billing-private', 'actual-export-format-changed');
  demand(same(await snapshot(page), before), 'actual-export-changed-data');
  env.stage = 'empty-target-bootstrap'; const target = await environment(browser, origin, {});
  try {
    env.stage = 'empty-target-settings'; await settingsPage(target.page);
    await target.page.evaluate(() => { window.confirm = () => true; });
    env.stage = 'actual-V1-import-input'; await target.page.locator('#import-file').setInputFiles({name: 'SYNTHETIC-private.json', mimeType: 'application/json', buffer: Buffer.from(archive)});
    env.stage = 'wait-for-V1-restore';
    await target.page.waitForFunction(() => !!localStorage.getItem('shop4_invoices'));
    demand(same(await snapshot(target.page), Object.fromEntries(Object.entries(before).filter(([key]) => key !== 'unrelated_synthetic'))), 'V1-UI-restore-raw-mismatch');
    env.stage = 'V1-reload'; await target.page.waitForTimeout(1500); // Actual guarded restore's scheduled reload.
    demand(same(await snapshot(target.page), Object.fromEntries(Object.entries(before).filter(([key]) => key !== 'unrelated_synthetic'))), 'V1-post-reload-mismatch');
    const restored = await snapshot(target.page);
    env.stage = 'occupied-import-input'; await target.page.locator('#import-file').setInputFiles({name: 'SYNTHETIC-repeat.json', mimeType: 'application/json', buffer: Buffer.from(archive)});
    await target.page.waitForTimeout(150);
    demand(same(await snapshot(target.page), restored), 'occupied-UI-restore-overwrote-data');
    demand(target.external.length === 0 && target.pageErrors.length === 0, 'restore-errors-or-network');
  } finally { await target.context.close(); }
  const legacy = {v: 4, exportDate: '2026-10-14T00:00:00.000Z'};
  for (const key of ['settings', 'items', 'parties', 'invoices', 'purchases', 'retail', 'audit']) legacy[key] = JSON.parse(before['shop4_' + key]);
  env.stage = 'legacy-target-bootstrap'; const empty = await environment(browser, origin, {});
  try {
    await empty.page.evaluate(() => { window.confirm = () => true; });
    env.stage = 'actual-V4-import-input';
    await empty.page.locator('#import-file').setInputFiles({name: 'SYNTHETIC-v4.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(legacy))});
    await empty.page.waitForFunction(() => !!localStorage.getItem('shop4_invoices'));
    const restored = await snapshot(empty.page);
    for (const key of ['settings', 'items', 'parties', 'invoices', 'purchases', 'retail', 'audit']) {
      demand(same(JSON.parse(restored['shop4_' + key]), legacy[key]), 'V4-section-semantic-mismatch');
    }
    env.stage = 'V4-scheduled-reload'; await empty.page.waitForTimeout(1500);
    demand(same(await snapshot(empty.page), restored), 'V4-post-reload-mismatch');
    demand(empty.external.length === 0 && empty.pageErrors.length === 0, 'V4-errors-or-network');
  } finally { await empty.context.close(); }
}
async function noncanonicalAndStartup(env) {
  const {page} = env; await settingsPage(page); const before = await snapshot(page);
  demand(same(before, env.seeded), 'open-pretty-settings-changed-bytes');
  await page.evaluate(() => window.nav('dashboard'));
  demand(same(await snapshot(page), before), 'cancel-pretty-settings-changed-bytes');
  await settingsPage(page); await page.evaluate(() => window.saveSettings());
  const after = await snapshot(page);
  demand(same(JSON.parse(after.shop4_settings), JSON.parse(before.shop4_settings)), 'pretty-settings-properties-changed');
  demand(same(Object.entries(after).filter(([key]) => key !== 'shop4_settings'), Object.entries(before).filter(([key]) => key !== 'shop4_settings')), 'pretty-save-changed-other-keys');
  env.rawSettingsReserialized = after.shop4_settings !== before.shop4_settings;
}
async function startupObservation(env) {
  const writes = await env.page.evaluate(() => window.__a2Writes.length);
  demand(writes > 0 && !same(await snapshot(env.page), env.seeded), 'existing-uncontrolled-startup-not-observed');
  env.startupWrites = writes; env.observation = true;
}
async function main() {
  const server = http.createServer((req, res) => {
    const body = req.url === '/index.html' ? html : req.url === '/storage-diagnostics.html' ? diagnostic : req.url === '/seed' ? Buffer.from('<!doctype html><body>SYNTHETIC seed origin</body>') : null;
    res.writeHead(body ? 200 : 404, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}); res.end(body || 'not found');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  try {
    for (const type of [chromium, firefox, webkit]) {
      const browser = await type.launch({headless: true});
      try {
        for (const [name, config] of configurations) await runCase(browser, origin, 'blocked-' + name, values(config), blockedActions);
        await runCase(browser, origin, 'missing-DOM-and-denied-storage', values(configurations[2][1]), missingAndDenied);
        await runCase(browser, origin, 'private-V1-UI-and-V4-compatibility', values(configurations[2][1]), env => backupCompatibility(env, browser, origin));
        await runCase(browser, origin, 'pretty-settings-roundtrip', values(configurations[3][1], true), noncanonicalAndStartup);
        const migrating = values(); delete migrating.shop4_app_version;
        const rows = JSON.parse(migrating.shop4_invoices); delete rows[0].payments; migrating.shop4_invoices = JSON.stringify(rows);
        await runCase(browser, origin, 'existing-startup-writes-observation', migrating, startupObservation);
      } finally { await browser.close(); }
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
  const failures = cases.filter(row => row.status === 'FAIL');
  const report = {scope: 'A2 full-script synthetic browser acceptance', sourceSha256: digest(html), node: process.version, playwright: require('playwright/package.json').version, status: failures.length ? 'FAIL' : 'PASS', cases, noProductionData: true};
  if (process.env.A2_EVIDENCE_DIR) {
    const directory = path.resolve(process.env.A2_EVIDENCE_DIR);
    demand(directory !== root && !directory.startsWith(root + path.sep), 'evidence-must-be-outside-checkout');
    fs.mkdirSync(directory, {recursive: true}); fs.writeFileSync(path.join(directory, 'browser-results.json'), JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify(report)); process.exitCode = failures.length ? 1 : 0;
}
main().catch(() => { console.error('FAIL: A2 browser harness could not complete; private diagnostics omitted.'); process.exitCode = 1; });
