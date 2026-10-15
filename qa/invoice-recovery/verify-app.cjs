'use strict';
// Full application in an isolated DOM; storage, popup and records are synthetic.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom'),{webcrypto}=require('node:crypto');
const html=fs.readFileSync('index.html','utf8');
const helper=fs.readFileSync('qa/plan-a2/verify-billing-browser.cjs','utf8');
const fixture=vm.runInNewContext(helper.slice(helper.indexOf('const seed='),helper.indexOf('\nconst rows=[]'))+';seed');
async function launch(extra={}){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const popups=[],prints=[];
  const dom=new JSDOM(html,{url:'https://synthetic-billing.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
    w.scrollTo=()=>{};w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;Object.defineProperty(w.crypto,'subtle',{value:webcrypto.subtle});
    for(const [k,v]of Object.entries({...fixture,...extra}))w.localStorage.setItem(k,v);
    w.open=()=>{const p=new JSDOM('',{url:'https://synthetic-billing.test/print',runScripts:'dangerously',virtualConsole:vc}).window;p.focus=()=>{};p.print=()=>prints.push(p.document.body.textContent);popups.push(p);return p;};
  }});
  const w=dom.window;await new Promise(r=>w.addEventListener('load',r,{once:true}));
  const data=k=>JSON.parse(w.localStorage.getItem('shop4_'+k)||'[]');
  return {w,d:w.document,errors,prints,popups,data,close(){for(const p of popups)p.close();w.close();}};
}
let count=0;async function test(name,fn){await fn();count++;console.log('PASS '+name);}
(async()=>{
await test('edit then repeated Save & Print keeps one invoice, number and payment history',async()=>{
  const x=await launch();try{
    const original=x.data('invoices')[0],counter=x.data('settings').invNo;
    x.w.viewInvoice(original.id);x.w.editInvoice();
    x.d.getElementById('inv-notes').value='Updated synthetic note';
    x.d.querySelector('button[onclick="saveSaleInvoice(true)"]').click();
    x.d.querySelector('button[onclick="saveSaleInvoice(true)"]').click();
    assert.equal(x.data('invoices').length,1,'Save & Print must not create another invoice from an edit');
    assert.equal(x.data('settings').invNo,counter);assert.equal(x.data('invoices')[0].id,original.id);
    assert.deepEqual(x.data('invoices')[0].payments,original.payments);
    assert.equal(x.data('invoices')[0].notes,'Updated synthetic note');assert.deepEqual(x.errors,[]);
  }finally{x.close();}
});
await test('invoice Recycle Bin is available',async()=>{const x=await launch();try{assert(x.d.getElementById('page-invoice-recycle'),'Recycle Bin route must exist');assert.equal(x.w.localStorage.getItem('shop4_invoice_recycle'),null,'no archive key is written on startup');}finally{x.close();}});
function pin(x,value='1234') { const input=x.d.getElementById('del-pin-inp'); input.value=value;input.dispatchEvent(new x.w.Event('input',{bubbles:true}));x.d.getElementById('del-pin-ok').click(); }
function snapshot(x) { return Object.fromEntries(Object.keys(x.w.localStorage).sort().map(k=>[k,x.w.localStorage.getItem(k)])); }
await test('Update then Save & Print still updates same ID; explicit New Invoice starts fresh',async()=>{const x=await launch();try{
  const original=x.data('invoices')[0],counter=x.data('settings').invNo;
  x.w.editInvoiceFromList(original.id);x.d.getElementById('save-inv-btn').click();
  x.d.querySelector('button[onclick="saveSaleInvoice(true)"]').click();
  assert.equal(x.data('invoices').length,1);assert.equal(x.data('settings').invNo,counter);
  x.d.querySelector('a[data-pg="new-sale"]').click();assert.equal(x.d.getElementById('inv-party').value,'');
  assert.equal(x.d.getElementById('sale-page-title').textContent,'➕ New Invoice');assert.deepEqual(x.errors,[]);
}finally{x.close();}});
await test('new Save & Print reuses saved invoice on repeated click; print popup keeps invoice identity',async()=>{const x=await launch({shop4_invoices:'[]'});try{
  x.w.startNewInvoice();x.d.getElementById('inv-party').value='Synthetic Cash';
  const field=x.d.querySelector('[id^="sn-"]');field.value='Synthetic Item';field.dispatchEvent(new x.w.Event('input',{bubbles:true}));
  x.d.querySelector('[id^="srt-"]').value='10';x.d.querySelector('[id^="srt-"]').dispatchEvent(new x.w.Event('input',{bubbles:true}));
  x.d.querySelector('button[onclick="saveSaleInvoice(true)"]').click();x.d.querySelector('button[onclick="saveSaleInvoice(true)"]').click();
  assert.equal(x.data('invoices').length,1);assert.equal(x.data('settings').invNo,1002);
  await new Promise(r=>setTimeout(r,850));assert(x.popups.length>=1);assert(x.popups.every(p=>p.document.body.textContent.includes('SYNTHETIC-INV-1001')));assert.deepEqual(x.errors,[]);
}finally{x.close();}});
await test('delete archives complete invoice; reports/payment ledger exclude it; restore is exact',async()=>{const x=await launch();try{
  const original=x.data('invoices')[0],counter=x.data('settings').invNo;
  x.w.nav('sales-list');x.d.querySelector('#sales-table .dot-btn').click();x.d.querySelector('#sales-table .dot-menu .danger').click();
  pin(x,'9999');assert.equal(x.data('invoices').length,1);pin(x);
  assert.equal(x.data('invoices').length,0);assert.equal(x.data('invoice_recycle').length,1);assert.deepEqual(x.data('invoice_recycle')[0].invoice,original);
  assert.equal(x.w.getAllPayments().length,0);assert(!x.d.getElementById('sales-table').textContent.includes(original.invoiceNo));
  x.w.nav('reports');assert(!x.d.getElementById('page-reports').textContent.includes(original.invoiceNo));
  x.w.nav('invoice-recycle');assert(x.d.getElementById('invoice-recycle-list').textContent.includes(original.invoiceNo));
  x.d.querySelector('#invoice-recycle-list button').click();assert.equal(x.d.getElementById('del-pin-ok').textContent,'Restore');pin(x);
  assert.deepEqual(x.data('invoices'),[original]);assert.equal(x.data('invoice_recycle').length,0);assert.equal(x.data('settings').invNo,counter);
  assert.equal(x.w.getAllPayments().length,original.payments.length);assert.equal(x.data('audit').at(-1).type,'restore');assert.deepEqual(x.errors,[]);
}finally{x.close();}});
await test('stale reviewed invoice, restore ID/number conflicts and corrupted bin refuse changes',async()=>{
  for(const mode of ['stale','badBin','numberConflict','idConflict']){const x=await launch();try{
    const inv=x.data('invoices')[0];
    if(mode==='stale'){x.w.delInvoice(inv.id);x.w.localStorage.setItem('shop4_invoices',JSON.stringify([{...inv,notes:'Changed elsewhere'}]));const before=snapshot(x);pin(x);assert.deepEqual(snapshot(x),before);}
    else if(mode==='badBin'){x.w.localStorage.setItem('shop4_invoice_recycle','broken');const before=snapshot(x);x.w.delInvoice(inv.id);pin(x);assert.deepEqual(snapshot(x),before);}
    else{x.w.delInvoice(inv.id);pin(x);x.w.localStorage.setItem('shop4_invoices',JSON.stringify([{...inv,id:mode==='idConflict'?inv.id:'other',notes:'conflict'}]));const before=snapshot(x);x.w.restoreRecycledInvoice(inv.id);pin(x);assert.deepEqual(snapshot(x),before);}
    assert.deepEqual(x.errors,[]);
  }finally{x.close();}}
});
await test('destination, source and audit quota failures rollback exact keys and bytes',async()=>{
  for(const restore of [false,true])for(const fail of ['invoice_recycle','invoices','audit']){const x=await launch();try{
    const inv=x.data('invoices')[0];if(restore){x.w.delInvoice(inv.id);pin(x);}
    const before=snapshot(x),native=x.w.Storage.prototype.setItem;let rejected=false;
    x.w.Storage.prototype.setItem=function(k,v){if(!rejected&&k==='shop4_'+fail){rejected=true;throw new x.w.DOMException('Synthetic full disk','QuotaExceededError');}return native.call(this,k,v);};
    if(restore)x.w.restoreRecycledInvoice(inv.id);else x.w.delInvoice(inv.id);pin(x);
    assert(rejected);assert.deepEqual(snapshot(x),before);assert.match(x.d.getElementById('toast').textContent,/move failed/);assert.deepEqual(x.errors,[]);
  }finally{x.close();}}
});
await test('failed rollback keeps destination copy instead of deleting the last invoice',async()=>{const x=await launch();try{
  const inv=x.data('invoices')[0],nativeGet=x.w.Storage.prototype.getItem,nativeSet=x.w.Storage.prototype.setItem;let removed=false,wrongRead=true;
  x.w.Storage.prototype.setItem=function(k,v){if(k==='shop4_invoices'&&v==='[]')removed=true;else if(removed&&k==='shop4_invoices')throw new x.w.DOMException('Synthetic blocked rollback','QuotaExceededError');return nativeSet.call(this,k,v);};
  x.w.Storage.prototype.getItem=function(k){if(removed&&wrongRead&&k==='shop4_invoices'){wrongRead=false;return 'wrong readback';}return nativeGet.call(this,k);};
  x.w.delInvoice(inv.id);pin(x);assert.equal(x.data('invoice_recycle').length,1);assert.deepEqual(x.data('invoice_recycle')[0].invoice,inv);assert.match(x.d.getElementById('toast').textContent,/RECOVERY REQUIRED/);assert.deepEqual(x.errors,[]);
}finally{x.close();}});
await test('interrupted duplicate move can finish only with identical invoice bytes',async()=>{const x=await launch();try{
  const inv=x.data('invoices')[0];x.w.localStorage.setItem('shop4_invoice_recycle',JSON.stringify([{id:inv.id,deletedAt:new Date().toISOString(),invoice:inv}]));
  x.w.restoreRecycledInvoice(inv.id);pin(x);assert.deepEqual(x.data('invoices'),[inv]);assert.equal(x.data('invoice_recycle').length,0);assert.deepEqual(x.errors,[]);
}finally{x.close();}});
await test('pending import blocks moves and hostile invoice names are rendered literally',async()=>{const x=await launch();try{
  const inv=x.data('invoices')[0];x.w.localStorage.setItem('shop4_import_pending','{}');let before=snapshot(x);x.w.delInvoice(inv.id);pin(x);assert.deepEqual(snapshot(x),before);x.w.localStorage.removeItem('shop4_import_pending');
  x.w.localStorage.setItem('shop4_invoices',JSON.stringify([{...inv,partyName:'<img src=x onerror="bad()">'}]));x.w.delInvoice(inv.id);pin(x);x.w.nav('invoice-recycle');assert.equal(x.d.querySelector('#invoice-recycle-list img'),null);assert(x.d.getElementById('invoice-recycle-list').textContent.includes('<img'));assert.deepEqual(x.errors,[]);
}finally{x.close();}});
await test('Private V1 backup round-trip preserves Recycle Bin exact raw data without codec changes',async()=>{const x=await launch();try{
  const inv=x.data('invoices')[0];x.w.delInvoice(inv.id);pin(x);
  const backup=await x.w.XLCompleteBackup.encode(x.w.localStorage);const text=JSON.stringify(backup);const parsed=await x.w.XLCompleteBackup.decode(text);
  assert.equal(parsed.rows.find(([key])=>key==='shop4_invoice_recycle')[1],x.w.localStorage.getItem('shop4_invoice_recycle'));
  const raw=new Map(),storage={get length(){return raw.size;},key(i){return [...raw.keys()][i]??null;},getItem(k){return raw.get(k)??null;},setItem(k,v){raw.set(k,v);},removeItem(k){raw.delete(k);}};
  x.w.XLCompleteBackup.restore(storage,parsed);assert.equal(raw.get('shop4_invoice_recycle'),x.w.localStorage.getItem('shop4_invoice_recycle'));assert.equal(raw.get('shop4_invoices'),'[]');assert.deepEqual(x.errors,[]);
}finally{x.close();}});
await test('archived cancelled invoice survives reload and restores unchanged cancellation state',async()=>{
  const original={...JSON.parse(fixture.shop4_invoices)[0],status:'cancelled',dispatchStatus:'cancelled'};
  const entry={id:original.id,deletedAt:new Date().toISOString(),invoice:original};
  const x=await launch({shop4_invoices:'[]',shop4_invoice_recycle:JSON.stringify([entry])});try{
    x.w.nav('invoice-recycle');assert(x.d.getElementById('invoice-recycle-list').textContent.includes(original.invoiceNo));
    x.w.restoreRecycledInvoice(original.id);pin(x);assert.deepEqual(x.data('invoices'),[original]);assert.deepEqual(x.errors,[]);
  }finally{x.close();}
});
await test('explicit Clear All Data confirmation includes bin; cancelling preserves it',async()=>{const x=await launch();try{
  x.w.delInvoice(x.data('invoices')[0].id);pin(x);const before=snapshot(x);x.w.confirm=()=>false;x.w.clearAllData();assert.deepEqual(snapshot(x),before);
  const prompts=[];x.w.confirm=message=>{prompts.push(message);return true;};x.w.clearAllData();assert.equal(x.w.localStorage.getItem('shop4_invoice_recycle'),null);assert(prompts.some(p=>p.includes('Recycle Bin')));assert.deepEqual(x.errors,[]);
}finally{x.close();}});
console.log('PASS '+count+' full-app invoice recovery groups. Native browser/printing not certified.');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
