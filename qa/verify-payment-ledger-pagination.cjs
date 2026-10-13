'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert.doesNotMatch(html, /\/home\/claude\/v9base\.html|V16_END|echo "Done\. Lines:/,
  'No accidentally rendered shell commands or build path should remain in the HTML');

const count = (text, substring) => text.split(substring).length - 1;
const ledgerSection = html.indexOf('// Payment Ledger shows 20 payment entries per page');
const ledgerEnd = html.indexOf('window.getAllPayments = function(){', ledgerSection);
assert.ok(ledgerSection > 0 && ledgerEnd > ledgerSection, 'Missing final ledger renderer');
const ledgerCode = html.slice(ledgerSection, ledgerEnd);
new vm.Script(ledgerCode, {filename:'payment-ledger-page.js'});

const pageSection = html.indexOf('const PAGE_SIZE = 20;');
const pageEnd = html.indexOf('// 1. CANCEL INVOICE', pageSection);
assert.ok(pageSection > 0 && pageEnd > pageSection);
const paginationCode = html.slice(pageSection, pageEnd);
new vm.Script(paginationCode, {filename:'shared-pagination.js'});

const payments = Array.from({length:63}, (_, index) => ({
  _invId:'invoice-'+index, _payIdx:index % 4, _invNo:'INV-'+(1001+index),
  _party:'Example Customer '+index,
  _invTotal:500, _invBal:0,
  date:index<34?'2026-10-13':index<54?'2026-10-12':'2026-10-11',
  amt:index===62?50:100,
  mode:index===62?'Discount':'Cash',
  type:index===62?'discount':'payment',
  note:''
}));

const elements = Object.create(null);
function get(id) {
  if(!elements[id]) elements[id] = {
    value:'',innerHTML:'',selectionStart:0,focusCalled:false,
    focus() {this.focusCalled=true;},
    setSelectionRange(start) {this.selectionStart=start;},
    scrollIntoView() {this.scrolled=true;}
  };
  return elements[id];
}
const context = {
  console,
  document:{getElementById:get},
  getAllPayments:()=>payments,
  fc:n=>'₹'+Number(n).toFixed(2),
  fmtDate:date=>date,
  ptBadge:()=>''
};
context.window=context;
const vmContext=vm.createContext(context);
vm.runInContext(paginationCode,vmContext);
vm.runInContext(ledgerCode,vmContext);
assert.equal(context.PAGE_SIZE,20);
assert.equal(typeof context.renderPageBtns,'function');

const visibleRows=()=>count(get('page-payments').innerHTML,'class="pay-row"');
const pageText=()=>get('page-payments').innerHTML;

// All 63 synthetic payments are included in summary; only 20 rendered per page.
context.renderPaymentLedger();
assert.equal(visibleRows(),20);
assert.match(pageText(), /1–20 of 63/);
assert.match(pageText(), /₹6200\.00/); // 62 payments, 1 discount
assert.match(pageText(), /₹50\.00/);
assert.match(pageText(), /Entries Shown<\/div><div class="sc-val b">63<\/div>/);
assert.match(pageText(), /xlLedgerGoPage\(2\)/);
assert.match(pageText(), /received on this page/);
assert.match(pageText(), /editPayment\('invoice-0',0\)/);
assert.match(pageText(), /deletePayment\('invoice-0',0\)/);
assert.doesNotMatch(pageText(), /invoice-60/);

context.xlLedgerGoPage(2);
assert.equal(visibleRows(),20);
assert.match(pageText(), /21–40 of 63/);
assert.match(pageText(), /invoice-21/);

context.xlLedgerGoPage(3);
assert.equal(visibleRows(),20);
assert.match(pageText(), /41–60 of 63/);

context.xlLedgerGoPage(4);
assert.equal(visibleRows(),3);
assert.match(pageText(), /61–63 of 63/);
assert.match(pageText(), /₹6200\.00/,'Full-period totals must not become page-only totals');

context.xlLedgerGoPage(900);
assert.equal(visibleRows(),3);
assert.match(pageText(), /61–63 of 63/,'Out-of-range pages must clamp');

get('pay-filter-date').value='2026-10-13';
context.xlLedgerFilterChanged('date');
assert.equal(visibleRows(),20);
assert.match(pageText(), /1–20 of 34/);
assert.match(pageText(), /Entries Shown<\/div><div class="sc-val b">34<\/div>/);
assert.match(pageText(), /₹3400\.00/);

get('pay-filter-date').value='';
get('pay-filter-party').value='Customer 3';
get('pay-filter-party').selectionStart=10;
context.xlLedgerFilterChanged('party');
assert.equal(visibleRows(),11); // Customer 3 and 30-39
assert.doesNotMatch(pageText(), /xlLedgerGoPage\(2\)/);
assert.equal(get('pay-filter-party').focusCalled,true);
assert.equal(get('pay-filter-party').selectionStart,10);

context.clearPayFilters();
assert.equal(get('pay-filter-date').value,'');
assert.equal(get('pay-filter-party').value,'');
assert.equal(visibleRows(),20);
assert.match(pageText(), /1–20 of 63/);

// The UI accepts and escapes filter input without changing any invoices.
get('pay-filter-party').value='" onfocus="bad';
context.xlLedgerFilterChanged('party');
assert.ok(pageText().includes('value="&quot; onfocus=&quot;bad"'));
assert.equal(visibleRows(),0);

// Payment row data is not altered by navigation, filters or rendering.
assert.equal(payments.length,63);
assert.equal(payments[0].amt,100);
assert.equal(payments[62].amt,50);
assert.equal(payments[62].type,'discount');
console.log('PASS: Payment Ledger 20-row pages, totals, discounts, date/search resets, clear filters, safe rendering and stray text cleanup.');
