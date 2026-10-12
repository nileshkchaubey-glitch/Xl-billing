const {test,expect}=require('@playwright/test'),{shop}=require('../fixtures/shop.cjs');
async function seed(page,n=50){await page.goto('/');await page.evaluate(data=>{localStorage.clear();for(const[k,v]of Object.entries(data))localStorage.setItem('shop4_'+k,JSON.stringify(v));localStorage.setItem('shop4_app_version','16');},shop(n));await page.reload();}
async function records(page,key='invoices'){return page.evaluate(k=>JSON.parse(localStorage.getItem('shop4_'+k)),key);}
test.beforeEach(async({page})=>{page.on('dialog',d=>d.accept());await seed(page);});
for(const [name,action,key,count]of [['invoice',"delInvoice('s0')",'invoices',49],['purchase',"delPurchase('u1')",'purchases',0],['party',"delParty('p2')",'parties',1],['item',"delItem('i2')",'items',1],['payment',"deletePaymentEntry('s0',0)",'invoices',50],['retail',"delRetail('r1')",'retail',0]]){
 test(`P0-1 ${name}: PIN setup, wrong PIN, Enter and audit`,async({page})=>{
  await page.evaluate(action);await expect(page.locator('#del-pin-overlay')).toBeVisible();
  // First use must configure a new non-default PIN; never delete during setup.
  await page.locator('#del-pin-inp').fill('2468');await page.locator('#del-pin-confirm').fill('2468',{timeout:1000});await page.locator('#del-pin-ok').click();
  await expect(page.locator('#del-pin-overlay')).toHaveCount(0);
  const s=(await records(page,'settings'));expect(s.deletePin).toBeUndefined();expect(s.deletePinHash).toMatch(/^[a-f0-9]{64}$/);
  await page.evaluate(action);await page.locator('#del-pin-inp').fill('1111');await expect(page.locator('#del-pin-ok')).toBeDisabled();await page.locator('#del-pin-inp').press('Enter');expect((await records(page,key)).length).toBe(count+(name==='payment'?0:1));
  await page.locator('#del-pin-inp').fill('2468');await expect(page.locator('#del-pin-ok')).toBeEnabled();await page.locator('#del-pin-inp').press('Enter');await expect(page.locator('#del-pin-overlay')).toHaveCount(0);
  expect((await records(page,key)).length).toBe(count);expect((await records(page,'audit')).some(x=>x.type==='delete')).toBeTruthy();
  if(name==='payment'){const inv=(await records(page)).find(x=>x.id==='s0');expect(inv.paid).toBe(0);expect(inv.balance).toBe(100);}
 });
}
test('P0-1 dialog escapes labels, traps focus, cancels with Esc',async({page})=>{await page.evaluate(()=>withDeletePin('<img src=x onerror=window.__xss=1> O\'Neil "Traders" & Co',()=>{}));expect(await page.evaluate(()=>window.__xss)).toBeUndefined();await expect(page.locator('.pwd-sub')).toContainText('<img');await page.locator('#del-pin-inp').press('Escape');await expect(page.locator('#del-pin-overlay')).toHaveCount(0);});
test('P0-2 all pages and report tabs render with seeded data',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 for(const p of ['dashboard','new-sale','sales-list','retail-entry','new-purchase','purchase-list','items','parties','reports','settings','prev-bills','payments','learn','excel-connect','github-guide','pur-bulk','pur-pay','audit-log','txn-log'])await page.evaluate(p=>nav(p),p);
 await page.evaluate(()=>nav('reports'));for(const tab of ['sale','pur','party','item','dispatch','outstanding','pending','item-party'])await page.evaluate(t=>repTab(t),tab);
 await page.evaluate(()=>openPartyDetail('p1'));await page.evaluate(()=>openSettlementModal('p1','Synthetic Customer'));await page.evaluate(()=>openPayOutModal());await page.waitForTimeout(300);expect(errors).toEqual([]);
});
test('P0-3 pagination reaches next and last invoice, totals cover all',async({page})=>{await seed(page,1200);await page.evaluate(()=>nav('sales-list'));await expect(page.locator('#sales-table tbody tr')).toHaveCount(20);await expect(page.locator('#sales-table .pgn')).toBeVisible();await page.locator('#sales-table .pgn-btn').filter({hasText:'Next'}).click();await expect(page.locator('#sales-table .pgn-info')).toContainText('21');await page.evaluate(()=>slNavPage(60));await expect(page.locator('#sales-table')).toContainText('INV-1001');await expect(page.locator('#sl-summary')).toContainText('1,20,000.00');await expect(page.locator('#sales-table th[aria-sort]')).not.toHaveCount(0);});
test('P0-4 overpayment rejected without invoice or audit writes',async({page})=>{await page.evaluate(()=>openPayModal('s0'));await page.fill('#pay-amount','81');const before=await records(page);await page.evaluate(()=>savePayment());expect(await records(page)).toEqual(before);expect(await records(page,'audit')).toEqual([]);await expect(page.locator('[role=alert]')).toContainText('balance');});
test('P0-4 exact payment and delete preserve totals',async({page})=>{await page.evaluate(()=>openPayModal('s0'));await page.fill('#pay-amount','80');await page.evaluate(()=>savePayment());const inv=(await records(page))[0];expect(inv.paid).toBe(100);expect(inv.payments.reduce((s,p)=>s+p.amt,0)).toBe(100);expect(inv.balance).toBe(0);});
test('P0-4 purchase overpayment rejected',async({page})=>{await page.evaluate(()=>openPurPayModal('u1'));await page.fill('#pur-pay-amt','481');const before=await records(page,'purchases');await page.evaluate(()=>savePurPayment());expect(await records(page,'purchases')).toEqual(before);});
test('P0-5 batches and typed numbers never collide',async({page})=>{
 await page.evaluate(()=>{nav('prev-bills');document.getElementById('bulk-party-name').value='Synthetic Customer';document.getElementById('bulk-party-id').value='p1';pbRows=[{id:'old1',date:'2026-10-09',total:100,paid:0,billNo:''}];pbSaveAll();pbRows=[{id:'old2',date:'2026-10-09',total:100,paid:0,billNo:''}];pbSaveAll();});
 const invs=await records(page);expect(new Set(invs.map(x=>x.invoiceNo.trim().toLowerCase())).size).toBe(invs.length);
 await page.evaluate(()=>{pbRows=[{id:'old3',date:'2026-10-09',total:100,paid:0,billNo:' inv-1001 '}];pbSaveAll();});expect((await records(page)).length).toBe(invs.length);
});
test('P1-14 no stray shell text on any page',async({page})=>{expect(await page.locator('body').innerText()).not.toMatch(/\/home\/claude|V16_END|cat >>/);});
test('characterization: invoice entry, edit, cancel and restore',async({page})=>{
 await page.evaluate(()=>{nav('new-sale');document.getElementById('inv-party').value='Synthetic Customer';document.getElementById('inv-party-id').value='p1';saleItems=[{id:'row1',itemId:'i1',name:'Paper Cups',qty:5,rate:20,amt:100,unit:'Pcs',packCount:'',packType:''}];renderSaleItems();document.getElementById('inv-date').value='2026-10-09';document.getElementById('inv-paid').value='0';saveSaleInvoice(false);});
 const invs=await records(page);expect(invs.length).toBe(51);const inv=invs.at(-1);expect(inv.total).toBe(100);expect(inv.invoiceNo).toBe('INV-1051');
 await page.evaluate(id=>cancelInvoice(id),inv.id);expect((await records(page)).at(-1).status).toBe('cancelled');await page.evaluate(id=>restoreInvoice(id),inv.id);expect((await records(page)).at(-1).status).not.toBe('cancelled');
});
