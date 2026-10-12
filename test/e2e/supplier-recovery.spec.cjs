'use strict';
const {test,expect}=require('@playwright/test');
const {shop}=require('../fixtures/shop.cjs');
const crypto=require('node:crypto'),fs=require('node:fs/promises');

test.beforeEach(async({page,baseURL})=>{
  const origin=new URL(baseURL).origin;
  await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
});

// Every browser context, payment, PIN and file is synthetic. No hosted profile is used.
function fixtures(multiple=true){
  const d=shop(2);d.settings.deletePinSalt='synthetic-supplier-recovery';
  d.settings.deletePinHash=crypto.createHash('sha256').update('synthetic-supplier-recovery:2468').digest('hex');
  d.parties.push({id:'p3',name:'Synthetic Second Supplier',type:'supplier',openingBal:0});
  d.purchases[0].discount=10;d.purchases[0].discounts=[{date:'2026-10-09',amt:10,note:'Synthetic legitimate vendor discount'}];d.purchases[0].balance=470;
  if(multiple){
    d.purchases.push({...structuredClone(d.purchases[0]),id:'u2',partyId:'p3',partyName:'Synthetic Second Supplier'});
    d.purchases.push({...structuredClone(d.purchases[0]),id:'u3',date:'2027-04-01',payments:[{date:'2027-04-01',amt:20,mode:'Cash',note:''}],discounts:[{date:'2027-04-01',amt:10,note:'Synthetic next-year discount'}],createdAt:'2027-03-31T18:30:00.000Z'});
  }
  return d;
}
const ready=page=>page.waitForFunction(()=>window.XLAppReady===true);
const raw=(page,all=false)=>page.evaluate(all=>Object.fromEntries(Object.keys(localStorage).filter(k=>all||!k.startsWith('xl_storage_')).sort().map(k=>[k,localStorage.getItem(k)])),all);
async function seed(page,multiple=true){
  await page.goto('/');await ready(page);
  await page.evaluate(d=>{localStorage.clear();for(const[k,v]of Object.entries(d))localStorage.setItem('shop4_'+k,JSON.stringify(v));localStorage.setItem('shop4_future','Synthetic opaque historical bytes');localStorage.setItem('v8_compact','1');},fixtures(multiple));
  await page.reload();await ready(page);
}
async function sale(page){
  await page.locator('a.nl[data-pg="new-sale"]').click();await page.waitForTimeout(250);
  await page.locator('#inv-party').fill('Synthetic Customer');await page.locator('#ac-inv-party .ac-item').first().click();
  await page.locator('#inv-date').fill('2026-10-12');await page.locator('#inv-pay-type').selectOption('Credit');
  await page.locator('#sale-items-body input[id^="sn-"]').first().fill('Paper Cups');await page.locator('#sale-items-body [id^="ac-sn-"] .ac-item').first().click();
  await page.locator('#sale-items-body input[id^="sqt-"]').first().fill('5');await page.locator('#sale-items-body input[id^="srt-"]').first().fill('20');await page.locator('#inv-paid').fill('0');
  await page.locator('#save-inv-btn').click();await expect(page.locator('#toast')).toContainText(/saved/i);await page.waitForFunction(()=>!XLStore.isBusy());
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('shop4_invoices')).length)).toBe(3);
}
async function savedBackup(page,info){
  const pending=page.waitForEvent('download');await page.locator('a.nl[onclick="exportData()"]').click();
  const file=await pending,filename=info.outputPath('synthetic-multi-supplier-private.json');await file.saveAs(filename);
  const b=JSON.parse(await fs.readFile(filename,'utf8'));
  expect(b.format).toBe('xl-billing-private');expect(b.checksum.value).toBe(crypto.createHash('sha256').update(JSON.stringify({format:b.format,version:b.version,createdAt:b.createdAt,payload:b.payload})).digest('hex'));
  return filename;
}
async function lock(page){
  await page.reload();await expect(page.locator('#storage-error')).toBeVisible();
  expect(await page.evaluate(()=>({ready:XLAppReady,nav:typeof window.nav,save:typeof window.saveSaleInvoice,import:typeof window.importData}))).toEqual({ready:false,nav:'undefined',save:'undefined',import:'undefined'});
}
async function proof(page,info){
  const pending=page.waitForEvent('download');await page.locator('#xl-recovery-export').click();
  const file=await pending,filename=info.outputPath('synthetic-raw-recovery.json');await file.saveAs(filename);
  const b=JSON.parse(await fs.readFile(filename,'utf8'));expect(b.format).toBe('xl-billing-raw-recovery');
  expect(b.checksum).toBe(crypto.createHash('sha256').update(JSON.stringify(b.payload)).digest('hex'));
  expect(b.payload).toEqual(await page.evaluate(()=>XLStore.rawRecovery()));
  await page.locator('#xl-recovery-proof').setInputFiles(filename);await expect(page.locator('#xl-recovery-error')).toContainText(/saved recovery export verified/i);
}
async function apply(page,pin='2468',confirmed=true){
  await page.locator('#xl-recovery-pin').fill(pin);await page.locator('#xl-recovery-confirm').setChecked(confirmed);await page.locator('#xl-recovery-apply').click();await page.waitForFunction(()=>!XLStore.isBusy());
}
async function reopen(page,expected){
  await expect(page.locator('#xl-recovery-error')).toHaveText(/^Recovery verified\./);
  expect(await raw(page)).toEqual(expected);expect(await page.evaluate(()=>typeof window.importData)).toBe('undefined');
  await page.reload();await ready(page);expect(await raw(page)).toEqual(expected);
  const bills=await page.evaluate(()=>JSON.parse(localStorage.getItem('shop4_purchases')));
  expect(bills.map(b=>[b.id,b.billNo,b.partyId,b.date,b.total,b.paid,b.discount,b.balance])).toEqual([
    ['u1','P-1','p2','2026-10-09',500,20,10,470],['u2','P-1','p3','2026-10-09',500,20,10,470],['u3','P-1','p2','2027-04-01',500,20,10,470]
  ]);
}

test('supplier identity normal private restore preserves cross-supplier and cross-year purchase accounting',async({page},info)=>{
  await seed(page);const expected=await raw(page),backup=await savedBackup(page,info);
  await page.evaluate(()=>XLStore.run('Synthetic changed note',()=>{const purchases=getPurchases();purchases[0].notes='Synthetic changed note';DB.set('purchases',purchases);}));
  const before=await raw(page,true);await page.locator('#import-file').setInputFiles(backup);
  await expect(page.locator('#xl-restore-preview')).toContainText(/checksum verified.*purchases: 3/i);expect(await raw(page,true)).toEqual(before);
  await page.locator('#xl-restore-confirm').click();await page.locator('#del-pin-inp').fill('1111');await page.locator('#del-pin-inp').press('Enter');
  await expect(page.locator('#del-pin-error')).toContainText(/wrong PIN/i);
  await expect(page.locator('#del-pin-overlay')).toBeVisible();expect(await raw(page,true)).toEqual(before);
  const rollbackCopy=page.waitForEvent('download');await page.locator('#del-pin-inp').fill('2468');await page.locator('#del-pin-inp').press('Enter');
  const download=await rollbackCopy;await download.saveAs(info.outputPath('synthetic-before-normal-restore.json'));
  await expect(page.locator('#del-pin-overlay')).toHaveCount(0);await expect(page.locator('#toast')).toContainText(/restore verified/i);
  expect(await raw(page)).toEqual(expected);await page.reload();await ready(page);expect(await raw(page)).toEqual(expected);
});

test('supplier identity locked private restore survives real invoice save and external modification without normal scripts',async({page},info)=>{
  await seed(page);await sale(page);const expected=await raw(page),backup=await savedBackup(page,info);
  await page.evaluate(()=>{const purchases=JSON.parse(localStorage.getItem('shop4_purchases'));purchases[0].notes='Synthetic external change';localStorage.setItem('shop4_purchases',JSON.stringify(purchases));});
  await lock(page);const before=await raw(page,true);
  await page.locator('#xl-recovery-backup').setInputFiles(backup);await expect(page.locator('#xl-recovery-error')).toContainText(/export|proof/i);expect(await raw(page,true)).toEqual(before);
  await proof(page,info);await page.locator('#xl-recovery-backup').setInputFiles(backup);
  await expect(page.locator('#xl-recovery-preview')).toContainText(/checksum verified/i);expect(await raw(page,true)).toEqual(before);
  await apply(page,'1111');await expect(page.locator('#xl-recovery-error')).toContainText(/incorrect|wrong|does not match/i);expect(await raw(page,true)).toEqual(before);
  await apply(page,'2468',false);await expect(page.locator('#xl-recovery-error')).toContainText(/confirm|approve/i);expect(await raw(page,true)).toEqual(before);
  await apply(page);await reopen(page,expected);
});

test('supplier identity locked raw adoption accepts valid external multi-supplier histories after export and PIN',async({page},info)=>{
  await seed(page,false);await sale(page);
  await page.evaluate(purchases=>localStorage.setItem('shop4_purchases',JSON.stringify(purchases)),fixtures().purchases);
  await lock(page);const expected=await raw(page),before=await raw(page,true);
  await page.locator('#xl-recovery-adopt').click();await expect(page.locator('#xl-recovery-error')).toContainText(/export|proof/i);expect(await raw(page,true)).toEqual(before);
  await proof(page,info);await page.locator('#xl-recovery-adopt').click();await expect(page.locator('#xl-recovery-preview')).toContainText(/historical.*before.*unavailable|earlier.*snapshot.*unavailable/i);
  expect(await raw(page,true)).toEqual(before);await apply(page);await reopen(page,expected);
});

for(const kind of ['adoption','restore'])test('supplier identity ambiguous '+kind+' refuses financial history without changing any bytes',async({page},info)=>{
  await seed(page,false);await sale(page);
  const candidate=fixtures(false);candidate.purchases.push({...structuredClone(candidate.purchases[0]),id:'ambiguous-purchase',partyId:''});
  if(kind==='adoption')await page.evaluate(purchases=>localStorage.setItem('shop4_purchases',JSON.stringify(purchases)),candidate.purchases);
  else await page.evaluate(()=>{const rows=JSON.parse(localStorage.getItem('shop4_invoices'));rows[0].notes='Synthetic external change';localStorage.setItem('shop4_invoices',JSON.stringify(rows));});
  await lock(page);await proof(page,info);const before=await raw(page,true);
  if(kind==='adoption')await page.locator('#xl-recovery-adopt').click();
  else await page.locator('#xl-recovery-backup').setInputFiles({name:'synthetic-ambiguous-v5.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...candidate,v:5}))});
  await expect(page.locator('#xl-recovery-error')).toContainText(/ambiguous.*supplier.*financial year/i);expect(await raw(page,true)).toEqual(before);
  await apply(page);expect(await page.locator('#xl-recovery-error').textContent()).not.toMatch(/^Recovery verified\./);expect(await raw(page,true)).toEqual(before);
});
