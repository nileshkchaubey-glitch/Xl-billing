'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {TextEncoder}=require('node:util');
const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
const match=html.match(/<script id="xl-backup-import-guard">([\s\S]*?)<\/script>/);
assert.ok(match,'A self-contained import guard script must be present.');
new vm.Script(match[1],{filename:'xl-backup-import-guard.js'});

function storage(initial={}){
  const rows=new Map(Object.entries(initial));let throwAt=null,attempts=0;
  return {
    get length(){return rows.size;},
    key:i=>[...rows.keys()][i]??null,
    getItem:k=>rows.has(k)?rows.get(k):null,
    setItem(k,v){attempts++;if(attempts===throwAt)throw Error('Synthetic quota exceeded');rows.set(k,String(v));},
    removeItem:k=>rows.delete(k),
    setFailureAt:n=>{throwAt=n;attempts=0;},
    values:()=>Object.fromEntries(rows)
  };
}
function prepare(localStorage=storage()){
  const listeners={};
  const window={};
  const document={addEventListener:(name,fn)=>{listeners[name]=fn;}};
  const ctx=vm.createContext({window,document,localStorage,TextEncoder,console,Date});
  vm.runInContext(match[1],ctx,{filename:'xl-backup-import-guard.js'});
  return {guard:window.XLLegacyImportGuard,events:listeners,ctx};
}
const fixture=()=>({
  v:4,exportDate:'2026-10-12T15:20:00.000Z',settings:{shopName:'SYNTHETIC',invNo:1002,fy:'2026-27'},
  items:[{id:'item-1',name:'Sample',saleRate:50}],
  parties:[{id:'party-1',name:'Synthetic Customer'}],
  invoices:[{id:'invoice-1',invoiceNo:'INV-1001',total:100,paid:25,balance:75,payments:[{amt:25,date:'2026-10-12'}]}],
  purchases:[],retail:[]
});
const source=prepare().guard;
const candidate=source.parse(JSON.stringify(fixture()));
assert.equal(candidate.counts.invoices,1);
assert.equal(candidate.counts.items,1);
assert.equal(candidate.rows.length,6);
const s=storage({shop4_app_version:'5'});
assert.deepEqual(Array.from(source.occupied(s)),[]);
assert.equal(source.restore(s,candidate).invoices,1);
assert.deepEqual(JSON.parse(s.getItem('shop4_invoices')),fixture().invoices);
assert.equal(s.getItem(source.marker),null);
assert.equal(s.getItem('shop4_app_version'),'5');
assert.equal(s.getItem('shop4_settings'),JSON.stringify(fixture().settings));

// No accidental destructive restoration on existing real-like browser records.
const existing=storage({shop4_app_version:'5',shop4_invoices:'[{"id":"older-receipt"}]'});
const prior=JSON.stringify(existing.values());
assert.throws(()=>source.restore(existing,candidate),/Existing billing data/);
assert.equal(JSON.stringify(existing.values()),prior);

// Validate all input before writes. Unsupported/partial backup fails closed.
for(const [label,change] of [
  ['broken JSON',()=>'{'],
  ['unsupported version',()=>JSON.stringify({...fixture(),v:7})],
  ['missing invoices',()=>{const b=fixture();delete b.invoices;return JSON.stringify(b);}],
  ['malformed parties',()=>JSON.stringify({...fixture(),parties:{}})],
  ['duplicate ID',()=>{const b=fixture();b.items.push({...b.items[0]});return JSON.stringify(b);}],
  ['unknown fields',()=>JSON.stringify({...fixture(),unexpectedHistory:[]})],
  ['invalid payment',()=>{const b=fixture();b.invoices[0].payments=[{amt:'bad'}];return JSON.stringify(b);}],
  ['negative total',()=>{const b=fixture();b.invoices[0].total=-1;return JSON.stringify(b);}]
]){
  const z=storage(),before=JSON.stringify(z.values());
  assert.throws(()=>source.parse(change()),/./,label);
  assert.equal(JSON.stringify(z.values()),before,label+' must never mutate browser records');
}

// Optional historical audit must be preserved if actually included.
const audit=fixture();audit.audit=[{id:'audit-1',type:'payment',details:'Synthetic'}];
const snap=source.parse(JSON.stringify(audit));
const dst=storage();
source.restore(dst,snap);
assert.deepEqual(JSON.parse(dst.getItem('shop4_audit')),audit.audit);

// Mid-import quota/error rolls back all inserted records, preserving version marker.
const limited=storage({shop4_app_version:'5'});
const initial=JSON.stringify(limited.values());
limited.setFailureAt(4); // marker, settings, items, then injected quota failure
assert.throws(()=>source.restore(limited,candidate),/rolled back/);
assert.equal(JSON.stringify(limited.values()),initial);

// Interrupted restore on startup is visibly blocked; do not erase raw bytes.
const interrupted=storage({shop4_import_pending:'{"v":1}',shop4_invoices:'[{"id":"partial"}]'});
let notice;
const doc={createElement:()=>({style:{},set textContent(v){this.value=v;}}),body:{replaceChildren:x=>{notice=x;}}};
const cb={};
const win={};
vm.runInNewContext(match[1],{window:win,document:{...doc,addEventListener:(n,fn)=>cb[n]=fn},localStorage:interrupted,TextEncoder,console});
cb.DOMContentLoaded();
assert.match(notice.value,/import was interrupted/i);
assert.deepEqual(JSON.parse(interrupted.getItem('shop4_invoices')),[{id:'partial'}]);

// Application must use guarded import instead of the former partial field-by-field writes.
assert.match(html,/function importData\(input\)\{[\s\S]*?XLLegacyImportGuard\.parse/);
assert.match(html,/window\.XLLegacyImportGuard\.restore\(localStorage,parsed\)/);
assert.doesNotMatch(html,/if\(d\.invoices\)\s+DB\.set\('invoices',d\.invoices\)/);
assert.match(html,/function runMigrations\(\) \{\s*if\(localStorage\.getItem\('shop4_import_pending'\)!==null\)return;/);
console.log('PASS: v4 import preflight, empty-profile restore, existing data refusal, integrity, quota rollback, interrupted marker, optional audit.');
