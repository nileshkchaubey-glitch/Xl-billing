'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const fc=require('fast-check');
function csv(collections={}){
  const html=fs.readFileSync(process.env.XL_CSV_TEST_HTML||'index.html','utf8');
  const source=html.match(/<script id="xl-csv-core">([\s\S]*?)<\/script>/)?.[1];
  assert(source,'Self-contained CSV preflight is not implemented.');
  const context={};vm.createContext(context);vm.runInContext(source,context);
  let id=0;return context.createXLCSV({collections,genId:()=>`synthetic-csv-${++id}`,today:()=> '2026-10-12',now:()=> '2026-10-12T00:00:00.000Z'});
}
const same=value=>JSON.parse(JSON.stringify(value));
const reject=(fn,pattern)=>assert.throws(fn,pattern||/CSV rejected:/);
const invoice={id:'sale1',invoiceNo:'CSV-1',date:'2026-10-12',partyId:'p1',partyName:'Synthetic Customer',items:[],subtotal:100,discount:10,taxPct:0,taxAmt:0,total:90,paid:20,openingPaid:0,balance:70,payments:[{amt:20,date:'2026-10-12',mode:'Cash'}],notes:'Original note',future:{keep:'unchanged'}};
const masters={parties:[{id:'p1',name:'Synthetic Customer'}],items:[]};
test('RFC-style CSV preserves quotes, commas, CRLF, embedded CR/LF and whitespace',()=>{
 const c=csv(),rows=[['name','notes'],['  "quoted", value  ','one\r\ntwo\rthree\nfour'],["'original apostrophe",'=1+1']];
 assert.deepEqual(same(c.parse('\ufeff'+c.stringify(rows))),rows);
});
test('CSV codec preserves arbitrary finite arrays of strings',()=>{
 const c=csv();fc.assert(fc.property(fc.array(fc.array(fc.string(),{minLength:3,maxLength:3}),{minLength:1,maxLength:15}),rows=>assert.deepEqual(same(c.parse(c.stringify(rows))),rows)),{numRuns:120});
});
for(const malformed of ['a,b\n"unterminated,x','a,b\nx,"y"oops','a,b\nx,y,z','a,a\nx,y','a,b\nx"y,z'])test('Malformed structure fails closed: '+JSON.stringify(malformed),()=>reject(()=>csv().build(malformed)));
for(const bad of ['not-a-number','NaN','Infinity','100junk','1e2','1.001','90071992547410','-1'])test('Entire legacy invoice file rejects explicit invalid paid '+bad,()=>{
 const collections={invoices:[invoice],...masters},before=JSON.stringify(collections);
 reject(()=>csv(collections).build('invoiceNo,date,partyName,total,paid\nGOOD,2026-10-12,Synthetic Customer,100,20\nBAD,2026-10-12,Synthetic Customer,100,'+bad));
 assert.equal(JSON.stringify(collections),before);
});
test('Legacy invoice summary uses explicit opening receipt and preserves monetary arithmetic',()=>{
 const c=csv(masters),p=c.build('invoiceNo,date,partyName,subtotal,discount,taxPct,taxAmt,total,paid,balance\nLEGACY,2026-10-12,Synthetic Customer,100,10,0,0,90,20,70');
 assert.equal(p.type,'invoices');assert.match(p.warning,/summary|histor/i);
 const r=p.records[0];assert.equal(r.subtotal,100);assert.equal(r.total,90);assert.equal(r.paid,20);assert.equal(r.openingPaid,20);assert.deepEqual(same(r.payments),[]);assert.equal(r.partyId,'');
});
test('Missing subtotal with discount or tax is refused rather than fabricated',()=>reject(()=>csv().build('invoiceNo,date,partyName,total,discount\nLEGACY,2026-10-12,Synthetic Customer,90,10')));
test('Blank declared paid and wrong declared balance are refused',()=>{
 for(const text of ['invoiceNo,date,partyName,total,paid\nX,2026-10-12,Synthetic Customer,10,','invoiceNo,date,partyName,total,paid,balance\nX,2026-10-12,Synthetic Customer,10,2,7'])reject(()=>csv().build(text));
});
test('Unknown, ambiguous and unsupported financial schemas are rejected',()=>{
 for(const text of ['invoiceNo,date,partyName,total,refund\nX,2026-10-12,Synthetic Customer,10,2','name,saleRate,phone\nSynthetic,5,0000','invoiceNo,date,partyName,total,payments\nX,2026-10-12,Synthetic Customer,10,[]'])reject(()=>csv().build(text));
});
test('Own invoice export preserves exact fields, histories, relationships and unknown fields',()=>{
 const c=csv(masters),p=c.build(c.export('invoices',[invoice]));assert.deepEqual(same(p.records),[invoice]);assert.equal(p.warning,'');
});
test('Own export literal encoding reversibly preserves formulas and real apostrophes',()=>{
 const names=['=1+1','+cmd','-cmd','@SUM(1)','\t=1+1',"'real apostrophe",'  =formula','\rformula','quote"comma,new\nline'];
 const records=names.map((name,i)=>({id:'item'+i,name,unit:'Pcs',saleRate:1,purchaseRate:0,gst:0})),c=csv();
 const encoded=c.export('items',records),rows=c.parse(encoded);for(const row of rows.slice(1))assert.ok(row[0].startsWith("'"));
 assert.deepEqual(same(c.build(encoded).records),records);
});
test('Legacy apostrophes remain intact without the versioned export marker',()=>{
 assert.equal(csv().build("name,saleRate\n'real apostrophe,1").records[0].name,"'real apostrophe");
});
test('Own scalar edits cannot silently disagree with their source records',()=>{
 const c=csv(masters),rows=c.parse(c.export('invoices',[invoice]));rows[1][rows[0].indexOf('subtotal')]='99';
 reject(()=>c.build(c.stringify(rows)),/differ|match|conflict/i);
});
test('Conflicting history, relationship, duplicate identity or sub-paise source is refused',()=>{
 for(const changed of [{...invoice,paid:30,balance:60},{...invoice,partyId:'missing'},{...invoice,items:[{id:'line1',itemId:'missing',name:'Synthetic',qty:1,rate:90,amt:90}]},{...invoice,total:90.001}]){
  const c=csv(masters);reject(()=>c.build(c.export('invoices',[changed])));
 }
 const c=csv({...masters,invoices:[invoice]});reject(()=>c.build(c.export('invoices',[invoice])));
});
test('Legacy explicit party relationship is validated without guessing from names',()=>{
 const c=csv(masters),base='invoiceNo,date,partyId,partyName,total,paid\nX,2026-10-12,';
 reject(()=>c.build(base+'missing,Synthetic Customer,10,0'));
 reject(()=>c.build(base+'p1,Conflicting Name,10,0'));
 assert.equal(c.build(base+'p1,Synthetic Customer,10,0').records[0].partyId,'p1');
});
test('Own purchases and retail exports retain supported records instead of becoming invoices',()=>{
 const c=csv(masters),purchase={id:'pur1',billNo:'P-1',partyId:'p1',partyName:'Synthetic Customer',date:'2026-10-12',total:100,paid:20,discount:5,balance:75,payments:[{amt:20,date:'2026-10-12',mode:'UPI'}],discounts:[{amt:5,date:'2026-10-12'}]},retail={id:'ret1',date:'2026-10-12',amount:12.34,notes:'Synthetic'};
 assert.deepEqual(same(c.build(c.export('purchases',[purchase])).records),[purchase]);assert.deepEqual(same(c.build(c.export('retail',[retail])).records),[retail]);
});
