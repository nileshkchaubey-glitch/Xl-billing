'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {shop}=require('../fixtures/shop.cjs');
function validate(after,before){const source=fs.readFileSync('index.html','utf8').match(/<script id="xl-record-validation">([\s\S]*?)<\/script>/)[1],ctx={};vm.createContext(ctx);vm.runInContext(source,ctx);return ctx.validateXLTransaction(after,before);}
const raw=d=>Object.fromEntries(Object.entries(d).map(([k,v])=>['shop4_'+k,JSON.stringify(v)]));
test('editing an existing invoice number cannot collide with another saved invoice',()=>{
  const d=shop(2),before=raw(d);d.invoices[1].invoiceNo=' inv-1001 ';
  const original=JSON.stringify(d);assert.throws(()=>validate(raw(d),before),/duplicate bill numbers/i);assert.equal(JSON.stringify(d),original);
});
test('changing either side of a historical duplicate sales-number pair requires review',()=>{
  for(const index of [0,1]){const d=shop(2);d.invoices[1].invoiceNo=d.invoices[0].invoiceNo;const before=raw(d);d.invoices[index].notes='Synthetic changed record';
    assert.throws(()=>validate(raw(d),before),/duplicate bill numbers/i);
  }
});
test('unrelated edits preserve byte-identical historical duplicate sales without renumbering',()=>{
  const d=shop(2);d.invoices[1].invoiceNo=d.invoices[0].invoiceNo;const before=raw(d);d.settings.terms='Synthetic changed terms';
  validate(raw(d),before);assert.equal(raw(d).shop4_invoices,before.shop4_invoices);
});
