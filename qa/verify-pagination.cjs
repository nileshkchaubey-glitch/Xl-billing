'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function extract(start, end, beginAt = 0) {
  const a = html.indexOf(start, beginAt);
  assert.ok(a >= 0, 'Missing snippet: ' + start);
  const b = html.indexOf(end, a + start.length);
  assert.ok(b > a, 'Missing end marker: ' + end);
  return html.slice(a, b);
}

function input(value = '') {
  const listeners = {};
  return {
    value, checked: false, innerHTML: '',
    addEventListener(name, cb) { (listeners[name] ||= []).push(cb); },
    emit(name) { for (const fn of listeners[name] || []) fn(); }
  };
}

const ids = [
  'sl-summary', 'sales-table', 'sl-from', 'sl-to', 'sl-srch',
  'pl-summary', 'purchase-table', 'pl-from', 'pl-to', 'pl-srch',
  'pl-due-only', 'items-table', 'item-srch', 'parties-table', 'party-srch'
];
const elements = Object.fromEntries(ids.map(id => [id, input()]));
const syntheticInvoices = Array.from({ length: 45 }, (_, i) => ({
  id: 'inv-' + i, invoiceNo: 'INV-' + String(1000 + i), date: '2026-10-13',
  partyName: 'Example Customer ' + i, notes: '', total: 100, paid: 20,
  balance: 80, paymentType: 'Cash', dispatchStatus: 'pending'
}));
const syntheticPurchases = Array.from({ length: 45 }, (_, i) => ({
  id: 'pur-' + i, date: '2026-10-13', partyName: 'Supplier ' + i,
  billNo: 'PUR-' + i, total: 50, paid: i % 2 ? 50 : 0, balance: i % 2 ? 0 : 50,
  payType: 'Cash'
}));
const syntheticItems = Array.from({ length: 45 }, (_, i) => ({
  id: 'item-' + i, name: 'Product ' + i, unit: 'Pcs', saleRate: 3, purchaseRate: 2
}));
const syntheticParties = Array.from({ length: 45 }, (_, i) => ({
  id: 'party-' + i, name: 'Customer ' + i, phone: '', type: 'customer', area: ''
}));

const ctx = {
  console,
  slPill: 'all',
  getInvoices: () => syntheticInvoices,
  getPurchases: () => syntheticPurchases,
  getItems: () => syntheticItems,
  getParties: () => syntheticParties,
  fmtDate: date => date,
  fc: amount => '₹' + Number(amount || 0).toFixed(2),
  ptBadge: () => '',
  v16DotClose: () => {},
  document: {
    getElementById: id => elements[id] || null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  }
};
ctx.window = ctx;
const vmContext = vm.createContext(ctx);

// The V13 pager lives inside a closure in production. Evaluate the identical
// helper and state together so V14/V16 consumers run against the real contract.
vm.runInContext(extract('const PAGE_SIZE = 20;', '// 1. CANCEL INVOICE'), vmContext);
assert.equal(ctx.PAGE_SIZE, 20);
assert.equal(ctx.pgState.sales, 1);
assert.equal(typeof ctx.renderPageBtns, 'function');

const v13PurchaseNav = extract(
  'window.plNavPage = function(p) { pgState.purchases = p; renderPurchaseList(); };',
  '\n\nconst _origRenderPurchaseList'
);
vm.runInContext(v13PurchaseNav, vmContext);
const v13ItemAndParty = extract(
  'window.itemNavPage = function(p) { pgState.items = p; renderItems(); };',
  '// 10.',
);
vm.runInContext(v13ItemAndParty, vmContext);

// Load actual final V14 purchase and V16 sales implementations, not stand-ins.
const v14Section = html.indexOf('// 3. PURCHASE LIST — add balance, pay button, due filter');
vm.runInContext(
  extract('window.renderPurchaseList = function() {', '// 4. PURCHASE PAYMENT LEDGER PAGE', v14Section),
  vmContext
);
const v16Section = html.indexOf('// FIX 2: renderSalesList — restore 3-dot menu, fix status');
vm.runInContext(
  extract('window.slNavPage = function(p) {', 'window.v16DotToggle = function(id, e)', v16Section),
  vmContext
);

// V13 search/date listeners should reset the shared page and re-render after
// inline onchange/oninput handlers, avoiding stale page 3 views.
vm.runInContext(
  extract('function resetListPageOnFilter(ids, kind, render) {', '// 16. MIGRATION'),
  vmContext
);
const countRows = (container, token) => (container.innerHTML.match(new RegExp(token, 'g')) || []).length;

ctx.renderSalesList();
assert.equal(countRows(elements['sales-table'], '<tr ondblclick="viewInvoice'), 20);
assert.match(elements['sales-table'].innerHTML, /1–20 of 45/);
assert.match(elements['sales-table'].innerHTML, /slNavPage\(2\)/);
ctx.slNavPage(2);
assert.equal(ctx.pgState.sales, 2);
assert.match(elements['sales-table'].innerHTML, /21–40 of 45/);
assert.equal(countRows(elements['sales-table'], '<tr ondblclick="viewInvoice'), 20);
ctx.slNavPage(3);
assert.match(elements['sales-table'].innerHTML, /41–45 of 45/);
assert.equal(countRows(elements['sales-table'], '<tr ondblclick="viewInvoice'), 5);
assert.match(elements['sl-summary'].innerHTML, /4500\.00/);
ctx.pgState.sales = 9;
ctx.renderSalesList();
assert.equal(ctx.pgState.sales, 3, 'Out-of-range sales page must clamp to last available page');
assert.match(elements['sales-table'].innerHTML, /41–45 of 45/);

ctx.pgState.sales = 3;
elements['sl-srch'].value = 'INV-1005';
ctx.renderSalesList(); // Simulate the app's existing inline oninput handler.
elements['sl-srch'].emit('input'); // The registered reset listener follows.
assert.equal(ctx.pgState.sales, 1);
assert.match(elements['sales-table'].innerHTML, /INV-1005/);
assert.doesNotMatch(elements['sales-table'].innerHTML, /slNavPage\(2\)/);
elements['sl-srch'].value = '';
ctx.pgState.sales = 2;
ctx.slPill = 'paid';
ctx.renderSalesList();
assert.match(elements['sales-table'].innerHTML, /No invoices found/);
ctx.slPill = 'all';

ctx.renderPurchaseList();
assert.match(elements['purchase-table'].innerHTML, /1–20 of 45/);
assert.match(elements['purchase-table'].innerHTML, /plNavPage\(2\)/);
assert.equal(countRows(elements['purchase-table'], '<tr ondblclick="viewPurchase'), 20);
ctx.plNavPage(2);
assert.equal(ctx.pgState.purchases, 2);
assert.match(elements['purchase-table'].innerHTML, /21–40 of 45/);
ctx.plNavPage(3);
assert.match(elements['purchase-table'].innerHTML, /41–45 of 45/);
assert.equal(countRows(elements['purchase-table'], '<tr ondblclick="viewPurchase'), 5);
ctx.pgState.purchases = 8;
ctx.renderPurchaseList();
assert.equal(ctx.pgState.purchases, 3);
assert.match(elements['purchase-table'].innerHTML, /41–45 of 45/);
ctx.pgState.purchases = 3;
elements['pl-srch'].value = 'Supplier 2';
ctx.renderPurchaseList();
elements['pl-srch'].emit('input');
assert.equal(ctx.pgState.purchases, 1);
assert.match(elements['purchase-table'].innerHTML, /Supplier 2/);
assert.doesNotMatch(elements['purchase-table'].innerHTML, /41–45 of 45/);

// Shared helper remains available for Items and Parties list pagination.
elements['pl-srch'].value = '';
ctx.renderItems();
assert.match(elements['items-table'].innerHTML, /1–20 of 45/);
ctx.itemNavPage(3);
assert.match(elements['items-table'].innerHTML, /41–45 of 45/);
ctx.renderParties();
assert.match(elements['parties-table'].innerHTML, /1–20 of 45/);
ctx.partyNavPage(2);
assert.match(elements['parties-table'].innerHTML, /21–40 of 45/);
ctx.pgState.items = 3;
elements['item-srch'].value = 'Product 3';
ctx.renderItems();
elements['item-srch'].emit('input');
assert.equal(ctx.pgState.items, 1);
ctx.pgState.parties = 3;
elements['party-srch'].value = 'Customer 3';
ctx.renderParties();
elements['party-srch'].emit('input');
assert.equal(ctx.pgState.parties, 1);

// Confirm this repair does not modify records or add storage writes.
assert.equal(syntheticInvoices.length, 45);
assert.equal(syntheticPurchases.length, 45);
assert.equal(syntheticItems.length, 45);
assert.equal(syntheticParties.length, 45);
assert.ok(html.includes('window.pgState = pgState;'));
assert.ok(html.includes('window.renderPageBtns = renderPageBtns;'));
console.log('PASS: all four list pagers, 20-row boundaries, search reset, shared state, and stale page clamp.');
