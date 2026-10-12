'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),acorn=require('acorn');
const fixtures=require('../fixtures/historical.cjs');
const names=['round2','moneyPaise','parseMoneyInput','financialState','billBalance','recordedPaid','preparePaymentHistory','allowPayment','reconcilePayment'];
function context(){
 const html=fs.readFileSync('index.html','utf8');
 const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].flatMap(m=>acorn.parse(m[1],{ecmaVersion:'latest'}).body.filter(n=>n.type==='FunctionDeclaration'&&names.includes(n.id.name)).map(n=>m[1].slice(n.start,n.end))).join('\n');
 const ctx={isActive:()=>true,paymentError:()=>false,fc:String,document:{getElementById:()=>null}};vm.createContext(ctx);vm.runInContext(source,ctx);return ctx;
}
test('historical opening balance is decoded without changing the original record',()=>{
 const c=context(),r=structuredClone(fixtures.openingInvoice),before=JSON.stringify(r);
 assert.equal(c.financialState(r).opening,20);assert.equal(c.recordedPaid(r),20);assert.equal(JSON.stringify(r),before);
});
test('explicit payments preserve an opening aggregate without inventing receipts',()=>{
 const c=context(),r=structuredClone(fixtures.openingInvoice);assert(c.allowPayment(r,10));c.preparePaymentHistory(r);r.payments.push({amt:10,mode:'Cash'});c.reconcilePayment(r);
 assert.equal(r.openingPaid,20);assert.equal(r.payments.length,1);assert.equal(r.paid,30);assert.equal(r.balance,70);
 r.payments[0].amt=15;c.reconcilePayment(r);assert.equal(r.paid,35);r.payments.pop();c.reconcilePayment(r);assert.equal(r.paid,20);
});
test('purchase discounts reduce balance while remaining in their historical fields',()=>{
 const c=context(),r=structuredClone(fixtures.discountedPurchase),before=JSON.stringify(r);
 assert.equal(c.allowPayment(r,480),false);assert.equal(JSON.stringify(r),before);assert(c.allowPayment(r,470));
 c.preparePaymentHistory(r);r.payments.push({amt:470,mode:'Cash'});c.reconcilePayment(r);
 assert.equal(r.paid,490);assert.equal(r.balance,0);assert.equal(r.discount,10);assert.equal(r.discounts[0].amt,10);
});
test('conflicting nonempty history is blocked and kept byte-for-byte intact',()=>{
 const c=context(),r=structuredClone(fixtures.conflictInvoice),before=JSON.stringify(r);assert.equal(c.allowPayment(r,10),false);assert.equal(JSON.stringify(r),before);
});
test('money input rejects fractional paise, infinity and unsafe integers',()=>{
 const c=context();for(const value of ['0.006','-0.01','Infinity','1e100'])assert(Number.isNaN(c.parseMoneyInput(value)));
 for(const [value,want]of [['0.01',0.01],['0.10',0.1],['1.23',1.23],['',0]])assert.equal(c.parseMoneyInput(value),want);
});
test('removing the last dated receipt does not invent a new opening balance',()=>{
 const c=context(),r=structuredClone(fixtures.discountedPurchase);c.preparePaymentHistory(r);r.payments.pop();c.reconcilePayment(r);assert.equal(r.paid,0);assert.equal(r.balance,490);
});
