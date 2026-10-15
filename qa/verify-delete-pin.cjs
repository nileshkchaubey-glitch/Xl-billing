'use strict';
// Synthetic DOM events only; never uses real browser records.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('function getDeletePin()'),end=html.indexOf('// AUDIT saveInvoice',start);
assert(start>=0 && end>start);
const source=html.slice(start,end);
function setup(pin='1234'){
  const {document,window:dom}=parseHTML('<!doctype html><html><body><button id="trigger">Delete</button></body></html>');
  const data={settings:{deletePin:pin},invoices:[{id:'i1',invoiceNo:'INV-1',partyName:'Synthetic Customer',total:100,paid:20},{id:'i2',invoiceNo:'INV-2',total:50}],purchases:[{id:'p1',billNo:'PUR-1',total:10}],parties:[{id:'c1',name:'Customer'}],items:[{id:'t1',name:'Item'}]},audit=[],writes=[],toasts=[];
  const ctx={document,getSettings:()=>data.settings,getInvoices:()=>data.invoices,getPurchases:()=>data.purchases,getParties:()=>data.parties,getItems:()=>data.items,DB:{set(k,v){writes.push(k);data[k]=v;}},auditLog:(...a)=>audit.push(a),fc:v=>String(v),renderSalesList(){},renderPurchaseList(){},renderParties(){},renderItems(){},toast:s=>toasts.push(s),setTimeout(){}};
  ctx.window=ctx;vm.createContext(ctx);vm.runInContext(source,ctx);
  function open(id='i1'){ctx.delInvoice(id);const overlay=document.getElementById('del-pin-overlay');assert(overlay);for(const el of overlay.querySelectorAll('*'))for(const attr of el.attributes)if(/^on/.test(attr.name))new vm.Script(attr.value);return overlay;}
  function type(value){const input=document.getElementById('del-pin-inp');input.value=value;input.dispatchEvent(new dom.Event('input'));return input;}
  function click(id){document.getElementById(id).dispatchEvent(new dom.Event('click'));}
  function key(name){const event=new dom.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(event,'key',{value:name});document.getElementById('del-pin-inp').dispatchEvent(event);}
  return {ctx,document,dom,data,audit,writes,toasts,open,type,click,key};
}
const x=setup();x.open();
x.type('12');assert(x.document.getElementById('del-pin-ok').disabled,'partial PIN cannot enable delete');
x.type('9999');x.key('Enter');assert.equal(x.writes.length,0);assert.equal(x.audit.length,0);
x.type('1234');assert.equal(x.document.getElementById('del-pin-ok').disabled,false,'correct PIN enables delete');
const confirmed=x.document.getElementById('del-pin-ok');x.click('del-pin-ok');confirmed.dispatchEvent(new x.dom.Event('click'));assert.equal(x.data.invoices.length,1);assert.equal(x.data.invoices[0].id,'i2');assert.equal(x.audit.length,1);assert.equal(x.audit[0][2],'i1');assert.equal(x.document.getElementById('del-pin-overlay'),null);
// Detached or repeated confirm cannot delete twice.
x.ctx.delInvoice('i1');assert.equal(x.audit.length,1);
const y=setup('8"<>&9');const overlay=y.open();assert.doesNotMatch(overlay.innerHTML,/8"<>&9/,'PIN never embedded in markup');y.type('8"<>&9');y.key('Enter');assert.equal(y.audit.length,1);
const z=setup();z.open();z.type('1234');z.click('del-pin-cancel');assert.equal(z.writes.length,0);assert.equal(z.audit.length,0);assert.equal(z.document.getElementById('del-pin-overlay'),null);
z.open();z.key('Escape');assert.equal(z.writes.length,0);assert.equal(z.document.getElementById('del-pin-overlay'),null);
// Invoice text is literal and cannot create DOM handlers or images.
const h=setup();h.data.invoices[0].partyName='<img src=x onerror="bad()">';h.open();assert.equal(h.document.querySelector('img'),null);assert(h.document.getElementById('del-pin-label').textContent.includes('<img'));
// Opening another dialog invalidates the previous callback.
const a=setup();a.open();const old=a.document.getElementById('del-pin-ok');a.open('i2');old.dispatchEvent(new a.dom.Event('click'));assert.equal(a.writes.length,0);assert.equal(a.document.querySelectorAll('#del-pin-overlay').length,1);a.type('1234');a.key('Enter');assert.deepEqual(a.data.invoices.map(i=>i.id),['i1']);
for(const [fn,id,collection]of [['delPurchase','p1','purchases'],['delParty','c1','parties'],['delItem','t1','items']]){const t=setup();t.ctx[fn](id);t.type('1234');t.click('del-pin-ok');assert.equal(t.data[collection].length,0);assert.equal(t.audit.length,1);}
const b=setup();b.ctx.delInvoiceSafe('i1');b.type('1234');b.click('del-pin-ok');assert.equal(b.data.invoices.length,1);
console.log('PASS: delete PIN DOM events, wrong/default/custom PIN, click/Enter, Cancel/Escape, safe labels, stale dialogs, invoice/menu and shared entity deletes.');
