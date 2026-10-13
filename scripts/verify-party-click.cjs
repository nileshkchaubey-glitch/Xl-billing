'use strict';
// Independent synthetic financial-report checks. No existing owner assertion is replaced.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),cp=require('node:child_process');
const engines=require('@playwright/test'),{shop}=require('../test/fixtures/shop.cjs');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(process.env.XL_PARTY_CLICK_HTML||path.join(root,'index.html'),'utf8');
const browserName=process.env.XL_PARTY_CLICK_BROWSER||'chromium';
const output=path.resolve(process.env.XL_PARTY_CLICK_OUTPUT||`test-results/party-click/${browserName}.json`);
let browser,server,origin;const results=[];
const snapshot=page=>page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('shop4_')||k.startsWith('v8_')).sort().map(k=>[k,localStorage.getItem(k)])));
const money=text=>Number(String(text).replace(/[^0-9.-]/g,''));
async function cards(page,selector){return page.locator(selector+' .sc').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.querySelector('.sc-lbl').textContent,n.querySelector('.sc-val').textContent])));}
async function probe(id,data,body){let context;try{context=await browser.newContext({timezoneId:'Asia/Kolkata'});await context.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());const page=await context.newPage();page.setDefaultTimeout(6000);await page.clock.install({time:new Date('2026-10-12T06:30:00Z')});await page.clock.pauseAt(new Date('2026-10-12T06:30:01Z'));await page.addInitScript(()=>{window.partyPointerEvents=[];for(const type of ['pointerdown','pointerup','click'])document.addEventListener(type,e=>{const b=e.target.closest('button');if(b||e.target.tagName==='TD')window.partyPointerEvents.push({type,target:e.target.tagName,text:(b?.textContent||e.target.textContent||'').trim(),onclick:b?.getAttribute('onclick')||''});},true);});await page.goto(origin);await page.waitForFunction(()=>window.XLAppReady===true);await page.evaluate(data=>{localStorage.clear();for(const[k,v]of Object.entries(data))localStorage.setItem('shop4_'+k,JSON.stringify(v));},data);await page.reload();await page.waitForFunction(()=>window.XLAppReady===true);const before=await snapshot(page),observed=await body(page),unchanged=JSON.stringify(before)===JSON.stringify(await snapshot(page));const pass=observed.pass&&unchanged;results.push({id,status:pass?'PASS':'FAIL',...observed,bytes_preserved:unchanged});console.log(`${pass?'PASS':'FAIL'} ${id} ${JSON.stringify(results.at(-1))}`);}catch(e){results.push({id,status:'HARNESS_ERROR',error:e.message});console.log('HARNESS_ERROR '+id+' '+e.message);}finally{await context?.close();}}
async function nav(page,name){await page.locator(`a.nl[data-pg="${name}"]`).click();await page.locator('#page-'+name).waitFor({state:'visible'});}
async function cases(){
 const data=shop(2);data.parties[0].openingBal=-200;data.invoices[1].status='cancelled';
 await probe('detail-pointer-held-across-navigation-timer',data,async page=>{
  // Dispatch real navigation input, then hold a real pointer over the intended Detail action.
  await page.locator('a.nl[data-pg="parties"]').click();const button=page.locator(`#parties-table [onclick="openPartyDetail('p1')"]`),before=await button.boundingBox(),settleInitially=await page.locator('#parties-table .settle-inline-btn').count();
  await page.mouse.move(before.x+before.width/2,before.y+before.height/2);await page.mouse.down();await page.clock.runFor(100);const after=await button.boundingBox();await page.mouse.up();
  const observed=await page.evaluate(()=>({events:window.partyPointerEvents,shown:document.getElementById('party-detail-modal')?.classList.contains('show')||false,stats:[...document.querySelectorAll('#party-detail-modal .pd-stat-val')].map(e=>e.textContent)}));
  const stable=Math.abs(before.x-after.x)<0.1&&Math.abs(before.y-after.y)<0.1;
  return {pass:settleInitially===1&&stable&&observed.shown&&money(observed.stats[2])===-120,expected:'One synchronous Settle action; Detail coordinates remain fixed across80ms callback; pointerdown/up opens Detail once; invoice due80 + openingcredit-200 = -120',observed:{...observed,before,after,settleInitially,stable}};
 });
 await probe('settle-action-uses-invoice-due-not-net-credit',data,async page=>{await page.locator('a.nl[data-pg="parties"]').click();const button=page.locator("#parties-table tbody tr").filter({has:page.locator(`[onclick="openPartyDetail('p1')"]`)}).locator(".settle-inline-btn");const present=await button.count();if(present)await button.click();const summary=await page.evaluate(()=>document.getElementById('settlement-opening-summary')?.textContent||''),modalText=await page.evaluate(()=>document.getElementById('settlement-modal')?.textContent||'');return {pass:present===1&&/80.00/.test(modalText)&&/-120.00/.test(summary)&&/opening balances are unchanged/.test(summary),expected:'Unpaid invoice80 remains selectable with net opening credit -120; preview states opening balances are unchanged',observed:{present,summary,modalText}};});
 await probe('stored-party-phone-remains-literal',(()=>{const d=shop(1);d.parties[0].phone='<img src="synthetic-phone-image" onerror="window.syntheticPhoneExecuted=true">';return d;})(),async page=>{await nav(page,'parties');await page.waitForLoadState('networkidle');const observed=await page.evaluate(()=>({executed:window.syntheticPhoneExecuted===true,images:document.querySelectorAll('#parties-table img').length,text:document.getElementById('parties-table').textContent}));return {pass:!observed.executed&&observed.images===0&&observed.text.includes('<img src="synthetic-phone-image"'),expected:'Stored phone text is literal, never an executable element; original bytes remain unchanged',observed};});
 await probe('opening-only-has-no-invoice-settlement-action',(()=>{const d=shop(0);d.parties[0].openingBal=25;return d;})(),async page=>{await page.locator('a.nl[data-pg="parties"]').click();const before=await page.locator('#parties-table .settle-inline-btn').count();await page.clock.runFor(300);const after=await page.locator('#parties-table .settle-inline-btn').count();return {pass:before===0&&after===0,expected:'Opening receivable25 without an unpaid invoice does not fabricate an invoice settlement target',observed:{before,after}};});
 await probe('payment-out-amount-focus-survives-opening-timer',shop(2),async page=>{
  // Hold real Amount focus across the former 80 ms callback, then enter text.
  // This reproduces the actual owner failure without slowing or retrying input.
  await page.locator('a.nl[data-pg="pay-out"]').click();
  await page.locator('#pout-party').fill('Synthetic Supplier');
  await page.locator('#ac-pout-party .ac-item').first().click();
  await page.locator('#pout-mode').selectOption('UPI');
  await page.locator('#pout-amount').click();
  const before=await page.evaluate(()=>document.activeElement.id);
  await page.clock.runFor(100);
  const after=await page.evaluate(()=>document.activeElement.id);
  await page.keyboard.insertText('12.34');
  const observed=await page.evaluate(()=>({party:document.getElementById('pout-party').value,
    partyId:document.getElementById('pout-party-id').value,amount:document.getElementById('pout-amount').value,
    allocation:document.getElementById('pi-u1')?.value||'',mode:document.getElementById('pout-mode').value,
    reviewBills:(window._poutBills||[]).map(b=>b.id)}));
  return {pass:before==='pout-amount'&&after==='pout-amount'&&observed.party==='Synthetic Supplier'&&observed.partyId==='p2'&&
    money(observed.amount)===12.34&&money(observed.allocation)===12.34&&observed.mode==='UPI'&&
    observed.reviewBills.length===1&&observed.reviewBills[0]==='u1',
    expected:'Amount retains focus across the opening timer; typing 12.34 changes only its allocation, preserving selected supplier p2 and billing bytes',
    observed:{focus_before_timer:before,focus_after_timer:after,...observed}};
 });
}
async function main(){server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end(source);});await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;browser=await engines[browserName].launch({headless:true});await cases();}
main().catch(e=>results.push({id:'runner',status:'HARNESS_ERROR',error:e.message})).finally(async()=>{await browser?.close();await new Promise(r=>server?server.close(r):r());const summary={pass:results.filter(x=>x.status==='PASS').length,fail:results.filter(x=>x.status==='FAIL').length,harness_errors:results.filter(x=>x.status==='HARNESS_ERROR').length};fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({tested_commit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),source_sha256:crypto.createHash('sha256').update(source).digest('hex'),runner_sha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),browser:browserName,synthetic_only:true,summary,results},null,2)+'\n');console.log('Party click: '+JSON.stringify(summary));process.exitCode=summary.harness_errors?2:summary.fail?1:0;});
