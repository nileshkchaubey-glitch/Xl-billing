'use strict';
// Browser-level A1b gate. Only code-defined synthetic localStorage in fresh contexts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium,firefox,webkit} = require('playwright');
const html = fs.readFileSync(path.join(__dirname,'../../storage-diagnostics.html'));
const seedHTML = '<!doctype html><html><head><meta charset="utf-8"></head><body>synthetic test origin</body></html>';
async function withServer(task) {
  const server=http.createServer((req,res)=>{
    if (req.url==='/Xl-billing/storage-diagnostics.html') {
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);
    } else if (req.url==='/Xl-billing/seed') {
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(seedHTML);
    } else {
      res.writeHead(404,{'Content-Type':'text/plain'});res.end('not found');
    }
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try { await task('http://127.0.0.1:'+server.address().port); }
  finally { await new Promise(resolve=>server.close(resolve)); }
}
async function scenario(browser, origin, name, values, expected) {
  const context=await browser.newContext({serviceWorkers:'block'});
  const page=await context.newPage();
  const unexpected=[], pageErrors=[], requests=[];
  page.on('pageerror', e=>pageErrors.push(e.name));
  page.on('request', req=>requests.push(req.url()));
  await context.route('**/*',route=>{
    const u=route.request().url();
    if (u!==origin+'/Xl-billing/seed'&&u!==origin+'/Xl-billing/storage-diagnostics.html'){
      unexpected.push(u);
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });
  try {
    await page.goto(origin+'/Xl-billing/seed',{waitUntil:'load'});
    await page.evaluate(data=>{for (const [key,value] of Object.entries(data))localStorage.setItem(key,value);},values);
    const snapshot=async()=>page.evaluate(()=>{
      const keys=[];for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));
      return Object.fromEntries(keys.sort().map(k=>[k,localStorage.getItem(k)]));
    });
    const before=await snapshot();
    await page.goto(origin+'/Xl-billing/storage-diagnostics.html',{waitUntil:'load'});
    assert.equal(await page.title(),'XL Billing | Read-only Storage Diagnostics');
    assert.match(await page.locator('#assessment').innerText(),expected,'Assessment '+name);
    assert.deepEqual(await snapshot(),before,'no mutation on initial visit: '+name);
    await page.reload({waitUntil:'load'});
    assert.deepEqual(await snapshot(),before,'no mutation on reload: '+name);
    await page.locator('#inspect').click();
    assert.deepEqual(await snapshot(),before,'no mutation on inspect again: '+name);
    const bodyText=await page.locator('body').innerText();
    assert.doesNotMatch(bodyText,/SECRET-(?:MASTER|CUSTOMER|PHOTO|NAME)|<img/i,'private content not rendered');
    assert.deepEqual(unexpected,[],'no additional network requests: '+name);
    assert.deepEqual(pageErrors,[],'no runtime errors: '+name);
    assert.ok(!requests.some(u=>/index\.html|jsonbin|script\.google/i.test(u)),'no normal app or cloud requests');
    console.log('PASS: '+browser.browserType().name()+' '+name+' visit/reload/reinspect; identical raw keys/values; zero provider requests');
  } finally {
    await context.close();
  }
}
(async()=>{
  await withServer(async(origin)=>{
    for(const type of [chromium,firefox,webkit]){
      const browser=await type.launch({headless:true});
      try{
        await scenario(browser,origin,'valid-and-empty',{
          shop4_invoices:JSON.stringify([{id:'inv-1',paid:200,notes:'SECRET-CUSTOMER'}]),
          shop4_parties:'[]',shop4_settings:JSON.stringify({shopName:'SECRET-NAME',jsonbinKey:'SECRET-MASTER'}),
          shop4_audit:'[]',v8_compact:'1',shop4_app_version:'16'
        },/OBSERVATIONS ONLY/);
        await scenario(browser,origin,'invalid-data',{
          shop4_invoices:'{"bad":"SECRET-CUSTOMER"',
          shop4_parties:'null',shop4_settings:'[]',shop4_import_pending:'SECRET-PHOTO'
        },/ATTENTION/);
        await scenario(browser,origin,'no-business-data',{},/OBSERVATIONS ONLY/);
      }finally{await browser.close();}
    }
  });
})().catch(e=>{console.error('FAIL: A1b browser gate '+(e.stack||e));process.exitCode=1;});
