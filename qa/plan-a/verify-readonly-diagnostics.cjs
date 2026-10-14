'use strict';
// Plan A A1b: synthetic VM verification of standalone diagnostic entry.
// Never load a production browser profile or invoke application initialization.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'storage-diagnostics.html'), 'utf8');
const main = fs.readFileSync(path.join(root, 'index.html'));
const expectedMainHash = 'd5fbcd1a47a5bf6e8d2ec735b561f46108e3c905878ba301acd322040b52b70a';
assert.equal(crypto.createHash('sha256').update(main).digest('hex'), expectedMainHash, 'production index.html must be byte-identical');
assert.equal((html.match(/<script(?:\s|>)/gi) || []).length, 1, 'exactly one self-contained script');
assert.equal((html.match(/<link\b/gi) || []).length, 0, 'no linked resources');
assert.equal((html.match(/<iframe\b/gi) || []).length, 0, 'no frames');
assert.match(html, /connect-src 'none'/, 'network must be blocked by CSP');
const match = html.match(/<script id="xl-a1b-diagnostics">([\s\S]*?)<\/script>/);
assert.ok(match, 'isolated diagnostics script required');
const script = new vm.Script(match[1], {filename:'storage-diagnostics.html',displayErrors:false});

function element() {
  return {
    textContent:'',className:'',children:[],listeners:Object.create(null),
    replaceChildren() { this.children=[]; this.textContent=''; },
    appendChild(child) { this.children.push(child); return child; },
    addEventListener(name, fn) { this.listeners[name]=fn; }
  };
}
function run(seed={}, opts={}) {
  const nodes = Object.create(null);
  const calls={set:0,del:0,clear:0,network:0,read:0};
  const map = new Map(Object.entries(seed));
  const storage = {
    get length() { if(opts.denyLength) throw new Error('CUSTOMER-SECRET-IN-DENIED-ERROR'); return map.size; },
    key(i) { if(opts.denyKey) throw new Error('CUSTOMER-SECRET-IN-DENIED-ERROR'); return [...map.keys()][i]||null; },
    getItem(k) { calls.read++; if(opts.denyGet===k) throw new Error('CUSTOMER-SECRET-IN-DENIED-ERROR'); return map.has(k)?map.get(k):null; },
    setItem() { calls.set++; throw new Error('READ ONLY'); },
    removeItem() { calls.del++; throw new Error('READ ONLY'); },
    clear() { calls.clear++; throw new Error('READ ONLY'); }
  };
  const window = {
    location:{protocol:opts.protocol||'https:'},
    get localStorage() { if(opts.denyProperty) throw new Error('CUSTOMER-SECRET-IN-DENIED-ERROR'); return storage; }
  };
  const document={
    getElementById(k) { return nodes[k] ||= element(); },
    createElement() { return element(); }
  };
  const context={window,document,TextEncoder,console:{log(){throw new Error('No logs');},error(){throw new Error('No logs');}},
    fetch(){calls.network++;throw new Error('No network');},
    XMLHttpRequest:function(){calls.network++;throw new Error('No network');},
    navigator:{storage:{persist(){throw new Error('No persistence requests');},estimate(){throw new Error('No estimates');}}}
  };
  script.runInNewContext(context,{timeout:1500});
  const contents=()=>Object.entries(nodes).map(([id,obj])=>[id,obj.textContent,...obj.children.flatMap(row=>row.children.map(c=>c.textContent))].join(' ')).join(' ');
  function checkUntouched(){
    assert.equal(calls.set+calls.del+calls.clear+calls.network,0,'zero writes and requests');
    assert.deepEqual(Object.fromEntries(map),seed,'raw bytes and key membership unchanged');
  }
  checkUntouched();
  return {nodes,calls,contents,checkUntouched,rerun(){
    nodes.inspect.listeners.click();
    checkUntouched();
  }};
}
let checks=0;
function check(name, action){
  action();checks++;
  process.stdout.write('PASS '+name+'\n');
}
const validRows = n=>JSON.stringify(Array.from({length:n},(_,i)=>({id:'s-'+i,paid:i%2,amount:120,notes:'रंग 👋'})));
const settings=JSON.stringify({shopName:'SECRET SHOP',jsonbinKey:'SECRET-MASTER-KEY',jsonbinId:'SECRET-BIN-ID'});
check('empty origin is not interpreted as verified empty billing profile',()=>{
  const x=run();
  assert.match(x.nodes.coverage.textContent,/wrong profile or origin/);
  assert.match(x.nodes.assessment.textContent,/NOT verified/);
  assert.equal(x.nodes['key-count'].textContent,'0');
  x.rerun();
});
check('valid synthetic present and empty collections are distinguished',()=>{
  const x=run({shop4_invoices:validRows(86),shop4_parties:'[]',shop4_settings:settings,
    shop4_audit:'[]',v8_compact:'1',v8_slcols:'{}'});
  const rows=x.nodes.collections.children;
  assert.equal(rows[2].children[2].textContent,'86');
  assert.equal(rows[1].children[1].textContent,'Present empty');
  assert.equal(rows[0].children[1].textContent,'Absent');
  assert.match(x.nodes.provider.textContent,/configuration present/);
  assert.doesNotMatch(x.contents(),/SECRET SHOP|SECRET-MASTER|SECRET-BIN|रंग/);
  x.rerun();
});
check('invalid JSON fails closed with no raw text',()=>{
  const x=run({shop4_invoices:'{"name":"SENTINEL-PRIVATE-NAME"',
    shop4_settings:settings});
  assert.match(x.nodes.assessment.textContent,/ATTENTION/);
  assert.equal(x.nodes.collections.children[2].children[1].textContent,'Unreadable JSON');
  assert.doesNotMatch(x.contents(),/SENTINEL-PRIVATE-NAME|SECRET/);
});
check('null, primitive, and wrong-shape collections fail closed',()=>{
  for (const raw of ['null','12','{}','"oops"']){
    const x=run({shop4_invoices:raw});
    assert.match(x.nodes.assessment.textContent,/ATTENTION/);
    assert.notEqual(x.nodes.collections.children[2].children[1].textContent,'Present');
  }
});
check('duplicate and missing IDs are invalid without leaking IDs',()=>{
  for(const raw of ['[{"id":"secret"},{"id":"secret"}]','[{"id":"secret"},{}]']){
    const x=run({shop4_invoices:raw});
    assert.match(x.nodes.collections.children[2].children[1].textContent,/Invalid/);
    assert.doesNotMatch(x.contents(),/secret/);
  }
});
check('settings shape is checked and provider remains unverified',()=>{
  const x=run({shop4_settings:'[]'});
  assert.match(x.nodes.assessment.textContent,/ATTENTION/);
  assert.match(x.nodes.provider.textContent,/Unknown/);
});
check('pending import marker blocks claims of health',()=>{
  const x=run({shop4_import_pending:'SENTINEL RECOVERY',shop4_invoices:'[]'});
  assert.match(x.nodes.recovery.textContent,/marker present/);
  assert.match(x.nodes.assessment.textContent,/ATTENTION/);
  assert.doesNotMatch(x.contents(),/SENTINEL RECOVERY/);
});
check('unknown prefixed keys are warned, without showing key names',()=>{
  const x=run({'shop4_unknown<svg onload=alert(1)>':'secret',shop4_items:'[]'});
  assert.match(x.nodes.assessment.textContent,/ATTENTION/);
  assert.doesNotMatch(x.contents(),/svg|secret|alert/);
});
check('denied getItem, length and key are incomplete not empty',()=>{
  for(const options of [{denyGet:'shop4_invoices'},{denyLength:true},{denyKey:true},{denyProperty:true}]){
    const x=run({shop4_invoices:'[]'},options);
    assert.match(x.nodes.assessment.textContent,/INCOMPLETE/);
    assert.match(x.nodes.coverage.textContent,/INCOMPLETE/);
    assert.doesNotMatch(x.contents(),/CUSTOMER-SECRET/);
  }
});
check('file origin is unsupported and does not access storage',()=>{
  const x=run({shop4_invoices:'[]'},{protocol:'file:'});
  assert.equal(x.calls.read,0);
  assert.match(x.nodes.assessment.textContent,/INCOMPLETE/);
});
check('UTF-8 multibyte sizes are measured separately from UTF-16',()=>{
  const raw=JSON.stringify([{id:'é😀'}]);
  const x=run({shop4_invoices:raw});
  const utf8=Buffer.byteLength('shop4_invoices'+raw,'utf8');
  assert.equal(x.nodes['total-utf8'].textContent,utf8.toLocaleString('en-IN')+' bytes');
  assert.equal(x.nodes['total-utf16'].textContent,('shop4_invoices'+raw).length.toLocaleString('en-IN')+' code units');
});
check('hostile row fields never become HTML or visible record data',()=>{
  const hostile='<img src=x onerror="alert(1)">'; const raw=JSON.stringify([{id:'id',name:hostile,notes:'CUSTOMER-SECRET'}]);
  const x=run({shop4_invoices:raw});
  assert.doesNotMatch(x.contents(),/CUSTOMER-SECRET|onerror|<img/);
  assert.equal(x.nodes.collections.children[2].children[2].textContent,'1');
});
check('fixture scales avoid mutation and are measured without claiming capacity',()=>{
  for(const n of [0,86,500,2000,5000]){
    const x=run({shop4_invoices:validRows(n)});
    assert.equal(x.nodes.collections.children[2].children[2].textContent,n);
    assert.match(x.nodes.assessment.textContent,/NOT verified/);
  }
});
check('no imports, app initialization or external references',()=>{
  assert.doesNotMatch(html,/src\s*=\s*["']https?:\/\//i);
  assert.doesNotMatch(html,/href\s*=\s*["']https?:\/\//i);
  assert.doesNotMatch(match[1],/\.setItem\s*\(|\.removeItem\s*\(|\.clear\s*\(|\b(?:DB\.|runMigrations|cloudPush|cloudPull|createNewBin)\b/);
});
console.log('PASS: '+checks+' A1b synthetic diagnostic groups. No real billing data, browser or provider used.');
