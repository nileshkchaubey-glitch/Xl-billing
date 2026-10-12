const {test,expect}=require('@playwright/test'),{shop}=require('../fixtures/shop.cjs');
async function ready(page){await page.waitForFunction(()=>!window.XLStore||window.XLAppReady);}
async function seed(page,n=50){await page.goto('/');await ready(page);await page.evaluate(data=>{localStorage.clear();for(const[k,v]of Object.entries(data))localStorage.setItem('shop4_'+k,JSON.stringify(v));localStorage.setItem('shop4_app_version','16');},shop(n));await page.reload();await ready(page);}
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
test('P0-1 dialog escapes labels, traps focus, cancels with Esc',async({page})=>{await page.evaluate(()=>withDeletePin('<img src=x onerror=window.__xss=1> O\'Neil "Traders" & Co',()=>{}));expect(await page.evaluate(()=>window.__xss)).toBeUndefined();await expect(page.locator('.pwd-sub')).toContainText('<img');await page.locator('#del-pin-inp').press('Shift+Tab');await expect(page.locator('#del-pin-cancel')).toBeFocused();await page.locator('#del-pin-cancel').press('Tab');await expect(page.locator('#del-pin-inp')).toBeFocused();await page.locator('#del-pin-inp').press('Escape');await expect(page.locator('#del-pin-overlay')).toHaveCount(0);});
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
 await page.evaluate(async()=>{nav('prev-bills');document.getElementById('bulk-party-name').value='Synthetic Customer';document.getElementById('bulk-party-id').value='p1';pbRows=[{id:'old1',date:'2026-10-09',total:100,paid:0,billNo:''}];await pbSaveAll();pbRows=[{id:'old2',date:'2026-10-09',total:100,paid:0,billNo:''}];await pbSaveAll();});
 const invs=await records(page);expect(new Set(invs.map(x=>x.invoiceNo.trim().toLowerCase())).size).toBe(invs.length);
 await page.evaluate(async()=>{pbRows=[{id:'old3',date:'2026-10-09',total:100,paid:0,billNo:' inv-1001 '}];await pbSaveAll();});expect((await records(page)).length).toBe(invs.length);
});
test('P1-14 no stray shell text on any page',async({page})=>{expect(await page.locator('body').innerText()).not.toMatch(/\/home\/claude|V16_END|cat >>/);});
test('characterization: invoice entry, edit, cancel and restore',async({page})=>{
 await page.evaluate(async()=>{nav('new-sale');document.getElementById('inv-party').value='Synthetic Customer';document.getElementById('inv-party-id').value='p1';saleItems=[{id:'row1',itemId:'i1',name:'Paper Cups',qty:5,rate:20,amt:100,unit:'Pcs',packCount:'',packType:''}];renderSaleItems();document.getElementById('inv-date').value='2026-10-09';document.getElementById('inv-paid').value='0';await saveSaleInvoice(false);});
 const invs=await records(page);expect(invs.length).toBe(51);const inv=invs.at(-1);expect(inv.total).toBe(100);expect(inv.invoiceNo).toBe('INV-1051');
 await page.evaluate(id=>cancelInvoice(id),inv.id);expect((await records(page)).at(-1).status).toBe('cancelled');await page.evaluate(id=>restoreInvoice(id),inv.id);expect((await records(page)).at(-1).status).not.toBe('cancelled');
});
test('P0-3 all seven lists expose page size and sort controls',async({page})=>{
 await page.evaluate(()=>XLStore.run('Synthetic list fixtures',()=>{DB.set('items',Array.from({length:60},(_,i)=>({id:'i'+i,name:'Item '+i,saleRate:i,updatedAt:'2026-10-09'})));DB.set('parties',Array.from({length:60},(_,i)=>({id:'p'+i,name:'Party '+i,type:'customer'})));DB.set('audit',Array.from({length:60},(_,i)=>({id:'a'+i,type:'create',label:'Test '+i,ts:'2026-10-09T08:00:00Z'})));DB.set('purchases',Array.from({length:60},(_,i)=>({id:'u'+i,date:'2026-10-09',billNo:'PUR-'+i,total:100,paid:0,balance:100,partyName:'Supplier',items:[],payments:[]})));}));
 for(const [pg,container]of [['sales-list','#sales-table'],['purchase-list','#purchase-table'],['items','#items-table'],['parties','#parties-table'],['payments','#page-payments'],['audit-log','#page-audit-log'],['txn-log','#page-txn-log']]){
  await page.evaluate(p=>nav(p),pg);await expect(page.locator(container+' .pgn')).toBeVisible();await page.locator(container+' [aria-label="Rows per page"]').selectOption('50');await expect(page.locator(container+' .pgn-info')).toContainText('50');await page.locator(container+' [aria-label="Sort direction"]').selectOption('asc');
 }
});
test('P0-4 settlement and standalone reject excess payment and discount',async({page})=>{
 await page.evaluate(()=>openSettlementModal('p1','Synthetic Customer'));const before=await records(page);await page.fill('#si-s0','81');await page.evaluate(()=>saveSettlement('p1','Synthetic Customer'));expect(await records(page)).toEqual(before);
 await page.evaluate(()=>openStandalonePayModal());await page.selectOption('#spa-inv-select','s0');await page.fill('#spa-amount','80');await page.fill('#spa-discount','1');await page.evaluate(()=>saveStandalonePayment());expect(await records(page)).toEqual(before);
});
test('P0-4 edit payment cannot increase past invoice total',async({page})=>{const before=await records(page);await page.evaluate(()=>editPayment('s0',0));await page.fill('#ep-amt','101');await page.evaluate(()=>saveEditPayment('s0',0));expect(await records(page)).toEqual(before);});
test('characterization: file origin works offline without outgoing requests',async({browser})=>{
 const ctx=await browser.newContext(),pg=await ctx.newPage(),errors=[],requests=[];pg.on('pageerror',e=>errors.push(e.message));pg.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});pg.on('dialog',d=>d.accept());await ctx.setOffline(true);await pg.goto(require('node:url').pathToFileURL(require('node:path').resolve('index.html')).href);await ready(pg);await pg.evaluate(()=>nav('new-sale'));expect(errors).toEqual([]);expect(requests).toEqual([]);await ctx.close();
});
test('visual evidence: desktop and mobile pages',async({page,browserName})=>{
 if(browserName!=='chromium')return;
 const fs=require('node:fs');fs.mkdirSync('test-results/screenshots',{recursive:true});
 for(const [width,height]of [[1366,768],[390,844]]){await page.setViewportSize({width,height});for(const pg of ['dashboard','new-sale','sales-list','retail-entry','new-purchase','purchase-list','items','parties','reports','settings','prev-bills','payments','learn','excel-connect','github-guide','pur-bulk','pur-pay','audit-log','txn-log']){await page.evaluate(p=>nav(p),pg);await page.screenshot({path:`test-results/screenshots/${pg}-${width}.png`});}}
});
test('P0-5 single old bill rejects an existing typed invoice number',async({page})=>{
 const before=await records(page);await page.evaluate(async()=>{nav('prev-bills');document.getElementById('pb-invno').value=' inv-1001 ';document.getElementById('pb-date').value='2026-10-09';document.getElementById('pb-party').value='Synthetic Customer';document.getElementById('pb-total').value='100';document.getElementById('pb-paid').value='0';savePrevBill();});expect(await records(page)).toEqual(before);
});
test('P0-1 quoted party names select and settle through real click handlers',async({page})=>{
 const name='O\'Neil "Traders" & Co';await page.evaluate(name=>XLStore.run('Synthetic quoted name',()=>{const p=getParties();p[0].name=name;DB.set('parties',p);}),name);await page.evaluate(()=>nav('new-sale'));await page.fill('#inv-party',"O'Neil");await page.locator('#ac-inv-party .ac-item').first().click();await expect(page.locator('#inv-party')).toHaveValue(name);
 await page.evaluate(name=>openSettlementModal('p1',name),name);
 for(const attr of await page.locator('#settlement-modal [onclick]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('onclick'))))expect(()=>new Function('event',attr)).not.toThrow();
});
