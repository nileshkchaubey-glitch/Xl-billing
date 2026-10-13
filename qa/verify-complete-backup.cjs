'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {webcrypto}=require('node:crypto');
const {TextEncoder}=require('node:util');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const match=html.match(/<script id="xl-complete-backup">([\s\S]*?)<\/script>/);
assert.ok(match,'Complete private backup script must be bundled in standalone HTML.');
new vm.Script(match[1],{filename:'xl-complete-backup.js'});
function storage(initial={}){
  const rows=new Map(Object.entries(initial));
  let failAt=null,calls=0,onRead=null;
  const obj={
    get length(){return rows.size;},
    key:i=>[...rows.keys()][i]??null,
    getItem(k){if(onRead)onRead(k,obj);return rows.has(k)?rows.get(k):null;},
    setItem(k,v){calls++;if(calls===failAt)throw Error('Simulated QuotaExceededError');rows.set(k,String(v));},
    removeItem(k){rows.delete(k);},
    setFailAt(n){failAt=n;calls=0;},
    onRead(fn){onRead=fn;},
    values(){return Object.fromEntries(rows);}
  };
  return obj;
}
const settings={shopName:'Synthetic Business',invNo:1003,fy:'2026-27',deletePinHash:'example-only-not-real'};
const sales=[
  {id:'sale1',invoiceNo:'INV-1001',date:'2026-10-12',total:300,paid:100,balance:200,payments:[{amt:100,date:'2026-10-12'}]},
  {id:'sale2',invoiceNo:'INV-1002',date:'2026-10-13',total:120,paid:120,balance:0,payments:[{amt:120,date:'2026-10-13'}]}
];
const initial=()=>({
  shop4_settings:JSON.stringify(settings),
  shop4_items:JSON.stringify([{id:'product1',name:'Dummy paper cup',saleRate:5}]),
  shop4_parties:JSON.stringify([{id:'party1',name:'Dummy Customer'}]),
  shop4_invoices:JSON.stringify(sales),
  shop4_purchases:'[]',shop4_retail:'[]',
  shop4_audit:JSON.stringify([{id:'audit1',type:'payment',entityId:'sale1'}]),
  shop4_app_version:'5',
  shop4_future_field:'{"keep":"all raw bytes"}',
  v8_slcols:'{"amount":true}',v8_compact:'1',
  unrelated_storage:'unchanged'
});
const boot=()=>{
  const window={};
  const ctx={window,crypto:webcrypto,TextEncoder,console,Date};
  vm.runInNewContext(match[1],ctx,{filename:'xl-complete-backup.js'});
  return window.XLCompleteBackup;
};
async function main(){
  const core=boot();
  const src=storage(initial());
  const old=JSON.stringify(src.values());
  const archive=await core.encode(src);
  assert.equal(archive.format,'xl-billing-private');
  assert.equal(archive.version,1);
  assert.equal(archive.checksum.algorithm,'SHA-256');
  assert.equal(archive.checksum.value.length,64);
  assert.equal(JSON.stringify(src.values()),old,'Export must be strictly read-only');
  const decoded=await core.decode(JSON.stringify(archive));
  assert.equal(decoded.counts.invoices,2);
  assert.equal(decoded.counts.audit,1);
  assert.equal(decoded.rows.length,11,'All 11 current XL Billing raw keys are preserved');
  assert.equal(decoded.rows.find(r=>r[0]==='shop4_future_field')[1],src.getItem('shop4_future_field'));
  assert.equal(decoded.rows.find(r=>r[0]==='v8_compact')[1],'1');
  assert.ok(!decoded.rows.some(r=>r[0]==='unrelated_storage'));
  // Isolated empty profile may contain a harmless app-version marker.
  const restored=storage({shop4_app_version:'5'});
  assert.equal(core.occupied(restored).length,0);
  core.restore(restored,decoded);
  assert.deepEqual(restored.values(),Object.fromEntries(Object.entries(initial()).filter(([k])=>k!=='unrelated_storage')));
  assert.equal(restored.getItem('shop4_import_pending'),null);
  assert.deepEqual(JSON.parse(restored.getItem('shop4_invoices')),sales);

  // Existing data is NEVER overwritten, even if app_version looks fresh.
  const populated=storage({shop4_app_version:'5',shop4_invoices:'[{"id":"real-owner-record"}]'});
  const populatedRaw=JSON.stringify(populated.values());
  assert.throws(()=>core.restore(populated,decoded),/Existing billing data/);
  assert.equal(JSON.stringify(populated.values()),populatedRaw);

  // Other app-preference keys mark a non-blank profile, too.
  assert.deepEqual(Array.from(core.occupied(storage({v8_slcols:'{}'}))),['v8_slcols']);

  // Tamper and missing signature fail without touching any storage.
  const edited=JSON.parse(JSON.stringify(archive));
  edited.payload.records.find(r=>r.key==='shop4_invoices').value='[]';
  await assert.rejects(core.decode(JSON.stringify(edited)),/checksum mismatch/);
  const truncated={...archive,checksum:undefined};
  await assert.rejects(core.decode(JSON.stringify(truncated)),/Unsupported or incomplete/);
  const duplicated=JSON.parse(JSON.stringify(archive));
  duplicated.payload.records.push({...duplicated.payload.records[0]});
  duplicated.checksum.value=await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(core.signed(duplicated)))
    .then(x=>Buffer.from(x).toString('hex'));
  await assert.rejects(core.decode(JSON.stringify(duplicated)),/duplicate/);

  // Simulated quota failure: all newly written raw bytes roll back.
  const limited=storage({shop4_app_version:'5'});
  const before=JSON.stringify(limited.values());
  limited.setFailAt(5);
  assert.throws(()=>core.restore(limited,decoded),/prior empty-profile bytes were verified/);
  assert.equal(JSON.stringify(limited.values()),before);

  // An interrupted marker blocks further capture/import; never erased as part of export.
  const interrupted=storage({shop4_import_pending:'{"v":1}',shop4_invoices:'[{"id":"partial"}]'});
  await assert.rejects(core.encode(interrupted),/previous import is unfinished/i);
  assert.ok(core.occupied(interrupted).includes('shop4_import_pending'));

  // A write racing with checksum calculation must refuse an apparently verified backup.
  const changing=storage(initial());
  const wrapper={subtle:{digest:async(...args)=>{
    changing.setItem('shop4_invoices','[{"id":"race"}]');
    return webcrypto.subtle.digest(...args);
  }}};
  const window={};
  vm.runInNewContext(match[1],{window,crypto:wrapper,TextEncoder,console,Date});
  await assert.rejects(window.XLCompleteBackup.encode(changing),/Records changed during backup/);

  // Empty collections and no audit key are valid and are not fabricated.
  const legacy=storage({shop4_settings:'{}',shop4_items:'[]',shop4_parties:'[]',
    shop4_invoices:'[]',shop4_purchases:'[]',shop4_retail:'[]'});
  const legacyBackup=await core.decode(JSON.stringify(await core.encode(legacy)));
  assert.equal(legacyBackup.counts.audit,0);
  assert.ok(!legacyBackup.rows.some(r=>r[0]==='shop4_audit'));

  assert.match(html,/async function exportData\(\)\{[\s\S]*?XLCompleteBackup\.encode\(localStorage\)/);
  assert.match(html,/function importData\(input\)\{[\s\S]*?XLCompleteBackup\.decode\(raw\)/);
  assert.match(html,/XLLegacyImportGuard\.parse\(raw\)/,'V4 import path must remain');
  assert.match(html,/if\(verified\)window\.XLCompleteBackup\.restore\(localStorage,parsed\)/);
  console.log('PASS: signed full export, exact-byte restore, backup corruption, quota rollback, old V4 compatibility and race refusal.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
