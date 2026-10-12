'use strict';
const {test,expect}=require('@playwright/test');
const {shop}=require('../fixtures/shop.cjs');
const crypto=require('node:crypto');
const fs=require('node:fs/promises');
const path=require('node:path');

// Every context is disposable and every record, PIN and downloaded file is synthetic.
async function raw(page,businessOnly=false){
  return page.evaluate(businessOnly=>Object.fromEntries(Object.keys(localStorage)
    .filter(key=>!businessOnly||!key.startsWith('xl_storage_')).sort()
    .map(key=>[key,localStorage.getItem(key)])),businessOnly);
}
async function ready(page){await page.waitForFunction(()=>window.XLAppReady===true);}
function fixtures(withPin=true){
  const data=shop(2);
  if(withPin){data.settings.deletePinSalt='synthetic-followup';data.settings.deletePinHash=crypto.createHash('sha256').update('synthetic-followup:2468').digest('hex');}
  return data;
}
async function seed(page,withPin=true){
  await page.goto('/');await ready(page);
  await page.evaluate(data=>{
    localStorage.clear();
    for(const[key,value]of Object.entries(data))localStorage.setItem('shop4_'+key,JSON.stringify(value));
    localStorage.setItem('shop4_future','opaque synthetic bytes must survive recovery');
    localStorage.setItem('v8_compact','1');
  },fixtures(withPin));
  await page.reload();await ready(page);
}
async function enterRealInvoice(page){
  await page.locator('a.nl[data-pg="new-sale"]').click();
  await expect(page.locator('#page-new-sale')).toBeVisible();
  // Navigation schedules legacy focus callbacks at 150 and 200 ms. Observe their
  // settled focus before typing so a callback cannot redirect the next fill.
  await page.waitForFunction(()=>document.activeElement===document.getElementById('inv-party'),null,{polling:250});
  await expect(page.locator('#inv-party')).toBeFocused();
  await page.locator('#inv-party').fill('Synthetic Customer');
  await page.locator('#ac-inv-party .ac-item').filter({hasText:'Synthetic Customer'}).first().click();
  await page.locator('#inv-date').fill('2026-10-12');
  await page.locator('#inv-pay-type').selectOption('Credit');
  await page.locator('#sale-items-body input[id^="sn-"]').first().fill('Paper Cups');
  await page.locator('#sale-items-body [id^="ac-sn-"] .ac-item').filter({hasText:'Paper Cups'}).first().click();
  await page.locator('#sale-items-body input[id^="sqt-"]').first().fill('5');
  await page.locator('#sale-items-body input[id^="srt-"]').first().fill('20');
  await page.locator('#inv-paid').fill('0');
  await expect(page.locator('#inv-no')).toHaveValue('INV-1003');
  await expect(page.locator('#inv-party')).toHaveValue('Synthetic Customer');
  await expect(page.locator('#sale-items-body input[id^="sqt-"]').first()).toHaveValue('5');
  await expect(page.locator('#sale-items-body input[id^="srt-"]').first()).toHaveValue('20');
}
async function saveRealInvoice(page){
  await enterRealInvoice(page);await page.locator('#save-inv-btn').click();
  await expect(page.locator('#toast')).toContainText(/saved/i);
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('shop4_invoices')).length)).toBe(3);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('shop4_settings')).invNo)).toBe(1004);
}
async function external(page,kind='valid'){
  await page.evaluate(kind=>{
    const rows=JSON.parse(localStorage.getItem('shop4_invoices'));
    if(kind==='valid')rows[0].notes='Synthetic external record, unchanged accounting';
    if(kind==='history'){delete rows[0].payments;rows[0].notes='Synthetic valid historical opening receipt';const purchases=JSON.parse(localStorage.getItem('shop4_purchases'));purchases[0].discount=10;purchases[0].discounts=[{amt:10,date:'2026-10-09'}];purchases[0].balance=470;localStorage.setItem('shop4_purchases',JSON.stringify(purchases));}
    if(kind==='conflicting'){rows[0].paid=70;rows[0].balance=30;}
    if(kind==='duplicate-id')rows[1].id=rows[0].id;
    if(kind==='duplicate-number')rows[1].invoiceNo=' inv-1001 ';
    localStorage.setItem('shop4_invoices',JSON.stringify(rows));
  },kind);
}
async function locked(page){
  await page.reload();await expect(page.locator('#storage-error')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.XLAppReady)).toBe(false);
  expect(await page.evaluate(()=>({nav:typeof window.nav,save:typeof window.saveSaleInvoice,import:typeof window.importData})))
    .toEqual({nav:'undefined',save:'undefined',import:'undefined'});
  await expect(page.locator('#xl-recovery-export')).toBeVisible();
}
async function recoveryProof(page,testInfo){
  const pending=page.waitForEvent('download');await page.locator('#xl-recovery-export').click();
  const download=await pending,path=testInfo.outputPath('synthetic-raw-recovery-'+Date.now()+'.json');await download.saveAs(path);
  const content=JSON.parse(await fs.readFile(path,'utf8'));
  expect(content.format).toBe('xl-billing-raw-recovery');
  expect(content.checksum).toBe(crypto.createHash('sha256').update(JSON.stringify(content.payload)).digest('hex'));
  expect(content.payload).toEqual(await page.evaluate(()=>XLStore.rawRecovery()));
  await expect(page.locator('#xl-recovery-proof')).toBeVisible();
  await page.locator('#xl-recovery-proof').setInputFiles(path);
  await expect(page.locator('#xl-recovery-error')).toContainText(/verified|confirmed/i);
  return {path,content};
}
async function adoptionPreview(page){
  await expect(page.locator('#xl-recovery-adopt')).toBeVisible();await page.locator('#xl-recovery-adopt').click();
  await expect(page.locator('#xl-recovery-preview')).toContainText(/historical.*before.*unavailable|earlier.*snapshot.*unavailable/i);
}
async function approve(page,pin='2468'){
  await page.locator('#xl-recovery-pin').fill(pin);await page.locator('#xl-recovery-confirm').check();await page.locator('#xl-recovery-apply').click();
  await page.waitForFunction(()=>!XLStore.isBusy());
}
async function verified(page){
  // Proof verification and preview validation cannot stand in for a committed recovery.
  await expect(page.locator('#xl-recovery-error')).toHaveText(/^Recovery verified\./);
  const state=await page.evaluate(()=>{const recovery=XLStore.rawRecovery();return {meta:JSON.parse(recovery.meta),journal:recovery.journal,signature:XLStore.fingerprint(recovery.records)};});
  expect(state.meta.v).toBe(1);expect(Number.isSafeInteger(state.meta.revision)).toBe(true);
  expect(state.meta.signature).toBe(state.signature);expect(state.journal).toBeNull();
}
async function assertUnchanged(page,before){expect(await raw(page)).toEqual(before);expect(await page.evaluate(()=>XLAppReady)).toBe(false);}
async function denyOwnerAttempt(page,before){
  if(await page.locator('#xl-recovery-apply').isEnabled())await approve(page);
  expect(await page.locator('#xl-recovery-error').textContent()).not.toMatch(/^Recovery verified\./);
  await assertUnchanged(page,before);
}
async function prepareLocked(page,kind='valid',withPin=true){await seed(page,withPin);await saveRealInvoice(page);await external(page,kind);await locked(page);}
function privateFile(records){
  const backup={format:'xl-billing-private',version:1,createdAt:'2026-10-12T00:00:00.000Z',payload:{records:Object.keys(records).sort().map(key=>({key,value:records[key]}))}};
  backup.checksum={algorithm:'SHA-256',value:crypto.createHash('sha256').update(JSON.stringify(backup)).digest('hex')};
  return {name:'synthetic-private-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))};
}

test('recovery lockout sequence adopts a valid external state only after saved export, preview, PIN and owner choice',async({page},testInfo)=>{
  await prepareLocked(page);const before=await raw(page),business=await raw(page,true);
  await expect(page.locator('#xl-recovery-adopt')).toBeVisible();await page.locator('#xl-recovery-adopt').click();
  await expect(page.locator('#xl-recovery-error')).toContainText(/export|download|proof/i);await assertUnchanged(page,before);
  await recoveryProof(page,testInfo);await adoptionPreview(page);await assertUnchanged(page,before);
  await page.locator('#xl-recovery-pin').fill('2468');
  // An unselected owner confirmation must never authorize adoption.
  if(await page.locator('#xl-recovery-apply').isEnabled())await page.locator('#xl-recovery-apply').click();
  await assertUnchanged(page,before);
  await approve(page);await verified(page);
  expect(await raw(page,true)).toEqual(business);expect(await page.evaluate(()=>XLAppReady)).toBe(false);
  await page.reload();await ready(page);expect(await raw(page,true)).toEqual(business);
  await page.locator('a.nl[data-pg="sales-list"]').click();await expect(page.locator('#sales-table')).toContainText('INV-1003');
});

test('recovery locked adoption preserves legitimate undated opening receipts and supplier discounts byte for byte',async({page},testInfo)=>{
  await prepareLocked(page,'history');const before=await raw(page,true);await recoveryProof(page,testInfo);await adoptionPreview(page);await approve(page);
  await verified(page);expect(await raw(page,true)).toEqual(before);
  const state=await page.evaluate(()=>({i:JSON.parse(localStorage.getItem('shop4_invoices'))[0],p:JSON.parse(localStorage.getItem('shop4_purchases'))[0]}));
  expect(state.i.payments).toBeUndefined();expect(state.i.paid).toBe(20);expect(state.p.discount).toBe(10);expect(state.p.balance).toBe(470);
});

test('recovery a valid private backup restores exact records while normal app scripts never initialize',async({page},testInfo)=>{
  await seed(page);await saveRealInvoice(page);const original=await raw(page,true);
  const downloadPromise=page.waitForEvent('download');await page.evaluate(()=>exportData());const download=await downloadPromise;
  const backupPath=testInfo.outputPath('synthetic-private-backup.json');await download.saveAs(backupPath);
  await external(page);await locked(page);await recoveryProof(page,testInfo);const lockedBefore=await raw(page);
  await expect(page.locator('#xl-recovery-backup')).toBeVisible();await page.locator('#xl-recovery-backup').setInputFiles(backupPath);
  await expect(page.locator('#xl-recovery-preview')).toContainText(/checksum.*verified|verified.*checksum/i);await assertUnchanged(page,lockedBefore);
  await approve(page);await verified(page);
  expect(await raw(page,true)).toEqual(original);expect(await page.evaluate(()=>typeof window.importData)).toBe('undefined');
  await page.reload();await ready(page);expect(await raw(page,true)).toEqual(original);
});

for(const kind of ['conflicting','duplicate-id','duplicate-number'])test('recovery rejects '+kind+' external records and preserves every original byte',async({page},testInfo)=>{
  await prepareLocked(page,kind);const before=await raw(page);await recoveryProof(page,testInfo);await page.locator('#xl-recovery-adopt').click();
  await expect(page.locator('#xl-recovery-error')).toContainText(kind==='conflicting'?/conflict|history|balance/i:/duplicate/i);
  await assertUnchanged(page,before);await denyOwnerAttempt(page,before);
});

test('recovery missing current PIN cannot be replaced by setup or an imported PIN',async({page},testInfo)=>{
  await prepareLocked(page,'valid',false);const before=await raw(page);await recoveryProof(page,testInfo);await page.locator('#xl-recovery-adopt').click();
  if(await page.locator('#xl-recovery-apply').isEnabled())await approve(page);
  await expect(page.locator('#xl-recovery-error')).toContainText(/PIN.*missing|PIN.*unavailable|PIN.*configured|PIN.*required|established.*PIN/i);await assertUnchanged(page,before);
});

test('recovery wrong PIN refuses adoption and preserves the same verified preview for a correct retry',async({page},testInfo)=>{
  await prepareLocked(page);const before=await raw(page);await recoveryProof(page,testInfo);await adoptionPreview(page);await approve(page,'1111');
  await expect(page.locator('#xl-recovery-error')).toContainText(/incorrect|wrong|does not match/i);await assertUnchanged(page,before);
  await approve(page);await verified(page);expect(await raw(page,true)).toEqual(Object.fromEntries(Object.entries(before).filter(([key])=>!key.startsWith('xl_storage_'))));
});

test('recovery refuses a saved proof when raw records changed after its download',async({page},testInfo)=>{
  await prepareLocked(page);const downloadPromise=page.waitForEvent('download');await page.locator('#xl-recovery-export').click();const download=await downloadPromise;
  const path=testInfo.outputPath('synthetic-stale-proof.json');await download.saveAs(path);
  await page.evaluate(()=>{const rows=JSON.parse(localStorage.getItem('shop4_invoices'));rows[0].notes='Synthetic later external edit';localStorage.setItem('shop4_invoices',JSON.stringify(rows));});
  const before=await raw(page);await expect(page.locator('#xl-recovery-proof')).toBeVisible();await page.locator('#xl-recovery-proof').setInputFiles(path);
  await expect(page.locator('#xl-recovery-error')).toContainText(/changed|match|stale/i);await assertUnchanged(page,before);
});

for(const changed of ['records','PIN'])test('recovery refuses changed '+changed+' after preview without deleting recovery material',async({page},testInfo)=>{
  await prepareLocked(page);await recoveryProof(page,testInfo);await adoptionPreview(page);
  await page.evaluate(changed=>{const key=changed==='PIN'?'shop4_settings':'shop4_invoices',value=JSON.parse(localStorage.getItem(key));if(changed==='PIN')value.deletePinHash='0'.repeat(64);else value[0].notes='Synthetic changed after preview';localStorage.setItem(key,JSON.stringify(value));},changed);
  const before=await raw(page);await approve(page);await expect(page.locator('#xl-recovery-error')).toContainText(/changed|stale|match/i);await assertUnchanged(page,before);
});

for(const kind of ['checksum','financial-history'])test('recovery locked restore rejects '+kind+' backup and keeps all original bytes',async({page},testInfo)=>{
  await prepareLocked(page);await recoveryProof(page,testInfo);const before=await raw(page),data=fixtures();
  if(kind==='financial-history'){data.invoices[0].paid=70;data.invoices[0].balance=30;}
  const text=kind==='checksum'?JSON.stringify({...data,v:5,checksum:'synthetic-invalid'}):JSON.stringify({...data,v:5});
  await expect(page.locator('#xl-recovery-backup')).toBeVisible();await page.locator('#xl-recovery-backup').setInputFiles({name:'synthetic-invalid-backup.json',mimeType:'application/json',buffer:Buffer.from(text)});
  await expect(page.locator('#xl-recovery-error')).toContainText(kind==='checksum'?/checksum|unsupported|unverifiable/i:/conflict|history|balance/i);await assertUnchanged(page,before);
  await denyOwnerAttempt(page,before);
});

test('recovery corrupt startup journal remains downloadable without evaluating any normal app script',async({page},testInfo)=>{
  await seed(page);await saveRealInvoice(page);await page.evaluate(()=>localStorage.setItem('xl_storage_journal_v1','{synthetic-corrupt-journal'));
  const before=await raw(page);await locked(page);const pending=page.waitForEvent('download');await page.locator('#xl-recovery-export').click();const download=await pending;
  const path=testInfo.outputPath('synthetic-corrupt-journal.json');await download.saveAs(path);const recovery=JSON.parse(await fs.readFile(path,'utf8'));
  expect(recovery.payload.journal).toBe('{synthetic-corrupt-journal');expect(recovery.payload.meta).toBe(before.xl_storage_meta_v1);
  expect(recovery.payload.records.shop4_future).toBe(before.shop4_future);await assertUnchanged(page,before);
});

for(const key of ['xl_storage_journal_v1','shop4_invoices','shop4_settings','shop4_audit','xl_storage_meta_v1'])test('quota real New Invoice Save at '+key+' keeps originals without reserving or acknowledging a number',async({page})=>{
  await seed(page);await enterRealInvoice(page);const before=await raw(page);
  await page.evaluate(key=>{const set=Storage.prototype.setItem;let once=true;Storage.prototype.setItem=function(k,v){if(k===key&&once){once=false;throw new DOMException('Synthetic quota failure','QuotaExceededError');}return set.call(this,k,v);};},key);
  await page.locator('#save-inv-btn').click();await expect(page.locator('#storage-error')).toBeVisible();
  await expect(page.locator('#storage-error')).toContainText(/storage.*save|save.*storage/i);
  if(key==='xl_storage_journal_v1'){
    await expect(page.locator('#storage-error')).toContainText(/no.*invoice.*counter.*changes|no.*changes.*applied/i);
  }else{
    await expect(page.locator('#storage-error')).toContainText(/original records.*restored|rolled back/i);
  }
  expect(await raw(page)).toEqual(before);expect(await page.locator('#toast').textContent()).not.toMatch(/saved|success/i);
  await expect(page.locator('#inv-no')).toHaveValue('INV-1003');await expect(page.locator('#inv-party')).toHaveValue('Synthetic Customer');
  await page.locator('#save-inv-btn').click();await expect(page.locator('#toast')).toContainText(/saved/i);
  const state=await page.evaluate(()=>({rows:JSON.parse(localStorage.getItem('shop4_invoices')),settings:JSON.parse(localStorage.getItem('shop4_settings'))}));
  expect(state.rows).toHaveLength(3);expect(state.rows.at(-1).invoiceNo).toBe('INV-1003');expect(state.settings.invNo).toBe(1004);
  expect(state.rows.filter(row=>row.invoiceNo==='INV-1003')).toHaveLength(1);
});

test('quota real Save with failed rollback reports recovery pending and preserves verified original states until reload',async({page})=>{
  await seed(page);await enterRealInvoice(page);const before=await raw(page);
  await page.evaluate(()=>{const set=Storage.prototype.setItem;let rollback=false;Storage.prototype.setItem=function(k,v){if(k==='shop4_settings'){rollback=true;throw new DOMException('Synthetic apply quota','QuotaExceededError');}if(rollback&&k==='shop4_invoices')throw new DOMException('Synthetic rollback quota','QuotaExceededError');return set.call(this,k,v);};});
  await page.locator('#save-inv-btn').click();await expect(page.locator('#storage-error')).toContainText(/recovery.*pending/i);
  expect(await page.locator('#storage-error').textContent()).not.toMatch(/original records were restored|rollback succeeded|rolled back successfully/i);
  expect(await page.locator('#toast').textContent()).not.toMatch(/saved|success/i);
  const journal=await page.evaluate(()=>JSON.parse(localStorage.getItem('xl_storage_journal_v1')));
  expect(journal.payload.changes.find(change=>change.key==='shop4_invoices').before).toBe(before.shop4_invoices);
  expect(journal.payload.changes.find(change=>change.key==='shop4_settings').before).toBe(before.shop4_settings);
  const blockedRead=await page.evaluate(()=>{try{getInvoices();return false;}catch{return true;}});expect(blockedRead).toBe(true);
  await page.reload();await ready(page);expect(await raw(page)).toEqual(before);
  await saveRealInvoice(page);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('shop4_invoices')).filter(row=>row.invoiceNo==='INV-1003').length)).toBe(1);
});

for(const kind of ['checksum','different-snapshot'])test('recovery rejects '+kind+' saved proof without trusting imported recovery bytes',async({page},testInfo)=>{
  await prepareLocked(page);const before=await raw(page);const proof=await recoveryProof(page,testInfo);
  if(kind==='checksum')proof.content.checksum='0'.repeat(64);
  else{
    const rows=JSON.parse(proof.content.payload.records.shop4_invoices);rows[0].notes='Synthetic forged raw proof';proof.content.payload.records.shop4_invoices=JSON.stringify(rows);
    proof.content.checksum=crypto.createHash('sha256').update(JSON.stringify(proof.content.payload)).digest('hex');
  }
  await page.locator('#xl-recovery-proof').setInputFiles({name:'synthetic-tampered-proof.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(proof.content))});
  await expect(page.locator('#xl-recovery-error')).toContainText(kind==='checksum'?/checksum|verification|match/i:/snapshot|match|changed/i);
  await assertUnchanged(page,before);await denyOwnerAttempt(page,before);
  await page.locator('#xl-recovery-proof').setInputFiles([]);await assertUnchanged(page,before);
});

for(const key of ['shop4_invoices','xl_storage_meta_v1'])test('recovery locked backup quota at '+key+' restores exact external records and original metadata',async({page},testInfo)=>{
  await seed(page);await saveRealInvoice(page);const backup=privateFile(await raw(page,true));await external(page);await locked(page);
  await recoveryProof(page,testInfo);const before=await raw(page);await page.locator('#xl-recovery-backup').setInputFiles(backup);
  await expect(page.locator('#xl-recovery-preview')).toContainText(/checksum.*verified|verified.*checksum/i);
  await page.evaluate(key=>{const set=Storage.prototype.setItem;let once=true;Storage.prototype.setItem=function(k,v){if(k===key&&once){once=false;throw new DOMException('Synthetic locked restore quota','QuotaExceededError');}return set.call(this,k,v);};},key);
  await approve(page);await expect(page.locator('#xl-recovery-error')).toContainText(/quota|storage|save|restore/i);
  expect(await page.locator('#xl-recovery-error').textContent()).not.toMatch(/restore verified|recovery verified|adoption verified/i);
  await assertUnchanged(page,before);await expect(page.locator('#xl-recovery-preview')).toBeVisible();
});

test('recovery locked restore pending rollback retains both snapshots and returns to the exact unadopted external state on reload',async({page},testInfo)=>{
  await seed(page);await saveRealInvoice(page);const original=await raw(page,true),backup=privateFile(original);await external(page);await locked(page);
  await recoveryProof(page,testInfo);const before=await raw(page);await page.locator('#xl-recovery-backup').setInputFiles(backup);
  await expect(page.locator('#xl-recovery-preview')).toContainText(/checksum.*verified|verified.*checksum/i);
  await page.evaluate(()=>{const set=Storage.prototype.setItem;let rollback=false;Storage.prototype.setItem=function(k,v){if(k==='xl_storage_meta_v1'){rollback=true;throw new DOMException('Synthetic locked marker quota','QuotaExceededError');}if(rollback&&k==='shop4_invoices')throw new DOMException('Synthetic locked rollback quota','QuotaExceededError');return set.call(this,k,v);};});
  await approve(page);await expect(page.locator('#xl-recovery-error')).toContainText(/recovery.*pending|pending.*recovery/i);
  expect(await page.locator('#xl-recovery-error').textContent()).not.toMatch(/original records were restored|rollback succeeded|rolled back successfully/i);
  const journal=await page.evaluate(()=>JSON.parse(localStorage.getItem('xl_storage_journal_v1')));
  expect(journal.payload.v).toBe(2);expect(journal.payload.kind).toBe('owner-reviewed-recovery');
  expect(journal.payload.before.records).toEqual(Object.fromEntries(Object.entries(before).filter(([key])=>!key.startsWith('xl_storage_'))));
  expect(journal.payload.before.meta).toBe(before.xl_storage_meta_v1);expect(journal.payload.before.journal).toBeNull();
  expect(journal.payload.after.records).toEqual(original);
  await locked(page);await assertUnchanged(page,before);
  await recoveryProof(page,testInfo);await page.locator('#xl-recovery-backup').setInputFiles(backup);await expect(page.locator('#xl-recovery-preview')).toContainText(/verified/i);
  await approve(page);await verified(page);expect(await raw(page,true)).toEqual(original);
});

test('recovery exported corrupt journal can be replaced by a valid backup while adoption remains refused',async({page},testInfo)=>{
  await seed(page);await saveRealInvoice(page);const original=await raw(page,true),backup=privateFile(original);
  await page.evaluate(()=>localStorage.setItem('xl_storage_journal_v1','{synthetic-corrupt-original-journal'));await locked(page);const before=await raw(page);
  const proof=await recoveryProof(page,testInfo);expect(proof.content.payload.journal).toBe(before.xl_storage_journal_v1);
  await page.locator('#xl-recovery-adopt').click();await expect(page.locator('#xl-recovery-error')).toContainText(/journal|unfinished|unresolved|recovery/i);await assertUnchanged(page,before);
  await page.locator('#xl-recovery-backup').setInputFiles(backup);await expect(page.locator('#xl-recovery-preview')).toContainText(/verified/i);
  await approve(page);await verified(page);expect(await raw(page,true)).toEqual(original);
  expect(await page.evaluate(()=>localStorage.getItem('xl_storage_journal_v1'))).toBeNull();
  expect(JSON.parse(await fs.readFile(proof.path,'utf8')).payload.journal).toBe(before.xl_storage_journal_v1);
});

test('recovery works when all deferred application scripts are removed and valid stored records cannot initialize navigation',async({page},testInfo)=>{
  await seed(page);await saveRealInvoice(page);const before=await raw(page),original=await raw(page,true),replacement={...original};
  const rows=JSON.parse(replacement.shop4_invoices);rows[0].notes='Synthetic replacement through standalone recovery';replacement.shop4_invoices=JSON.stringify(rows);const backup=privateFile(replacement);
  const source=await fs.readFile(process.env.XL_HTML||path.resolve('index.html'),'utf8');
  const stripped=source.replace(/<script\b(?=[^>]*\btype=["']text\/xl-app["'])[^>]*>[\s\S]*?<\/script>/gi,'');
  expect(stripped).not.toMatch(/<script\b[^>]*\btype=["']text\/xl-app["']/i);
  await page.route('**/',route=>route.fulfill({status:200,contentType:'text/html',body:stripped}));
  await locked(page);expect(await page.locator('script[type="text/xl-app"]').count()).toBe(0);await assertUnchanged(page,before);
  await recoveryProof(page,testInfo);await page.locator('#xl-recovery-backup').setInputFiles(backup);await expect(page.locator('#xl-recovery-preview')).toContainText(/verified/i);
  await expect(page.locator('#xl-recovery-preview')).toContainText('invoices: 0 added, 0 removed, 1 changed');
  await approve(page);await verified(page);expect(await raw(page,true)).toEqual(replacement);
  expect(await page.evaluate(()=>typeof window.nav)).toBe('undefined');
});

function malformedRecords(records,kind){
  const result={...records};
  if(kind==='items-object')result.shop4_items='{}';
  if(kind==='custom-fields-object'){const settings=JSON.parse(result.shop4_settings);settings.customFields={synthetic:'invalid collection'};result.shop4_settings=JSON.stringify(settings);}
  if(kind==='invoice-number-object'||kind==='impossible-date'){const rows=JSON.parse(result.shop4_invoices);if(kind==='invoice-number-object')rows[0].invoiceNo={synthetic:'INV-1001'};else rows[0].date='2026-02-30';result.shop4_invoices=JSON.stringify(rows);}
  return result;
}
for(const mode of ['adopt','restore'])for(const kind of ['items-object','custom-fields-object','invoice-number-object','impossible-date'])test('recovery '+mode+' rejects malformed '+kind+' and preserves the whole original profile',async({page},testInfo)=>{
  await seed(page);await saveRealInvoice(page);
  const malformed=malformedRecords(await raw(page,true),kind);
  if(mode==='adopt')await page.evaluate(records=>{for(const[key,value]of Object.entries(records))localStorage.setItem(key,value);},malformed);
  else await external(page);
  await locked(page);const before=await raw(page);await recoveryProof(page,testInfo);
  if(mode==='adopt')await page.locator('#xl-recovery-adopt').click();
  else await page.locator('#xl-recovery-backup').setInputFiles(privateFile(malformed));
  await expect(page.locator('#xl-recovery-error')).toContainText(/invalid|unsupported|shape|must|array|object|number|date|collection/i);
  await assertUnchanged(page,before);await denyOwnerAttempt(page,before);
});
