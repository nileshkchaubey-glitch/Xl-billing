'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
function extract(start,end,after=0){
  const a=html.indexOf(start,after);
  if(a<0)throw Error('Cannot find source start '+start);
  const b=html.indexOf(end,a+start.length);
  if(b<a)throw Error('Cannot find source end '+end);
  return html.slice(a,b);
}
const data={
  invoices:[{
    id:'inv-existing',invoiceNo:'INV-1001',partyName:'Example Customer',partyId:'cust1',
    items:[{id:'line1',name:'Dummy product',qty:2,rate:50,amt:100}],
    total:100,subtotal:100,paid:25,balance:75,dispatchStatus:'pending',
    payments:[{date:'2026-10-13',amt:25,mode:'Cash',note:''}]
  }],
  purchases:[{id:'pur-1',billNo:'PUR-1',partyName:'Test Supplier',total:100,paid:0,balance:100,payments:[]}],
  settings:{prefix:'INV-',invNo:1002,customFields:[]}
};
const events={toasts:[],audit:[],writes:[],close:[],nav:[]};
const elements={};
const field=(id,value='')=>{elements[id]={value};};
for(const [id,value] of Object.entries({
  'inv-party-id':'cust1','inv-party':'Example Customer','inv-date':'2026-10-13',
  'inv-due':'','inv-notes':'','inv-pay-type':'Cash','inv-dispatch':'pending',
  'pay-inv-id':'inv-existing','pay-amount':'','pay-discount':'',
  'pay-mode':'Cash','pay-note':'',
  'spa-inv-select':'inv-existing','spa-amount':'','spa-discount':'','spa-mode':'Cash','spa-note':'',
  'ep-amt':'','ep-mode':'Cash','ep-date':'2026-10-13','ep-note':'',
  'pur-pay-bill-id':'pur-1','pur-pay-amt':'0'
}))field(id,value);
const read=(key)=>JSON.parse(JSON.stringify(data[key]));
const save=(key,rows)=>{data[key]=JSON.parse(JSON.stringify(rows));events.writes.push(key)};
const ctx={
  Date,console,
  document:{getElementById:id=>elements[id]||null},
  editingInvId:'inv-existing',
  saleItems:[{id:'line1',name:'Dummy product',qty:2,rate:50,amt:100}],
  currentPage:'settings',currentViewInvId:'',
  getInvoices:()=>read('invoices'),getPurchases:()=>read('purchases'),
  getSettings:()=>read('settings'),
  DB:{set:save},toast:msg=>events.toasts.push(msg),
  nav:p=>events.nav.push(p),
  closeModal:name=>events.close.push(name),
  renderSalesList:()=>{},renderDashboard:()=>{},renderPaymentLedger:()=>{},
  viewInvoice:()=>{},today:()=> '2026-10-13',
  genId:()=>'inv-new-001',
  fc:x=>'₹'+Number(x||0).toFixed(2),
  nextTotals:{sub:100,disc:0,tax:0,tPct:0,total:100,paid:25,bal:75},
  calcSaleTotal:()=>ctx.nextTotals,
  auditLog:(...args)=>events.audit.push(args)
};
ctx.window=ctx;
const c=vm.createContext(ctx);
vm.runInContext(extract('function saveSaleInvoice(andPrint) {','function resetSaleForm()'),c);
vm.runInContext(extract('const _origSavePayment = window.savePayment;','// FEATURE 6:'),c);
vm.runInContext(extract('window.openStandalonePayModal = function(){','// 2. INVOICE VALIDATION'),c);
vm.runInContext(extract('window.saveEditPayment = function(invId, payIdx){','// Payment Ledger shows 20 payment entries'),c);
// The merged invoice/payment auditing wrappers must log only confirmed storage mutations.
vm.runInContext(extract('const _origSaveSaleInvoiceV15 = window.saveSaleInvoice;','// INVOICE-WISE SETTLEMENT PAYMENT MODAL'),c);

const invoice=()=>data.invoices.find(i=>i.id==='inv-existing');
const originalReceipts=JSON.stringify(invoice().payments);
const beforeAudit=()=>events.audit.length;
const saved=()=>events.writes.filter(k=>k==='invoices').length;

// Existing invoice edit never changes payment history, even when the form contains wrong paid.
let w=saved(),a=beforeAudit();
ctx.nextTotals={sub:150,disc:0,tax:0,tPct:0,total:150,paid:30,bal:120};
ctx.saveSaleInvoice(false);
assert.equal(saved(),w,'Editing paid from invoice form must not write');
assert.equal(beforeAudit(),a,'Rejected edit must not create fake audit entry');
assert.equal(invoice().total,100);
assert.equal(JSON.stringify(invoice().payments),originalReceipts);

ctx.nextTotals={sub:20,disc:0,tax:0,tPct:0,total:20,paid:25,bal:0};
ctx.saveSaleInvoice(false);
assert.equal(saved(),w,'Total smaller than recorded paid must not write');
assert.equal(beforeAudit(),a);

// Valid invoice detail edit adjusts balance, preserving actual payments and existing paid.
ctx.nextTotals={sub:150,disc:0,tax:0,tPct:0,total:150,paid:25,bal:125};
ctx.saveSaleInvoice(false);
assert.equal(saved(),w+1);
assert.equal(invoice().total,150);
assert.equal(invoice().paid,25);
assert.equal(invoice().balance,125);
assert.equal(JSON.stringify(invoice().payments),originalReceipts);
assert.equal(beforeAudit(),a+1,'Successful edit audit entry must refer to actual id');
assert.equal(events.audit.at(-1)[0],'edit');
assert.equal(events.audit.at(-1)[2],'inv-existing');

// Create: reject overpaid/invalid invoice and avoid a false "create" audit.
ctx.editingInvId=null;
ctx.nextTotals={sub:100,disc:0,tax:0,tPct:0,total:100,paid:101,bal:0};
w=saved();a=beforeAudit();
ctx.saveSaleInvoice(false);
assert.equal(saved(),w);
assert.equal(beforeAudit(),a);
assert.equal(data.settings.invNo,1002);

// Correct new invoice creates exactly one invoice and one audit.
ctx.nextTotals={sub:100,disc:0,tax:0,tPct:0,total:100,paid:25,bal:75};
ctx.saveSaleInvoice(false);
assert.equal(data.invoices.length,2);
assert.equal(data.settings.invNo,1003);
assert.equal(data.invoices.at(-1).paid,25);
assert.equal(data.invoices.at(-1).payments.length,1);
assert.equal(events.audit.at(-1)[0],'create');

// Pay modal: reject amounts greater than balance and cancelled invoices before data writes/audit.
elements['pay-amount'].value='126';
elements['pay-discount'].value='0';
w=saved();a=beforeAudit();
ctx.savePayment();
assert.equal(saved(),w);
assert.equal(beforeAudit(),a);
assert.equal(invoice().paid,25);

// Valid split receipt, including discount, records both and exactly one accurate audit entry.
elements['pay-amount'].value='35';
elements['pay-discount'].value='5';
ctx.savePayment();
assert.equal(invoice().paid,65);
assert.equal(invoice().balance,85);
assert.equal(invoice().payments.length,3);
assert.equal(events.audit.length,a+1);
assert.match(events.audit.at(-1)[4],/Paid: ₹35\.00, Discount: ₹5\.00/);

// Standalone payment: overpay blocked, valid allowed.
elements['spa-amount'].value='90';
elements['spa-discount'].value='0';
w=saved();
ctx.saveStandalonePayment();
assert.equal(saved(),w);
elements['spa-amount'].value='50';
ctx.saveStandalonePayment();
assert.equal(invoice().paid,115);
assert.equal(invoice().balance,35);

// Edit existing receipt: editing other payments must not cause overpayment.
elements['ep-amt'].value='200';
w=saved();
ctx.saveEditPayment('inv-existing',0);
assert.equal(saved(),w);
elements['ep-amt'].value='10';
ctx.saveEditPayment('inv-existing',0);
assert.equal(invoice().paid,100);
assert.equal(invoice().balance,50);
assert.equal(invoice().payments[0].amt,10);

// Invoices labelled cancelled cannot accept normal modal receipts.
const invs=read('invoices');
invs[0].status='cancelled';save('invoices',invs);
elements['pay-amount'].value='10';elements['pay-discount'].value='0';
w=saved();a=beforeAudit();
ctx.savePayment();
assert.equal(saved(),w);
assert.equal(beforeAudit(),a);

// Purchase audit must describe confirmed records, never a rejected submit.
ctx.savePurPayment=function(){
  const amount=Number(elements['pur-pay-amt'].value)||0;
  if(amount<=0)return;
  const purchases=read('purchases');
  purchases[0].payments.push({date:'2026-10-13',amt:amount});
  purchases[0].paid+=amount;
  save('purchases',purchases);
};
// The source wrapper calls _origSavePurPaymentV15 defined at evaluation time.
// Rebind by evaluating only the existing actual wrapper code with a fresh function.
const purchaseAudit=extract('const _origSavePurPaymentV15 = window.savePurPayment;','// INVOICE-WISE SETTLEMENT PAYMENT MODAL');
vm.runInContext(purchaseAudit,c);
elements['pur-pay-amt'].value='0';
a=beforeAudit();ctx.savePurPayment();
assert.equal(beforeAudit(),a);
elements['pur-pay-amt'].value='10';
ctx.savePurPayment();
assert.equal(beforeAudit(),a+1);
assert.equal(events.audit.at(-1)[0],'payment');
assert.equal(events.audit.at(-1)[2],'pur-1');

assert.equal(data.invoices.find(i=>i.id==='inv-existing').payments.filter(p=>p.amt>0).length,4);
console.log('PASS: invoice edit preserves paid/payment history, receipt overpay/discount/cancel guards, accurate confirmed audit, and unchanged rejected writes.');
