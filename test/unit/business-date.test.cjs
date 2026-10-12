'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),acorn=require('acorn');
const html=fs.readFileSync('index.html','utf8');
const block=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(code=>code.includes('function businessDate('));
function dates(){
 assert.ok(block,'The application must define explicit business calendar helpers');
 const ctx={Intl,Date};vm.createContext(ctx);
 for(const n of acorn.parse(block,{ecmaVersion:'latest'}).body){
  if(n.type==='FunctionDeclaration'&&['businessDate','businessMonthRange','businessFinancialYear','businessDayNumber','businessAgeDays'].includes(n.id.name))vm.runInContext(block.slice(n.start,n.end),ctx);
  if(n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.name==='BUSINESS_TIME_ZONE'))vm.runInContext(block.slice(n.start,n.end),ctx);
 }
 return ctx;
}
test('business date follows Asia/Kolkata at midnight and late evening',()=>{
 const c=dates();for(const [instant,expected]of [['2026-09-30T19:00:00Z','2026-10-01'],['2026-10-01T18:00:00Z','2026-10-01'],['2026-03-31T19:00:00Z','2026-04-01'],['2026-12-31T19:00:00Z','2027-01-01']])assert.equal(c.businessDate(instant),expected);
});
test('calendar month boundaries are inclusive and independent of timezone conversion',()=>{
 const c=dates();assert.deepEqual({...c.businessMonthRange('2026-10-12')},{first:'2026-10-01',last:'2026-10-31'});assert.deepEqual({...c.businessMonthRange('2028-02-29')},{first:'2028-02-01',last:'2028-02-29'});assert.deepEqual({...c.businessMonthRange('2027-01-01')},{first:'2027-01-01',last:'2027-01-31'});
});
test('financial year changes only on the April business date boundary',()=>{
 const c=dates();assert.equal(c.businessFinancialYear('2026-03-31'),'2025-26');assert.equal(c.businessFinancialYear('2026-04-01'),'2026-27');assert.equal(c.businessFinancialYear('2026-12-31'),'2026-27');assert.equal(c.businessFinancialYear('2027-01-01'),'2026-27');
});
test('aging uses calendar days and rejects unsupported dates without normalizing',()=>{
 const c=dates();assert.equal(c.businessAgeDays('2026-09-01','2026-10-01'),30);assert.equal(c.businessAgeDays('2026-10-01','2026-10-01'),0);assert.equal(c.businessAgeDays('2026-03-31','2026-04-01'),1);
 for(const d of ['2026-02-30','2026-13-01','2026-1-01','bad',null])assert.throws(()=>c.businessDayNumber(d),/date/i);
});
