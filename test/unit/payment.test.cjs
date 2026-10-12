const {test}=require('node:test'),assert=require('node:assert/strict'),fc=require('fast-check'),vm=require('node:vm'),fs=require('node:fs'),acorn=require('acorn');
function functions(names){const html=fs.readFileSync('index.html','utf8');return [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].flatMap(m=>acorn.parse(m[1],{ecmaVersion:'latest'}).body.filter(n=>n.type==='FunctionDeclaration'&&names.includes(n.id.name)).map(n=>m[1].slice(n.start,n.end))).join('\n');}
test('P0-4 random payments and replacements preserve paid and balance (seed 20261012)',()=>{
 const ctx={Date,Number,Math,isActive:()=>true,paymentError:()=>false,fc:String,document:{getElementById:()=>null}};vm.createContext(ctx);vm.runInContext(functions(['round2','moneyPaise','parseMoneyInput','financialState','billBalance','recordedPaid','allowPayment','reconcilePayment']),ctx);
 fc.assert(fc.property(fc.integer({min:1,max:10000000}),fc.array(fc.integer({min:1,max:10000000}),{maxLength:30}),(paise,amounts)=>{
  const record={total:paise/100,paid:0,balance:paise/100,payments:[]};
  for(const raw of amounts){const amt=raw/100;if(ctx.allowPayment(record,amt)){record.payments.push({amt});ctx.reconcilePayment(record);}assert(record.paid<=record.total+0.005);assert.equal(record.balance,ctx.round2(record.total-record.paid));assert.equal(record.paid,ctx.recordedPaid(record));}
 }),{seed:20261012,numRuns:1000});
});
