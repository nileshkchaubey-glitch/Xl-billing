const {test}=require('node:test'),assert=require('node:assert/strict'),fc=require('fast-check'),fs=require('node:fs'),vm=require('node:vm'),acorn=require('acorn');
const html=fs.readFileSync('index.html','utf8'),blocks=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const ctx={};vm.createContext(ctx);for(const block of blocks)for(const n of acorn.parse(block,{ecmaVersion:'latest'}).body)if(n.type==='FunctionDeclaration'&&['normalizedInvoiceNo','nextInvoiceNumber'].includes(n.id.name))vm.runInContext(block.slice(n.start,n.end),ctx);
test('P0-5 case-insensitive numbers include cancelled records and scan maximum',()=>{assert.equal(ctx.nextInvoiceNumber('INV-',[{invoiceNo:' inv-1005 ',status:'cancelled'}],1001).number,'INV-1006');});
test('P0-5 two batches and stale counters cannot generate duplicates (seed 20261012)',()=>{fc.assert(fc.property(fc.array(fc.integer({min:1,max:100000}),{maxLength:100}),values=>{const records=values.map(n=>({invoiceNo:'PB-ABC-'+n}));const a=ctx.nextInvoiceNumber('PB-ABC-',records,1);records.push({invoiceNo:a.number});const b=ctx.nextInvoiceNumber('PB-ABC-',records,1);assert.notEqual(a.number,b.number);}),{seed:20261012,numRuns:1000});});
test('P0-5 unsupported counters and exhausted series fail without hanging',()=>{
 for(const start of [Infinity,NaN,-1,1.5,Number.MAX_SAFE_INTEGER])assert.throws(()=>vm.runInContext('nextInvoiceNumber("INV-",[],value)',Object.assign(ctx,{value:start}),{timeout:100}),/counter|series/i);
 assert.throws(()=>vm.runInContext('nextInvoiceNumber("INV-",[{invoiceNo:"INV-9007199254740992"}],1)',ctx,{timeout:100}),/counter|series/i);
});
