'use strict';
// Three native browser engines on an isolated local origin with synthetic records.
const fs=require('node:fs'),vm=require('node:vm'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const html=fs.readFileSync('index.html');
const helper=fs.readFileSync('qa/plan-a2/verify-billing-browser.cjs','utf8');
const seed=vm.runInNewContext(helper.slice(helper.indexOf('const seed='),helper.indexOf('\nconst rows=[]'))+';seed');
async function scenario(engine,origin){
  const browser=await engine.launch({headless:true}),context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
  const errors=[],external=[];page.on('pageerror',e=>errors.push(e.name));
  await context.route('**/*',r=>{if(![origin+'/seed',origin+'/app.html'].includes(r.request().url())){external.push('unexpected');return r.abort();}return r.continue();});
  const read=k=>page.evaluate(k=>JSON.parse(localStorage.getItem('shop4_'+k)||'[]'),k);
  async function pin(value='1234'){await page.locator('#del-pin-inp').fill(value);await page.locator('#del-pin-ok').click();}
  try{
    await page.goto(origin+'/seed');await page.evaluate(s=>{for(const[k,v]of Object.entries(s))localStorage.setItem(k,v);},seed);
    await page.goto(origin+'/app.html');await page.waitForTimeout(350);
    const original=(await read('invoices'))[0],counter=(await read('settings')).invNo;
    await page.locator('a[data-pg="sales-list"]').click();
    await page.locator('#sales-table .dot-btn').click();await page.locator('#sales-table .dot-menu.open [onclick^="editInvoiceFromList"]').click();
    await page.locator('#inv-notes').fill('Synthetic updated invoice');
    for(let i=0;i<2;i++){
      const popupPromise=page.waitForEvent('popup');await page.locator('button[onclick="saveSaleInvoice(true)"]').click();const popup=await popupPromise;
      await popup.waitForLoadState('domcontentloaded');assert((await popup.locator('body').innerText()).includes(original.invoiceNo));await popup.close();
      await page.locator('#inv-view-modal .mc').click();
    }
    assert.equal((await read('invoices')).length,1);assert.equal((await read('invoices'))[0].id,original.id);assert.equal((await read('settings')).invNo,counter);
    assert.deepEqual((await read('invoices'))[0].payments,original.payments);
    console.log('PASS '+engine.name()+' repeated edit Save & Print keeps one invoice and printed number');
    await page.locator('a[data-pg="sales-list"]').click();await page.locator('#sales-table .dot-btn').click();await page.locator('#sales-table .dot-menu.open .danger').click();
    await page.locator('#del-pin-inp').fill('9999');assert(await page.locator('#del-pin-ok').isDisabled());await page.locator('#del-pin-cancel').click();assert.equal((await read('invoices')).length,1);
    await page.locator('#sales-table .dot-btn').click();await page.locator('#sales-table .dot-menu.open .danger').click();await pin();
    const archived=await read('invoice_recycle');assert.equal(archived.length,1);assert.equal((await read('invoices')).length,0);assert.equal(archived[0].invoice.notes,'Synthetic updated invoice');
    assert.equal(await page.evaluate(()=>getAllPayments().length),0);
    await page.locator('#page-sales-list button[onclick="nav(\'invoice-recycle\')"]').click();
    assert((await page.locator('#invoice-recycle-list').innerText()).includes(original.invoiceNo));
    await page.locator('#invoice-recycle-list button').click();assert.equal(await page.locator('#del-pin-ok').innerText(),'Restore');await pin();
    assert.equal((await read('invoice_recycle')).length,0);assert.deepEqual((await read('invoices'))[0],archived[0].invoice);assert.equal((await read('settings')).invNo,counter);
    console.log('PASS '+engine.name()+' real PIN delete, cancel and complete restore with payment history');
    // Inject a real Storage API failure after startup, never into an owner's profile.
    await page.evaluate(()=>{const native=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='shop4_invoice_recycle')throw new DOMException('Synthetic quota','QuotaExceededError');return native.call(this,k,v);};});
    await page.locator('a[data-pg="sales-list"]').click();await page.locator('#sales-table .dot-btn').click();await page.locator('#sales-table .dot-menu.open .danger').click();await pin();
    assert.equal((await read('invoices')).length,1);assert.match(await page.locator('#toast').innerText(),/move failed/);
    console.log('PASS '+engine.name()+' quota failure keeps invoice active');
    await page.locator('a[data-pg="new-sale"]').click();assert.equal(await page.locator('#inv-party').inputValue(),'');assert.equal(await page.locator('#sale-page-title').innerText(),'➕ New Invoice');
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    console.log('PASS '+engine.name()+' explicit New Invoice resets saved edit without page errors');
  }finally{await context.close();await browser.close();}
}
(async()=>{const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(req.url==='/app.html'?html:'<!doctype html><title>synthetic</title>');});await new Promise(r=>server.listen(0,'127.0.0.1',r));try{const origin='http://127.0.0.1:'+server.address().port;for(const engine of[chromium,firefox,webkit])await scenario(engine,origin);}finally{await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
