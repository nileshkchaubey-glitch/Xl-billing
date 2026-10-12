'use strict';
const {test,expect}=require('@playwright/test');
const {shop}=require('../fixtures/shop.cjs');
async function ready(page){await page.waitForFunction(()=>!window.XLStore||window.XLAppReady);}
async function seed(page,data){await page.goto('/');await ready(page);await page.evaluate(data=>{localStorage.clear();for(const[k,v]of Object.entries(data))localStorage.setItem('shop4_'+k,JSON.stringify(v));},data);}
async function raw(page){return page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));}
test('stabilization startup preserves all legacy bytes across repeated opens',async({page})=>{
 const data=shop(2);delete data.invoices[0].payments;delete data.invoices[0].dispatchStatus;delete data.invoices[0].paymentType;
 data.invoices[0].items=[{id:'old-line',name:'Synthetic old item',qty:2,rate:3,amount:6,unit:'Pcs'}];data.invoices[0].unknownLegacyField={keep:true};
 delete data.purchases[0].payments;delete data.purchases[0].balance;
 await seed(page,data);const before=await raw(page);await page.reload();await ready(page);await page.reload();await ready(page);expect(await raw(page)).toEqual(before);
});
test('stabilization legacy item amounts render without rewriting storage',async({page})=>{
 const data=shop(1);Object.assign(data.invoices[0],{items:[{id:'old-line',name:'Synthetic legacy amount',qty:2,rate:3,amount:6,unit:'Pcs'}],total:6,paid:0,balance:6,payments:[]});
 await seed(page,data);const before=await raw(page);await page.reload();await ready(page);await page.evaluate(()=>viewInvoice('s0'));
 await expect(page.locator('#inv-view-modal')).toContainText('Synthetic legacy amount');await expect(page.locator('#inv-view-modal')).toContainText('6.00');expect(await raw(page)).toEqual(before);
});
for(const [key,value]of [['invoices','{broken'],['invoices','null'],['items','{}'],['settings','[]']]){
 test('stabilization storage rejects unreadable shape '+key+' '+value,async({page})=>{
  await seed(page,shop(1));await page.reload();await ready(page);
  const result=await page.evaluate(({key,value})=>{localStorage.setItem('shop4_'+key,value);let threw=false;try{DB.get(key);}catch{threw=true;}let writable=true;try{DB.set('retail',[]);}catch{writable=false;}return {threw,writable,original:localStorage.getItem('shop4_'+key)};},{key,value});
  expect(result).toEqual({threw:true,writable:false,original:value});await expect(page.locator('#storage-error')).toBeVisible();
 });
}
test('stabilization denied read blocks mutation and shows a persistent error',async({page})=>{
 await seed(page,shop(1));await page.reload();await ready(page);const before=await raw(page);
 const result=await page.evaluate(()=>{const original=Storage.prototype.getItem;Storage.prototype.getItem=function(key){if(key==='shop4_invoices')throw new DOMException('Synthetic read denial','SecurityError');return original.call(this,key);};let threw=false;try{getInvoices();}catch{threw=true;}Storage.prototype.getItem=original;let writable=true;try{DB.set('invoices',[]);}catch{writable=false;}return {threw,writable};});
 expect(result).toEqual({threw:true,writable:false});expect(await raw(page)).toEqual(before);await expect(page.locator('#storage-error')).toBeVisible();
});
async function pinSeed(page){const data=shop(2),crypto=require('node:crypto');data.settings.deletePinSalt='synthetic-pin';data.settings.deletePinHash=crypto.createHash('sha256').update('synthetic-pin:2468').digest('hex');await seed(page,data);await page.reload();await ready(page);}
for(const action of ['clearAllData()','clearAuditLog()']){
 test('stabilization guarded destructive action '+action,async({page})=>{await pinSeed(page);const before=await raw(page);await page.evaluate(action);await expect(page.locator('#del-pin-overlay')).toBeVisible();expect(await raw(page)).toEqual(before);await page.locator('#del-pin-cancel').click();expect(await raw(page)).toEqual(before);});
}
test('stabilization supplier payment deletion rejects a changed selected payment',async({page})=>{
 await pinSeed(page);await page.evaluate(()=>delPurPayEntry('u1',0));
 await page.evaluate(()=>XLStore.run('Synthetic concurrent change',()=>{const rows=getPurchases();rows[0].payments[0].note='Synthetic concurrent change';DB.set('purchases',rows);}));const before=await raw(page);
 await page.locator('#del-pin-inp').fill('2468');await page.locator('#del-pin-ok').click();await expect(page.locator('#del-pin-error')).toContainText('changed');expect(await raw(page)).toEqual(before);
});
test('stabilization stored text remains literal across lists, autocomplete, invoice and audit',async({page})=>{
 const data=shop(2),payload='<img src="/synthetic-missing" onerror="window.__storedTextExecuted=1"> O\'Neil "Test" & Co';
 data.parties[0].name=payload;data.items[0].name=payload;data.items[0].unit=payload;data.invoices[0].partyName=payload;data.invoices[0].notes=payload;data.invoices[0].items[0].name=payload;data.invoices[0].items[0].colour=payload;
 data.settings.shopName=payload;data.settings.bank=payload;data.settings.terms=payload;data.purchases[0].partyName=payload;data.purchases[0].notes=payload;
 data.audit=[{id:'unsafe-text',type:'create',entityType:'invoice',label:payload,details:payload,user:payload,ts:'2026-10-09T08:00:00Z'}];
 await seed(page,data);await page.reload();await ready(page);const before=await raw(page);
 for(const pg of ['sales-list','items','parties','purchase-list','payments','audit-log','txn-log'])await page.evaluate(pg=>nav(pg),pg);
 await page.evaluate(()=>viewInvoice('s0'));await expect(page.locator('#inv-view-modal')).toContainText(payload);
 await page.evaluate(()=>{closeModal('inv-view-modal');nav('new-sale');partyAC('inv-party','inv-party-id','Test');showSaleItemAC(saleItems[0].id,'Test');});
 await page.waitForTimeout(100);expect(await page.evaluate(()=>window.__storedTextExecuted)).toBeUndefined();expect(await page.locator('img[onerror]').count()).toBe(0);expect(await raw(page)).toEqual(before);
});
for(const field of ['partyId','nestedItemId','rate']){
 test('stabilization unsafe reference or numeric source is rejected '+field,async({page})=>{
  const data=shop(1);await seed(page,data);await page.reload();await ready(page);
  const result=await page.evaluate(field=>{const rows=getInvoices();if(field==='partyId')rows[0].partyId="x');window.__unsafeReference=1;//";else if(field==='nestedItemId')rows[0].items[0].id="x');window.__unsafeReference=1;//";else rows[0].items[0].rate="1);window.__unsafeReference=1;//";const original=JSON.stringify(rows);localStorage.setItem('shop4_invoices',original);let threw=false;try{getInvoices();}catch{threw=true;}return {threw,preserved:localStorage.getItem('shop4_invoices')===original,executed:window.__unsafeReference===1};},field);
  expect(result).toEqual({threw:true,preserved:true,executed:false});
 });
}
test('stabilization missing legacy balance remains payable without a startup rewrite',async({page})=>{
 const data=shop(1);delete data.invoices[0].balance;delete data.invoices[0].payments;delete data.invoices[0].dispatchStatus;delete data.invoices[0].paymentType;delete data.purchases[0].balance;
 await seed(page,data);const before=await raw(page);await page.reload();await ready(page);await page.evaluate(()=>nav('sales-list'));
 await expect(page.locator('#sales-table button').filter({hasText:/^Pay$/}).first()).toBeVisible();expect(await raw(page)).toEqual(before);
 await page.evaluate(async()=>{openPayModal('s0');document.getElementById('pay-amount').value='10';await savePayment();});
 const inv=await page.evaluate(()=>getInvoices()[0]);expect(inv.paid).toBe(30);expect(inv.balance).toBe(70);expect(inv.openingPaid).toBe(20);
});
test('stabilization payment search cannot inject HTML',async({page})=>{
 await seed(page,shop(1));await page.reload();await ready(page);await page.evaluate(()=>nav('payments'));
 await page.locator('#pay-filter-party').fill('"><img src="/synthetic-missing" onerror="window.__filterxss=1">');
 await page.waitForTimeout(100);expect(await page.locator('img[onerror]').count()).toBe(0);expect(await page.evaluate(()=>window.__filterxss)).toBeUndefined();
});
test('stabilization printed invoice preserves literal stored text and safe CSS settings',async({page})=>{
 const data=shop(1),payload='<img src="/synthetic-missing" onerror="window.__printxss=1">';
 data.settings.shopName=payload;data.settings.bank=payload;data.settings.terms=payload;data.settings.printSettings={fontSize:'13</style>'+payload};data.invoices[0].partyName=payload;data.invoices[0].notes=payload;
 await seed(page,data);await page.reload();await ready(page);
 const result=await page.evaluate(()=>{viewInvoice('s0');let output='';window.open=()=>({document:{write:value=>output+=value,close(){}},focus(){},print(){}});printInvoice();const doc=new DOMParser().parseFromString(output,'text/html');return {payloadNodes:doc.querySelectorAll('img[onerror]').length,text:doc.body.textContent};});
 expect(result.payloadNodes).toBe(0);expect(result.text).toContain(payload);
});
