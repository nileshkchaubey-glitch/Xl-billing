'use strict';
// Actual JSONBin entry functions, isolated from ordinary application bootstrap.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
const start = html.indexOf('// FEATURE 6:');
const end = html.indexOf('// DOM INJECTION', start);
if (start < 0 || end < start) throw new Error('JSONBin entry source boundary missing.');
const source = html.slice(start, end);
const message = 'Legacy JSONBin cloud sync is disabled for data safety';
const failures = [];
let checks = 0;
const verify = (ok, label) => { checks++; if (!ok) failures.push(label); };
(async () => {
  for (const mode of ['normal', 'missing', 'denied-dom', 'hostile-status']) {
    let forbidden = 0;
    const reject = () => { forbidden++; throw new Error('Synthetic forbidden access.'); };
    const node = {textContent: 'Uploaded successfully', setAttribute() {}};
    if (mode === 'hostile-status') Object.defineProperty(node, 'textContent', {set() { throw new Error('Synthetic hostile status element.'); }});
    const notifications = [];
    const context = {window: {}, document: {getElementById: mode === 'denied-dom' ? () => { throw new Error('Synthetic missing document.'); } : id => id === 'sync-status' && mode !== 'missing' ? node : null},
      toast: mode === 'missing' ? undefined : value => notifications.push(value), getSettings: reject,
      getItems: reject, getParties: reject, getInvoices: reject, getPurchases: reject, getRetail: reject,
      fetch: reject, confirm: reject, auditLog: reject, DB: {set: reject, del: reject}, location: {reload: reject}, setTimeout: reject};
    Object.defineProperty(context, 'localStorage', {get: reject});
    vm.runInNewContext(source, context, {timeout: 1000});
    for (const name of ['cloudPush', 'cloudPull', 'createNewBin']) {
      let result, threw = false;
      try { result = await context.window[name](); } catch { threw = true; }
      verify(!threw && result === false, mode + ':' + name + ':explicit-refusal');
      verify(forbidden === 0, mode + ':' + name + ':no-financial-or-provider-access');
    }
    if (mode === 'normal') verify(node.textContent.includes(message), 'fixed-status-text');
    verify(notifications.every(value => value.includes(message) && !/uploaded|created|downloaded|success/i.test(value)), mode + ':no-success-notification');
  }
  verify(!/api\.jsonbin\.io|X-Master-Key/.test(source), 'legacy-provider-bodies-removed');
  verify(!/id="s-jsonbin-(?:key|id)"/.test(html), 'no-credential-inputs');
  verify(!/s\.jsonbin(?:Key|Id)\s*=/.test(html), 'no-credential-save-assignment');
  for (const name of ['cloudPush', 'cloudPull', 'createNewBin']) {
    verify((html.match(new RegExp('window\\.' + name + '\\s*=', 'g')) || []).length === 1, name + ':single-winning-definition');
    verify(new RegExp('<button[^>]*disabled[^>]*onclick="' + name + '\\(\\)"').test(html), name + ':native-disabled-control');
  }
  verify(/id="sync-status"[^>]*role="status"[^>]*aria-live="polite"/.test(html), 'accessible-status');
  verify(!/Configure Settings → Cloud Sync \(JSONBin\.io\)|Select "Push ↑"|Use Cloud Sync \(JSONBin\)/.test(html), 'unsafe-sync-guide-retired');
  console.log(JSON.stringify({scope: 'A2 isolated entry functions and static surfaces', status: failures.length ? 'FAIL' : 'PASS', checks, failures}));
  process.exitCode = failures.length ? 1 : 0;
})().catch(() => { console.error('FAIL: A2 isolated test could not finish; diagnostic values omitted.'); process.exitCode = 1; });
