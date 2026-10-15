'use strict';
// Synthetic-only A3a verification. Never load or access owner/browser data.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createHash,webcrypto}=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const origin=fs.readFileSync(path.join(root,'index.html'),'utf8');
const page=fs.readFileSync(path.join(root,'verified-backup.html'),'utf8');
const originalSourceHash='4e1e6bdb46d8a42a51e4c60da107514c2b3de7146ad4d3f862840af6e9e52d7d';
if (createHash('sha256').update(origin).digest('hex') !== originalSourceHash) {
  const revision = require('../plan-a2/verify-runtime-revision.cjs').verifyRuntimeRevision(root);
  assert.ok(['delete-pin-dialog-only','invoice-edit-and-recycle-bin'].includes(revision.additionalRevision), 'only exact separately requested revisions are allowed');
}
const codecFrom=origin.indexOf('function createXLCompleteBackup(options)');
const codecTo=origin.indexOf('window.XLCompleteBackup=createXLCompleteBackup(',codecFrom);
assert(codecFrom>=0&&codecTo>codecFrom,'V1 backup codec boundaries required');
const codec=origin.slice(codecFrom,codecTo).trim();
const scripts=[...page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length,1,'single inline self-contained script');
const embedded=scripts[0][1],a=embedded.indexOf('function createXLCompleteBackup(options)'),b=embedded.indexOf('const codec = createXLCompleteBackup(',a);
assert(a>=0&&b>a);
assert.equal(embedded.slice(a,b).trim(),codec,'standalone V1 codec must exactly match original');
assert.match(page,/connect-src 'none'/);
assert.doesNotMatch(page,/<script[^>]+src=|<link[^>]+href=|<iframe\b/i);
assert.doesNotMatch(embedded,/\b(?:fetch|XMLHttpRequest|navigator\.serviceWorker|indexedDB)\s*\(/);
const js=new vm.Script(embedded,{filename:'verified-backup.html'});
function el(){
  return {textContent:'',className:'',disabled:false,children:[],listeners:{},href:'',download:'',
    addEventListener(type,fn){this.listeners[type]=fn;},
    appendChild(child){this.children.push(child);},
    remove(){},click(){this.clicked=true;}};
}
function fakeDate(){
  return class Clock extends Date {
    constructor(...args){super(...(args.length?args:['2026-10-15T00:00:00.000Z']));}
    static now(){return Date.parse('2026-10-15T00:00:00.000Z');}
  };
}
function fixture(n=2){
  return {shop4_settings:JSON.stringify({shopName:'PRIVATE SHOP NAME',jsonbinKey:'SECRET-MASTER-KEY',jsonbinId:'SECRET-BIN'}),
    shop4_invoices:JSON.stringify(Array.from({length:n},(_,i)=>({id:'s-'+i,total:50,paid:i%2,payments:[],notes:'विवरण 👋'}))),
    shop4_parties:'[]',shop4_items:'[]',shop4_audit:JSON.stringify([{id:'audit-1',type:'test'}]),
    shop4_purchases:'[]',shop4_retail:'[]',shop4_app_version:'16',v8_compact:'1',shop4_extra_safe:'"unknown preserved"'};
}
function createDir(opts={}){
  const files=new Map(), attempts=[];
  const dir={files,attempts,async getFileHandle(name,options){
    attempts.push({name,create:!!options?.create});
    if(!files.has(name)){
      if(!options?.create)throw {name:'NotFoundError'};
      files.set(name,'');
    }
    return {
      async createWritable(){
        if(opts.denyWrite)throw new Error('Denied for synthetic case');
        let pending='';
        return {
          async write(v){
            if(opts.writeThrows)throw new Error('Synthetic disk full');
            pending=String(v);
            if(opts.onWrite)opts.onWrite();
          },
          async close(){
            if(opts.closeThrows)throw new Error('Synthetic disk close error');
            files.set(name,pending);
          }
        };
      },
      async getFile(){return {async text(){return opts.corruptReadback?'{"broken":"private"}':files.get(name);}};}
    };
  }};
  return dir;
}
function makeContext(seed,opts={}){
  const raw=new Map(Object.entries(seed)), nodes={}, counts={writes:0,network:0,pickers:0,downloads:0};
  const storage={
    get length(){return raw.size;},
    key(i){return [...raw.keys()][i]??null;},
    getItem(k){if(opts.denyRead)throw new Error('PRIVATE FAILED READ');return raw.get(k)??null;},
    setItem(){counts.writes++;throw Error('DISALLOWED STORAGE WRITE');},
    removeItem(){counts.writes++;throw Error('DISALLOWED STORAGE WRITE');},
    clear(){counts.writes++;throw Error('DISALLOWED STORAGE WRITE');}
  };
  const document={body:{appendChild(){}},
    getElementById(k){return nodes[k]??=el();},
    createElement(){return el();}};
  const directory=opts.dir??createDir();
  const window={crypto:{subtle:webcrypto.subtle,getRandomValues(v){v.fill(42);return v;}},
    isSecureContext:opts.secure!==false,
    location:{protocol:opts.protocol||'https:',hostname:'billing.test'},
    get localStorage(){return storage;}};
  if(opts.picker!==false)window.showDirectoryPicker=async()=>{counts.pickers++;if(opts.cancel)throw {name:'AbortError'};return directory;};
  const URL={createObjectURL(){return 'blob:synthetic';},revokeObjectURL(){}};
  const context={window,document,location:window.location,TextEncoder,Blob,URL,Date:fakeDate(),
    setTimeout(){},navigator:{},fetch(){counts.network++;throw Error('NETWORK DISALLOWED');},
    console:{log(){throw Error('Logs forbidden');},error(){throw Error('Logs forbidden');}}};
  js.runInNewContext(context,{timeout:1500});
  const snapshot=()=>JSON.stringify([...raw.entries()]);
  const before=snapshot();
  return {nodes,raw,counts,directory,window,document,check(){
    if (!opts.allowExternalChange) assert.equal(snapshot(),before,'original localStorage exact bytes/keys unchanged');
    assert.equal(counts.writes,0);assert.equal(counts.network,0);
    assert.doesNotMatch(nodes['backup-status'].textContent,/PRIVATE SHOP|SECRET-MASTER|SECRET-BIN|विवरण/);
  },async save(){const answer=await nodes['folder-save'].listeners.click();this.check();return answer;},
    async download(){const answer=await nodes['manual-download'].listeners.click();this.check();return answer;}};
}
let checks=0;
async function test(label,fn){await fn();checks++;console.log('PASS '+label);}
(async()=>{
  await test('folder save retains raw V1 strings and verifies disk readback',async()=>{
    const x=makeContext(fixture(86));assert.equal(await x.save(),true);
    assert.match(x.nodes['backup-status'].textContent,/LOCAL FILE VERIFIED/);
    assert.match(x.nodes['backup-status'].textContent,/upload UNKNOWN/);
    assert.equal(x.directory.files.size,1);
    const text=[...x.directory.files.values()][0],json=JSON.parse(text);
    assert.equal(json.checksum.algorithm,'SHA-256');
    assert.equal(json.payload.records.find(x=>x.key==='shop4_settings').value,x.raw.get('shop4_settings'));
    assert.equal(json.payload.records.find(x=>x.key==='shop4_audit').value,x.raw.get('shop4_audit'));
    assert.equal(json.payload.records.find(x=>x.key==='shop4_extra_safe').value,x.raw.get('shop4_extra_safe'));
  });
  await test('collision never overwrites already verified generation',async()=>{
    const x=makeContext(fixture(1));assert.equal(await x.save(),true);
    const original=[...x.directory.files.values()][0];
    assert.equal(await x.save(),false);
    assert.equal(x.directory.files.size,1);
    assert.equal([...x.directory.files.values()][0],original);
    assert.match(x.nodes['backup-status'].textContent,/filename already exists/);
  });
  await test('picker cancellation is not described as success',async()=>{
    const x=makeContext(fixture(1),{cancel:true});
    assert.equal(await x.save(),false);assert.equal(x.directory.files.size,0);
    assert.match(x.nodes['backup-status'].textContent,/cancelled or denied/);
  });
  await test('unsupported picker provides the manual download fallback',async()=>{
    const x=makeContext(fixture(1),{picker:false});
    assert.equal(x.nodes['folder-save'].disabled,true);
    assert.match(x.nodes['backup-status'].textContent,/unsupported/);
    assert.equal(await x.download(),true);
    assert.match(x.nodes['backup-status'].textContent,/Download requested/);
  });
  await test('malformed live collection never creates file',async()=>{
    const x=makeContext({...fixture(1),shop4_invoices:'{"secret":"PRIVATE-RECORD"'});
    assert.equal(await x.save(),false);
    assert.equal(x.directory.files.size,0);
    assert.match(x.nodes['backup-status'].textContent,/FAILED/);
  });
  await test('denied live storage read never creates file',async()=>{
    const x=makeContext(fixture(1),{denyRead:true});
    assert.equal(await x.save(),false);assert.equal(x.directory.files.size,0);
  });
  await test('write failure leaves no false verified message',async()=>{
    const x=makeContext(fixture(1),{dir:createDir({writeThrows:true})});
    assert.equal(await x.save(),false);assert.doesNotMatch(x.nodes['backup-status'].textContent,/LOCAL FILE VERIFIED/);
  });
  await test('close failure leaves no false verified message',async()=>{
    const x=makeContext(fixture(1),{dir:createDir({closeThrows:true})});
    assert.equal(await x.save(),false);assert.doesNotMatch(x.nodes['backup-status'].textContent,/LOCAL FILE VERIFIED/);
  });
  await test('corrupt independent readback is refused',async()=>{
    const x=makeContext(fixture(1),{dir:createDir({corruptReadback:true})});
    assert.equal(await x.save(),false);
    assert.match(x.nodes['backup-status'].textContent,/FAILED/);
  });
  await test('concurrent invoice modification invalidates latest-data confirmation',async()=>{
    const data=fixture(1);
    const x=makeContext(data,{allowExternalChange:true,dir:createDir({onWrite(){x.raw.set('shop4_invoices','[]');}})});
    assert.equal(await x.save(),false);
    assert.equal(x.directory.files.size,1);
    assert.doesNotMatch(x.nodes['backup-status'].textContent,/LOCAL FILE VERIFIED/);
  });
  await test('synthetic scales 0/86/500/2000/5000 remain complete',async()=>{
    for(const n of [0,86,500,2000,5000]){
      const x=makeContext(fixture(n));assert.equal(await x.save(),true);assert.equal(x.directory.files.size,1);
      assert.equal(JSON.parse([...x.directory.files.values()][0]).payload.records.find(r=>r.key==='shop4_invoices').value, x.raw.get('shop4_invoices'));
    }
  });
  console.log('PASS '+checks+' A3a source/synthetic groups; owner device and native file persistence NOT TESTED.');
})().catch(e=>{console.error('FAIL '+(e&&e.stack?e.stack:e));process.exitCode=1;});
