'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),acorn=require('acorn'),crypto=require('node:crypto');
function factory(){
 const html=fs.readFileSync('index.html','utf8');let source;
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))for(const n of acorn.parse(m[1],{ecmaVersion:'latest'}).body)if(n.type==='FunctionDeclaration'&&n.id.name==='createXLStorage')source=m[1].slice(n.start,n.end);
 assert(source,'Recoverable storage is not implemented yet.');const ctx={crypto:crypto.webcrypto,TextEncoder,TextDecoder,structuredClone,console,setTimeout,clearTimeout};vm.createContext(ctx);vm.runInContext(source,ctx);return ctx.createXLStorage;
}
function port(initial){const values=new Map(Object.entries(initial||{}));let fault=()=>{};return {values,keys:()=>[...values.keys()],getItem:k=>values.has(k)?values.get(k):null,setItem(k,v){fault('set',k,v);values.set(k,String(v));},removeItem(k){fault('remove',k);values.delete(k);},fault:f=>fault=f};}
function locks(){let busy=false;return {async request(name,options,fn){if(busy)return fn(null);busy=true;try{return await fn({name});}finally{busy=false;}}};}
const before={'shop4_invoices':'[{"id":"synthetic-old","total":100,"paid":20}]','shop4_settings':'{"invNo":7}','shop4_audit':'[]','v8_compact':'1','shop4_future':'opaque synthetic data'};
function business(p){return Object.fromEntries([...p.values].filter(([k])=>!k.startsWith('xl_storage_')).sort(([a],[b])=>a.localeCompare(b)));}
async function store(p,l=locks(),extra={}){const s=factory()({storage:p,locks:l,crypto:crypto.webcrypto,onError:()=>{},...extra});await s.ready;return s;}
test('one logical operation commits data, counter, audit and unknown bytes together',async()=>{
 const p=port(before),s=await store(p);await s.run('Synthetic invoice',()=>{s.setRaw('shop4_invoices','[]');s.setRaw('shop4_settings','{"invNo":8}');s.setRaw('shop4_audit','[{"id":"synthetic-audit"}]');});
 assert.equal(p.getItem('shop4_invoices'),'[]');assert.equal(p.getItem('shop4_settings'),'{"invNo":8}');assert.equal(p.getItem('shop4_future'),before.shop4_future);assert.equal(p.getItem(s.keys.journal),null);
});
for(const target of ['journal','shop4_invoices','shop4_settings','shop4_audit','meta']){
 test('failure at '+target+' restores exact business bytes and reports no success',async()=>{
  const p=port(before),s=await store(p);let once=true;p.fault((op,key)=>{if(op==='set'&&key===(s.keys[target]||target)&&once){once=false;throw new DOMException('Synthetic quota','QuotaExceededError');}});
  await assert.rejects(s.run('Synthetic failing operation',()=>{s.setRaw('shop4_invoices','[]');s.setRaw('shop4_settings','{"invNo":8}');s.setRaw('shop4_audit','[{"id":"synthetic-audit"}]');}));
  assert.deepEqual(business(p),business(port(before)));assert.equal(p.getItem(s.keys.journal),null);
 });
}
test('unscoped writes are rejected; caught callback errors cannot commit partial state',async()=>{
 const p=port(before),s=await store(p);assert.throws(()=>s.setRaw('shop4_invoices','[]'));
 await assert.rejects(s.run('Caught failure',()=>{s.setRaw('shop4_invoices','[]');try{s.setRaw('nonbusiness_key','unsafe');}catch{}}));assert.deepEqual(business(p),business(port(before)));
});
test('failed rollback retains a recoverable journal and fresh startup rolls back',async()=>{
 const p=port(before),s=await store(p);let applying=false;
 p.fault((op,key,value)=>{if(op==='set'&&key==='shop4_settings'){applying=true;throw new Error('Synthetic interruption');}if(applying&&op==='set'&&key==='shop4_invoices'&&value===before.shop4_invoices)throw new Error('Synthetic rollback failure');});
 await assert.rejects(s.run('Interrupted synthetic write',()=>{s.setRaw('shop4_invoices','[]');s.setRaw('shop4_settings','{"invNo":8}');}));assert(p.getItem(s.keys.journal));assert.equal(p.getItem('shop4_invoices'),'[]');
 p.fault(()=>{});const recovered=await store(p);assert.deepEqual(business(p),business(port(before)));assert.equal(p.getItem(recovered.keys.journal),null);
});
test('corrupted journal blocks recovery without overwriting raw records',async()=>{
 const p=port(before);p.setItem('xl_storage_journal_v1','{broken');const raw=business(p);const s=factory()({storage:p,locks:locks(),crypto:crypto.webcrypto,onError:()=>{}});
 await assert.rejects(s.ready);assert.deepEqual(business(p),raw);assert.equal(p.getItem('xl_storage_journal_v1'),'{broken');await assert.rejects(s.run('Must stay blocked',()=>s.setRaw('shop4_invoices','[]')));
});
test('a stale second client cannot overwrite the first client commit',async()=>{
 const p=port(before),l=locks(),a=await store(p,l),b=await store(p,l);await a.run('First client',()=>a.setRaw('shop4_invoices','[]'));
 await assert.rejects(b.run('Stale second client',()=>b.setRaw('shop4_invoices',before.shop4_invoices)));assert.equal(p.getItem('shop4_invoices'),'[]');
});
test('missing reliable lock support fails closed while allowing raw recovery capture',async()=>{
 const p=port(before),s=await store(p,null);await assert.rejects(s.run('Unsupported writer',()=>s.setRaw('shop4_invoices','[]')));assert.equal(s.recoverySnapshot().shop4_invoices,before.shop4_invoices);
});
