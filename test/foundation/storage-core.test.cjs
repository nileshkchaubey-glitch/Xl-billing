'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),acorn=require('acorn'),crypto=require('node:crypto');
function factory(){
 const html=fs.readFileSync('index.html','utf8');let source;
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))for(const n of acorn.parse(m[1],{ecmaVersion:'latest'}).body)if(n.type==='FunctionDeclaration'&&n.id.name==='createXLStorage')source=m[1].slice(n.start,n.end);
 assert(source,'Recoverable storage is not implemented yet.');const ctx={crypto:crypto.webcrypto,TextEncoder,TextDecoder,structuredClone,console,setTimeout,clearTimeout};vm.createContext(ctx);vm.runInContext(source,ctx);return ctx.createXLStorage;
}
function port(initial){const values=new Map(Object.entries(initial||{}));let fault=()=>{};return {values,keys:()=>[...values.keys()],getItem(k){fault('get',k);return values.has(k)?values.get(k):null;},setItem(k,v){fault('set',k,v);values.set(k,String(v));},removeItem(k){fault('remove',k);values.delete(k);},fault:f=>fault=f};}
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
test('a read interrupted by another writer never exposes a partial value',async()=>{
 const p=port(before),s=await store(p);let count=0;
 p.fault((op,key)=>{if(op==='get'&&key==='shop4_invoices'&&++count===2){p.values.set('xl_storage_journal_v1','synthetic pending journal');p.values.set('shop4_invoices','[]');}});
 assert.throws(()=>s.getRaw('shop4_invoices'));
});
test('backup snapshot capture rejects a writer that starts during its reads',async()=>{
 const p=port(before),s=await store(p);let count=0;
 p.fault((op,key)=>{if(op==='get'&&key==='shop4_invoices'&&++count===2){p.values.set('xl_storage_journal_v1','synthetic pending journal');p.values.set('shop4_invoices','[]');}});
 assert.throws(()=>s.snapshot());
});
test('notification failure cannot roll back a verified completed save',async()=>{
 const p=port(before),s=await store(p,locks(),{onCommit:()=>{throw new Error('Synthetic observer error');}});
 await s.run('Verified write',()=>s.setRaw('shop4_invoices','[]'));assert.equal(p.getItem('shop4_invoices'),'[]');assert.equal(p.getItem(s.keys.journal),null);
});
test('a real interrupted synthetic writer is recovered before the next read',async()=>{
 const os=require('node:os'),path=require('node:path'),cp=require('node:child_process');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'xl-synthetic-interruption-')),file=path.join(dir,'storage.json');fs.writeFileSync(file,JSON.stringify(before));
 const source=factory().toString();
 const script=`const fs=require('fs'),crypto=require('crypto').webcrypto;const create=(${source});const file=process.argv[1];const read=()=>JSON.parse(fs.readFileSync(file,'utf8'));const storage={keys:()=>Object.keys(read()),getItem:k=>read()[k]??null,setItem(k,v){const data=read();data[k]=String(v);fs.writeFileSync(file,JSON.stringify(data));if(k==='shop4_invoices')process.exit(41);},removeItem(k){const data=read();delete data[k];fs.writeFileSync(file,JSON.stringify(data));}};const s=create({storage,locks:{request:async(n,o,f)=>f({name:n})},crypto});s.ready.then(()=>s.run('Synthetic process interruption',()=>{s.setRaw('shop4_invoices','[]');s.setRaw('shop4_settings','{"invNo":8}');}));`;
 const child=cp.spawnSync(process.execPath,['-e',script,file],{encoding:'utf8'});assert.equal(child.status,41,child.stderr);
 const p=port(JSON.parse(fs.readFileSync(file,'utf8')));assert(p.getItem('xl_storage_journal_v1'));assert.equal(p.getItem('shop4_invoices'),'[]');const s=await store(p);assert.deepEqual(business(p),business(port(before)));assert.equal(p.getItem(s.keys.journal),null);fs.rmSync(dir,{recursive:true,force:true});
});
test('interruption after commit marker rolls forward with exact checked after values',async()=>{
 const p=port(before),s=await store(p);let cleanupFailed=false;
 p.fault((op,key,value)=>{if(op==='remove'&&key===s.keys.journal){cleanupFailed=true;throw new Error('Synthetic cleanup interruption');}if(cleanupFailed&&op==='set'&&key==='shop4_settings'&&value===before.shop4_settings)throw new Error('Synthetic rollback interruption');});
 await assert.rejects(s.run('Synthetic committed interruption',()=>{s.setRaw('shop4_invoices','[]');s.setRaw('shop4_settings','{"invNo":8}');}));assert(p.getItem(s.keys.journal));
 p.fault(()=>{});const recovered=await store(p);assert.equal(p.getItem('shop4_invoices'),'[]');assert.equal(p.getItem('shop4_settings'),'{"invNo":8}');assert.equal(p.getItem(recovered.keys.journal),null);await recovered.run('After repeated recovery',()=>recovered.setRaw('v8_compact','0'));assert.equal(p.getItem('v8_compact'),'0');
});
test('writer refuses a batch larger than startup recovery capacity before any persisted change',async()=>{const p=port(before),s=await store(p);await assert.rejects(s.run('Synthetic oversized key batch',()=>{for(let i=0;i<10001;i++)s.setRaw('shop4_synthetic_'+i,'synthetic bytes');}),/limit|large/i);assert.deepEqual(business(p),business(port(before)));assert.equal(p.getItem(s.keys.journal),null);});
