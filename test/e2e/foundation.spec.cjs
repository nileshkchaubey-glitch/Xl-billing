'use strict';
const {test,expect}=require('@playwright/test'),{shop}=require('../fixtures/shop.cjs');
async function ready(page){await page.waitForFunction(()=>!window.XLStore||window.XLAppReady);}
async function seed(page){await page.goto('/');await ready(page);await page.evaluate(data=>{localStorage.clear();for(const[k,v]of Object.entries(data))localStorage.setItem('shop4_'+k,JSON.stringify(v));localStorage.setItem('v8_compact','1');localStorage.setItem('shop4_future','opaque synthetic extra');},shop(2));await page.reload();await ready(page);}
async function snapshot(page){return page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>!k.startsWith('xl_storage_')).sort().map(k=>[k,localStorage.getItem(k)])));}
async function invoice(page){await page.evaluate(()=>{nav('new-sale');document.getElementById('inv-party').value='Synthetic Customer';document.getElementById('inv-party-id').value='p1';document.getElementById('inv-date').value='2026-10-12';document.getElementById('inv-paid').value='0';saleItems=[{id:'synthetic-row',name:'Paper Cups',itemId:'i1',qty:5,rate:20,amt:100,unit:'Pcs',packCount:'',packType:''}];renderSaleItems();});}
for(const key of ['shop4_invoices','shop4_settings','shop4_audit','xl_storage_journal_v1','xl_storage_meta_v1']){
 test('foundation failed '+key+' keeps data, counter, audit and retry form',async({page})=>{
  await seed(page);await invoice(page);const before=await snapshot(page);
  await page.evaluate(key=>{const original=Storage.prototype.setItem;let once=true;Storage.prototype.setItem=function(k,v){if(k===key&&once){once=false;throw new DOMException('Synthetic quota','QuotaExceededError');}return original.call(this,k,v);};},key);
  await page.evaluate(async()=>{try{await saveSaleInvoice(false);}catch{}});
  expect(await snapshot(page)).toEqual(before);await expect(page.locator('#storage-error')).toBeVisible();await expect(page.locator('#inv-party')).toHaveValue('Synthetic Customer');await expect(page.locator('#page-new-sale')).toBeVisible();expect(await page.locator('#toast').textContent()).not.toMatch(/saved!/i);
 });
}
test('foundation success acknowledges one invoice, counter and audit after verification',async({page})=>{
 await seed(page);await invoice(page);await page.evaluate(async()=>saveSaleInvoice(false));
 const state=await page.evaluate(()=>({invoices:getInvoices(),settings:getSettings(),audit:DB.get('audit'),journal:localStorage.getItem('xl_storage_journal_v1')}));
 expect(state.invoices.length).toBe(3);expect(state.invoices.at(-1).invoiceNo).toBe('INV-1003');expect(state.settings.invNo).toBe(1004);expect(state.audit.filter(a=>a.type==='create').length).toBe(1);expect(state.journal).toBeNull();await expect(page.locator('#toast')).toContainText('saved');
});
test('foundation double submit cannot create duplicate invoices',async({page})=>{
 await seed(page);await invoice(page);await page.evaluate(async()=>Promise.allSettled([saveSaleInvoice(false),saveSaleInvoice(false)]));expect(await page.evaluate(()=>getInvoices().length)).toBe(3);
});
test('foundation stale second tab cannot overwrite a verified payment',async({page,context})=>{
 await seed(page);const other=await context.newPage();await other.goto('/');await ready(other);await other.evaluate(()=>openPayModal('s0'));await other.locator('#pay-amount').fill('10');
 await page.evaluate(async()=>{openPayModal('s0');document.getElementById('pay-amount').value='10';await savePayment();});
 await other.evaluate(async()=>{try{await savePayment();}catch{}});const stored=await page.evaluate(()=>getInvoices()[0]);expect(stored.paid).toBe(30);expect(stored.payments.length).toBe(2);await expect(other.locator('#storage-error')).toBeVisible();
});
test('foundation rollback failure retains journal and reload restores original records',async({page})=>{
 await seed(page);await invoice(page);const before=await snapshot(page);
 await page.evaluate(()=>{const original=Storage.prototype.setItem;let applying=false;Storage.prototype.setItem=function(k,v){if(k==='shop4_settings'){applying=true;throw new DOMException('Synthetic quota','QuotaExceededError');}if(applying&&k==='shop4_invoices')throw new DOMException('Synthetic rollback quota','QuotaExceededError');return original.call(this,k,v);};});
 await page.evaluate(async()=>{try{await saveSaleInvoice(false);}catch{}});expect(await page.evaluate(()=>localStorage.getItem('xl_storage_journal_v1'))).not.toBeNull();await expect(page.locator('#storage-error')).toBeVisible();await page.reload();await ready(page);expect(await snapshot(page)).toEqual(before);expect(await page.evaluate(()=>localStorage.getItem('xl_storage_journal_v1'))).toBeNull();
});
test('foundation unscoped or invalid batched writes cannot partially change storage',async({page})=>{
 await seed(page);const before=await snapshot(page);
 const result=await page.evaluate(async()=>{let denied=false,partial=false;try{DB.set('invoices',[]);}catch{denied=true;}try{await XLStore.run('Synthetic invalid batch',()=>{DB.set('settings',{...getSettings(),shopName:'Synthetic attempted change'});try{DB.set('invoices','invalid');}catch{}});}catch{partial=true;}return {denied,partial};});
 expect(result).toEqual({denied:true,partial:true});expect(await snapshot(page)).toEqual(before);
});
