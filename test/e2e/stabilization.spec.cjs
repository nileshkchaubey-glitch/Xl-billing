'use strict';
const {test,expect}=require('@playwright/test');
const {shop}=require('../fixtures/shop.cjs');
async function seed(page,data){await page.goto('/');await page.evaluate(data=>{localStorage.clear();for(const[k,v]of Object.entries(data))localStorage.setItem('shop4_'+k,JSON.stringify(v));},data);}
async function raw(page){return page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));}
test('stabilization startup preserves all legacy bytes across repeated opens',async({page})=>{
 const data=shop(2);delete data.invoices[0].payments;delete data.invoices[0].dispatchStatus;delete data.invoices[0].paymentType;
 data.invoices[0].items=[{id:'old-line',name:'Synthetic old item',qty:2,rate:3,amount:6,unit:'Pcs'}];data.invoices[0].unknownLegacyField={keep:true};
 delete data.purchases[0].payments;delete data.purchases[0].balance;
 await seed(page,data);const before=await raw(page);await page.reload();await page.reload();expect(await raw(page)).toEqual(before);
});
test('stabilization legacy item amounts render without rewriting storage',async({page})=>{
 const data=shop(1);Object.assign(data.invoices[0],{items:[{id:'old-line',name:'Synthetic legacy amount',qty:2,rate:3,amount:6,unit:'Pcs'}],total:6,paid:0,balance:6,payments:[]});
 await seed(page,data);const before=await raw(page);await page.reload();await page.evaluate(()=>viewInvoice('s0'));
 await expect(page.locator('#inv-view-modal')).toContainText('Synthetic legacy amount');await expect(page.locator('#inv-view-modal')).toContainText('6.00');expect(await raw(page)).toEqual(before);
});
for(const [key,value]of [['invoices','{broken'],['invoices','null'],['items','{}'],['settings','[]']]){
 test('stabilization storage rejects unreadable shape '+key+' '+value,async({page})=>{
  await seed(page,shop(1));await page.reload();
  const result=await page.evaluate(({key,value})=>{localStorage.setItem('shop4_'+key,value);let threw=false;try{DB.get(key);}catch{threw=true;}let writable=true;try{DB.set('retail',[]);}catch{writable=false;}return {threw,writable,original:localStorage.getItem('shop4_'+key)};},{key,value});
  expect(result).toEqual({threw:true,writable:false,original:value});await expect(page.locator('#storage-error')).toBeVisible();
 });
}
test('stabilization denied read blocks mutation and shows a persistent error',async({page})=>{
 await seed(page,shop(1));await page.reload();const before=await raw(page);
 const result=await page.evaluate(()=>{const original=Storage.prototype.getItem;Storage.prototype.getItem=function(key){if(key==='shop4_invoices')throw new DOMException('Synthetic read denial','SecurityError');return original.call(this,key);};let threw=false;try{getInvoices();}catch{threw=true;}Storage.prototype.getItem=original;let writable=true;try{DB.set('invoices',[]);}catch{writable=false;}return {threw,writable};});
 expect(result).toEqual({threw:true,writable:false});expect(await raw(page)).toEqual(before);await expect(page.locator('#storage-error')).toBeVisible();
});
async function pinSeed(page){const data=shop(2),crypto=require('node:crypto');data.settings.deletePinSalt='synthetic-pin';data.settings.deletePinHash=crypto.createHash('sha256').update('synthetic-pin:2468').digest('hex');await seed(page,data);await page.reload();}
for(const action of ['clearAllData()','clearAuditLog()']){
 test('stabilization guarded destructive action '+action,async({page})=>{await pinSeed(page);const before=await raw(page);await page.evaluate(action);await expect(page.locator('#del-pin-overlay')).toBeVisible();expect(await raw(page)).toEqual(before);await page.locator('#del-pin-cancel').click();expect(await raw(page)).toEqual(before);});
}
test('stabilization supplier payment deletion rejects a changed selected payment',async({page})=>{
 await pinSeed(page);await page.evaluate(()=>delPurPayEntry('u1',0));
 await page.evaluate(()=>{const rows=getPurchases();rows[0].payments[0].note='Synthetic concurrent change';DB.set('purchases',rows);});const before=await raw(page);
 await page.locator('#del-pin-inp').fill('2468');await page.locator('#del-pin-ok').click();await expect(page.locator('#del-pin-error')).toContainText('changed');expect(await raw(page)).toEqual(before);
});
