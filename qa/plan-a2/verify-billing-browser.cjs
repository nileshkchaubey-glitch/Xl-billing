'use strict';
const fs=require('node:fs'),http=require('node:http'),crypto=require('node:crypto'),cp=require('node:child_process');
const path=require('node:path');
const {chromium,firefox,webkit}=require('playwright');
const root=path.resolve(__dirname,'../..');
const versions={base:cp.execFileSync('git',['--no-replace-objects','cat-file','blob','ed583b697ea1ebdb6041c30f76fa4984c972f713:index.html'],{cwd:root}),candidate:fs.readFileSync(root+'/index.html')};
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const seed={shop4_settings:JSON.stringify({shopName:'SYNTHETIC INDEPENDENT QA',owner:'SYNTHETIC',address:'',phone:'',gstin:'',state:'',prefix:'SYNTHETIC-INV-',invNo:1001,fy:'2026-27',terms:'SYNTHETIC terms',bank:'',customFields:[],modules:{packing:true,dispatch:true,retail:true,gst:true},jsonbinKey:'SYNTHETIC-KEY',jsonbinId:'SYNTHETIC-ID',deletePin:'1234',invoiceEntry:{showBrand:true,showPacking:true,multiplyPacks:true}}),
shop4_app_version:'16',shop4_items:JSON.stringify([{id:'SYNTHETIC-ITEM',name:'SYNTHETIC PAPER',unit:'Pcs',saleRate:25,purchaseRate:20}]),shop4_parties:JSON.stringify([{id:'SYNTHETIC-CUSTOMER',name:'SYNTHETIC CUSTOMER',type:'customer',openingBal:25}]),shop4_invoices:JSON.stringify([{id:'SYNTHETIC-HISTORICAL',invoiceNo:'SYNTHETIC-INV-99',date:'2026-10-01',partyId:'SYNTHETIC-CUSTOMER',partyName:'SYNTHETIC CUSTOMER',items:[{name:'SYNTHETIC PAPER',qty:4,rate:25,amt:100}],subtotal:100,total:100,paid:20,balance:80,payments:[{date:'2026-10-01',amt:20,mode:'Cash'}],paymentType:'Cash',dispatchStatus:'pending'}]),shop4_purchases:'[]',shop4_retail:'[]',shop4_audit:'[]',unrelated_synthetic:'unchanged'};
const rows=[];
function demand(ok,label){if(!ok){const e=new Error(label);e.gate=label;throw e;}}
(async()=>{
 const server=http.createServer((req,res)=>{const matched=req.url.match(/^\/(base|candidate)\.html$/);res.setHeader('Content-Type','text/html');res.end(matched?versions[matched[1]]:'<!doctype html><body>SYNTHETIC blank origin</body>');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 try{for(const type of [chromium,firefox,webkit]){const browser=await type.launch({headless:true});try{for(const version of ['base','candidate']){
  const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage(),requests=[],errors=[];
  context.on('page',p=>p.on('pageerror',e=>errors.push({name:e.name,messageSha256:hash(e.message)})));
  page.on('pageerror',e=>errors.push({name:e.name,messageSha256:hash(e.message)}));
  await context.route('**/*',route=>{const u=route.request().url();if(u!==origin+'/seed'&&u!==origin+'/'+version+'.html'){requests.push(new URL(u).host);return route.abort();}return route.continue();});
  await page.goto(origin+'/seed');await page.evaluate(data=>{for(const [k,v]of Object.entries(data))localStorage.setItem(k,v);},seed);
  await page.goto(origin+'/'+version+'.html',{waitUntil:'load'});await page.waitForTimeout(350);
  const outcome={engine:type.name(),browserVersion:browser.version(),version,sourceSha256:hash(versions[version]),steps:[],externalRequests:0,pageErrors:[]};
  let checkpoint='bootstrap';
  async function stage(name,task){try{await task();outcome.steps.push({name,status:'PASS'});}catch(e){outcome.steps.push({name,status:'FAIL',checkpoint,gate:e.gate||'harness-or-application-error',errorName:e.name,messageSha256:hash(e.message)});}}
  let createdId;
  await stage('real-new-invoice-save',async()=>{
   checkpoint='new-invoice-navigation';await page.locator('a[data-pg="new-sale"]').click();await page.waitForTimeout(200);
   checkpoint='party-input';await page.locator('#inv-party').fill('SYNTHETIC CUSTOMER');checkpoint='party-autocomplete-selection';await page.locator('#ac-inv-party .ac-item').first().click();
   // The missing-phone fixture triggers the real V13 quick-phone prompt and
   // its delayed focus. Observe that callback before typing into the item;
   // no forced clicks, function replacement, input retry or billing fix.
   checkpoint='quick-phone-focus';await page.waitForFunction(()=>document.activeElement?.id==='quick-phone-inp');
   checkpoint='item-input';await page.locator('[id^="sn-"]').fill('SYNTHETIC PAPER');checkpoint='item-autocomplete-selection';await page.locator('[id^="ac-sn-"] .ac-item').first().click();await page.waitForTimeout(200);
   checkpoint='invoice-amount-inputs';
   await page.locator('[id^="spc-"]').fill('3');await page.locator('[id^="sqt-"]').fill('2');await page.locator('[id^="srt-"]').fill('25');
   await page.locator('#inv-date').fill('2026-10-14');await page.locator('#inv-paid').fill('20');
   checkpoint='invoice-save-button';await page.locator('#save-inv-btn').click();
   const got=await page.evaluate(()=>({invoices:JSON.parse(localStorage.getItem('shop4_invoices')),settings:JSON.parse(localStorage.getItem('shop4_settings')),audit:JSON.parse(localStorage.getItem('shop4_audit'))}));
   demand(got.invoices.length===2,'invoice-not-created');const inv=got.invoices.find(i=>i.id!=='SYNTHETIC-HISTORICAL');createdId=inv.id;
   outcome.invoiceObserved={total:inv.total,paid:inv.paid,balance:inv.balance,qty:inv.items[0].qty,packCount:inv.items[0].packCount};demand(inv.total===150&&inv.paid===20&&inv.balance===130&&inv.items[0].qty===6,'invoice-packs-totals-regressed');
   demand(inv.invoiceNo==='SYNTHETIC-INV-1001'&&got.settings.invNo===1002,'invoice-number-counter-regressed');
   demand(JSON.stringify(got.invoices[0])===JSON.stringify(JSON.parse(seed.shop4_invoices)[0]),'historical-invoice-changed');
   demand(got.audit.some(a=>a.type==='create'&&a.entityId===createdId),'create-audit-missing');
  });
  if(createdId)await stage('real-payment-modal-save',async()=>{
   checkpoint='payment-modal';
   // Installed global opens the actual current modal; Save uses its real button handler.
   await page.evaluate(id=>window.openPayModal(id),createdId);await page.waitForTimeout(200);
   await page.locator('#pay-amount').fill('10');await page.locator('#pay-discount').fill('5');await page.locator('#pay-note').fill('SYNTHETIC QA RECEIPT');
   outcome.paymentControls=await page.evaluate(()=>({amount:document.getElementById('pay-amount').value,discount:document.getElementById('pay-discount').value}));await page.locator('#pay-modal button[onclick="savePayment()"]').click();
   const got=await page.evaluate(id=>({invoice:JSON.parse(localStorage.getItem('shop4_invoices')).find(i=>i.id===id),audit:JSON.parse(localStorage.getItem('shop4_audit'))}),createdId);
   outcome.paymentObserved={paid:got.invoice.paid,balance:got.invoice.balance,amounts:got.invoice.payments.map(p=>p.amt)};demand(got.invoice.paid===35&&got.invoice.balance===115,'receipt-or-discount-total-regressed');
   demand(got.invoice.payments.length===3&&got.invoice.payments[1].amt===10&&got.invoice.payments[2].amt===5&&got.invoice.payments[2].mode==='Discount','receipt-history-regressed');
   demand(got.audit.some(a=>a.type==='payment'&&a.entityId===createdId),'payment-audit-missing');
  });
  if(createdId)await stage('real-print-popup-content',async()=>{
   checkpoint='print-popup';
   await page.evaluate(id=>window.viewInvoice(id),createdId);
   const popupPromise=page.waitForEvent('popup',{timeout:3000});await page.locator('#inv-view-modal button[onclick="printInvoice()"]').click();const popup=await popupPromise;
   await popup.waitForLoadState('domcontentloaded');const body=await popup.locator('body').innerText();
   demand(body.includes('SYNTHETIC-INV-1001')&&body.includes('SYNTHETIC CUSTOMER')&&body.includes('SYNTHETIC PAPER'),'printed-invoice-identity-missing');
   demand((await popup.title()).includes('SYNTHETIC-INV-1001'),'print-title-identity-missing');await popup.close();
  });
  outcome.externalRequests=requests.length;outcome.pageErrors=errors;rows.push(outcome);console.log(JSON.stringify(outcome));await context.close();
 }}finally{await browser.close();}}}finally{await new Promise(r=>server.close(r));}
 const failed=rows.length!==6||rows.some(row=>row.steps.length!==3||row.steps.some(step=>step.status!=='PASS')||row.externalRequests!==0||row.pageErrors.length!==0);
 const report={scope:'synthetic full-app UI preservation smoke; no physical printer verification',node:process.version,playwright:require('playwright/package.json').version,status:failed?'FAIL':'PASS',rows};
 if(process.env.A2_EVIDENCE_DIR){const directory=path.resolve(process.env.A2_EVIDENCE_DIR);demand(directory!==root&&!directory.startsWith(root+path.sep),'evidence-must-be-outside-checkout');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'billing-results.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify({scope:report.scope,status:report.status,stages:rows.reduce((n,row)=>n+row.steps.length,0)}));process.exitCode=failed?1:0;
})().catch(e=>{console.error('Smoke harness failed: '+e.name+' '+hash(e.message));process.exitCode=1;});
