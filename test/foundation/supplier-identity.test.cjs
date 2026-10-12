'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),acorn=require('acorn'),crypto=require('node:crypto');
const {shop}=require('../fixtures/shop.cjs');

function context(){
  const html=fs.readFileSync(process.env.XL_HTML||'index.html','utf8');
  const sources=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  const validation=html.match(/<script id="xl-record-validation">([\s\S]*?)<\/script>/)[1];
  const names=['createXLStorage','createXLBackup','verifyXLRecoveryPin'];
  const extracted=sources.flatMap(m=>acorn.parse(m[1],{ecmaVersion:'latest'}).body
    .filter(n=>n.type==='FunctionDeclaration'&&names.includes(n.id.name)).map(n=>m[1].slice(n.start,n.end))).join('\n');
  const ctx={TextEncoder,structuredClone,setTimeout,clearTimeout,crypto:crypto.webcrypto};
  vm.createContext(ctx);vm.runInContext(validation+'\n'+extracted,ctx);return ctx;
}
function fixture(){
  const d=shop(2);
  d.settings.deletePinSalt='synthetic-pm01';
  d.settings.deletePinHash=crypto.createHash('sha256').update('synthetic-pm01:2468').digest('hex');
  d.parties.push({id:'p3',name:'Synthetic Second Supplier',type:'supplier',openingBal:0});
  return d;
}
const raw=d=>Object.fromEntries(Object.entries(d).map(([k,v])=>['shop4_'+k,JSON.stringify(v)]));
const cloneBill=(d,changes={})=>({...structuredClone(d.purchases[0]),id:'u2',...changes});
function port(initial){const values=new Map(Object.entries(initial));return {values,keys:()=>[...values.keys()],getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};}
const snapshot=p=>Object.fromEntries(p.values);
function store(ctx,p){return ctx.createXLStorage({storage:p,locks:{request:async(name,opts,fn)=>fn({name})},crypto:crypto.webcrypto,
  validate:(a,b,o)=>{ctx.createXLBackup({crypto:crypto.webcrypto}).validate(a,false);ctx.validateXLTransaction(a,b,o);},
  verifyRecoveryPin:(records,pin)=>ctx.verifyXLRecoveryPin(records,pin,crypto.webcrypto)});}
const codec=ctx=>ctx.createXLBackup({crypto:crypto.webcrypto,validate:r=>ctx.validateXLTransaction(r,{}, {restore:true})});

test('purchase vendor number is scoped to stable supplier ID, even when display names match',()=>{
  const ctx=context(),d=fixture(),before=raw(d);d.parties[2].name=d.parties[1].name;
  d.purchases.push(cloneBill(d,{partyId:'p3',partyName:d.parties[1].name}));
  const after=raw(d);ctx.validateXLTransaction(after,before);ctx.validateXLTransaction(after,{}, {restore:true});
  assert.equal(d.purchases[1].billNo,'P-1');
});
test('saved business dates scope supplier numbers across the March 31 / April 1 financial-year boundary',()=>{
  const ctx=context(),d=fixture();d.purchases[0].date='2026-03-31';
  d.purchases.push(cloneBill(d,{date:'2026-04-01',createdAt:'2026-03-31T18:30:00.000Z'}));
  const original=JSON.stringify(d);ctx.validateXLTransaction(raw(d),{}, {restore:true});assert.equal(JSON.stringify(d),original);
});
test('same-supplier duplicate number in one financial year is rejected without normalizing source bytes',()=>{
  const ctx=context(),d=fixture();d.purchases.push(cloneBill(d,{billNo:' p-1 ',date:'2027-03-31'}));
  const original=raw(d);assert.throws(()=>ctx.validateXLTransaction(original,{}, {restore:true}),/duplicate.*supplier.*financial year/i);assert.deepEqual(raw(d),original);
});
for(const field of ['partyId','date'])test('colliding purchase numbers with missing '+field+' require review rather than name/date inference',()=>{
  const ctx=context(),d=fixture(),other=cloneBill(d);delete other[field];d.purchases.push(other);
  const original=raw(d);assert.throws(()=>ctx.validateXLTransaction(original,{}, {restore:true}),/ambiguous.*supplier.*financial year/i);assert.deepEqual(raw(d),original);
});
test('a display-name change does not create a new supplier identity',()=>{
  const ctx=context(),d=fixture();d.purchases.push(cloneBill(d,{partyName:'Synthetic Renamed Supplier'}));
  assert.throws(()=>ctx.validateXLTransaction(raw(d),{}, {restore:true}),/duplicate.*supplier.*financial year/i);
});
test('a unique legacy purchase without supplier/date and historical removed-master links remain portable',()=>{
  const ctx=context(),d=fixture();delete d.purchases[0].partyId;delete d.purchases[0].date;
  d.purchases.push(cloneBill(d,{billNo:'P-LEGACY-2',partyId:'removed-supplier'}));
  const original=raw(d);ctx.validateXLTransaction(original,{}, {restore:true});assert.deepEqual(raw(d),original);
});
test('unchanged historical ambiguity may be archived but cannot be edited or fully restored',async()=>{
  const ctx=context(),d=fixture();d.purchases.push(cloneBill(d));const before=raw(d);
  ctx.validateXLTransaction({...before,shop4_settings:JSON.stringify({...d.settings,terms:'Synthetic terms'})},before);
  const changed=structuredClone(d);changed.purchases[0].notes='Synthetic edit';
  assert.throws(()=>ctx.validateXLTransaction(raw(changed),before),/duplicate.*supplier.*financial year/i);
  const c=codec(ctx),file=await c.encode(before);await assert.rejects(c.decode(JSON.stringify(file)),/duplicate.*supplier.*financial year/i);
  assert.deepEqual(raw(d),before);
});
test('changing a purchase record ID or supplier link cannot evade duplicate validation',()=>{
  const ctx=context(),d=fixture(),before=raw(d);d.purchases.push(cloneBill(d,{partyId:'p3'}));
  const established=raw(d);ctx.validateXLTransaction(established,before);
  d.purchases[1].partyId='p2';assert.throws(()=>ctx.validateXLTransaction(raw(d),established),/duplicate.*supplier.*financial year/i);
  d.purchases[1].id='new-record-id';assert.throws(()=>ctx.validateXLTransaction(raw(d),established),/duplicate.*supplier.*financial year/i);
});
for(const partyId of ['missing-supplier','customer-only'])test('new purchase link '+partyId+' is refused without changing stored records',async()=>{
  const ctx=context(),d=fixture();d.parties.push({id:'customer-only',name:'Synthetic Customer Only',type:'customer'});
  const before=raw(d),p=port(before),s=store(ctx,p);await s.ready;
  const original=snapshot(p);d.purchases.push(cloneBill(d,{billNo:'P-LINK-2',partyId}));
  await assert.rejects(s.run('Synthetic invalid linked purchase',()=>s.setRaw('shop4_purchases',JSON.stringify(d.purchases))),/supplier.*link/i);
  assert.deepEqual(snapshot(p),original);
});
test('full batch preflight prevents partial writes when one purchase conflicts',async()=>{
  const ctx=context(),d=fixture(),p=port(raw(d)),s=store(ctx,p);await s.ready;const before=snapshot(p);
  d.purchases.push(cloneBill(d,{partyId:'p3'}),cloneBill(d,{id:'u3',billNo:' p-1 '}));
  await assert.rejects(s.run('Synthetic bulk/import purchase',()=>s.setRaw('shop4_purchases',JSON.stringify(d.purchases))),/duplicate.*supplier.*financial year/i);
  assert.deepEqual(snapshot(p),before);
});
test('private and legacy backups preserve exact multi-supplier and cross-year purchase bytes',async()=>{
  const ctx=context(),d=fixture();d.purchases.push(cloneBill(d,{partyId:'p3'}),cloneBill(d,{id:'u3',date:'2027-04-01'}));
  const records={...raw(d),shop4_future:'Synthetic opaque bytes'},c=codec(ctx),file=await c.encode(records);
  const decoded=await c.decode(JSON.stringify(file));assert.equal(decoded.verified,true);assert.deepEqual(JSON.parse(JSON.stringify(decoded.records)),records);
  const legacy=await c.decode(JSON.stringify({...d,v:5}));assert.equal(legacy.records.shop4_purchases,records.shop4_purchases);
});
for(const kind of ['adopt','restore'])test('locked '+kind+' accepts validated multi-supplier histories only after export proof, current PIN and owner confirmation',async()=>{
  const ctx=context(),d=fixture();d.purchases.push(cloneBill(d,{partyId:'p3'}));
  const records=raw(d),p=port({...records,xl_storage_meta_v1:JSON.stringify({v:1,id:'synthetic-prior',revision:1,signature:'synthetic-stale-signature'})}),s=store(ctx,p);
  await assert.rejects(s.ready);const original=snapshot(p),file=await s.exportRecovery();await s.verifyRecoveryExport(JSON.stringify(file));
  const candidate=kind==='restore'?(await codec(ctx).decode(JSON.stringify(await codec(ctx).encode(records)))).records:records;
  const ticket=await s.previewRecovery(candidate,kind);await assert.rejects(s.applyRecovery(ticket,{pin:'1111',confirmed:true}));assert.deepEqual(snapshot(p),original);
  await assert.rejects(s.applyRecovery(ticket,{pin:'2468',confirmed:false}));assert.deepEqual(snapshot(p),original);
  await s.applyRecovery(ticket,{pin:'2468',confirmed:true});assert.equal(p.getItem('shop4_purchases'),records.shop4_purchases);
  const fresh=store(ctx,p);await fresh.ready;
});
test('ambiguous locked adoption and restore retain original financial and coordination bytes',async()=>{
  for(const kind of ['adopt','restore']){
    const ctx=context(),d=fixture();d.purchases.push(cloneBill(d,{partyId:''}));
    const coordination=kind==='adopt'?{xl_storage_meta_v1:JSON.stringify({v:1,id:'synthetic-prior',revision:1,signature:'synthetic-stale-signature'})}:{xl_storage_journal_v1:'{synthetic-corrupt-journal'};
    const p=port({...raw(d),...coordination}),s=store(ctx,p);await assert.rejects(s.ready);
    const exportFile=await s.exportRecovery();await s.verifyRecoveryExport(JSON.stringify(exportFile));
    const original=snapshot(p);
    await assert.rejects(s.previewRecovery(raw(d),kind),/ambiguous.*supplier.*financial year/i);assert.deepEqual(snapshot(p),original);
  }
});
test('sales invoice numbering remains globally unique across suppliers and financial years',()=>{
  const ctx=context(),d=fixture();d.invoices[1].invoiceNo=d.invoices[0].invoiceNo;d.invoices[1].partyId='p3';d.invoices[1].date='2027-04-01';
  assert.throws(()=>ctx.validateXLTransaction(raw(d),{}, {restore:true}),/duplicate bill numbers/i);
});
