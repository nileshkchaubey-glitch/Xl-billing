'use strict';
// Safety assertions against the unchanged app. Failures reject the release gate.
// Every browser context is disposable and synthetic; external requests are blocked.
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const { shop } = require('../test/fixtures/shop.cjs');
const engines = require('@playwright/test');
const browserName = process.env.XL_REVIEW_BROWSER || 'chromium';
const sourcePath = path.resolve(process.env.XL_HTML || 'index.html');
const html = fs.readFileSync(sourcePath);
const only = new Set((process.env.XL_REVIEW_ONLY || '').split(',').filter(Boolean));
const group = process.env.XL_REVIEW_GROUP || process.argv.find(a=>a.startsWith('--group='))?.slice(8) || 'all';
const groups = {
  stabilization: ['legacy-payment','historical-purchase-discount','legacy-discount','settlement-rounding','payout-rounding','startup-mutation','fractional-total-reload','corrupt-storage','read-denied','old-bill-delete-pin','stale-payment-delete','stored-text-xss'],
  foundation: ['failed-write-invoices','failed-write-settings','failed-write-audit','restore-truncated','restore-wrong-schema','restore-tampered-checksum','restore-legacy-valid','restore-partial-write','backup-completeness','backup-rollback','failed-delete-feedback'],
  views: ['audit-search','purchase-sort','party-transactions-tab','cancelled-payment-ledger']
};
if(group !== 'all' && !groups[group]) throw new Error('Unknown acceptance group: '+group);
const results = [];
const hashedPin = { deletePinSalt: 'synthetic-review-salt', deletePinHash: crypto.createHash('sha256').update('synthetic-review-salt:2468').digest('hex') };
let browser, server, origin;
async function snapshot(page) {
  return page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(k=>!k.startsWith('xl_storage_')).sort().map(k => [k, localStorage.getItem(k)])));
}
async function records(page, key = 'invoices') {
  return page.evaluate(k => JSON.parse(localStorage.getItem('shop4_' + k)), key);
}
async function injectWriteFailure(page, key) {
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(k, v) {
      if (k === key) throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
      return original.call(this, k, v);
    };
  }, key);
}
async function prepareInvoice(page) {
  await page.evaluate(() => {
    nav('new-sale');
    document.getElementById('inv-party').value = 'Synthetic Customer';
    document.getElementById('inv-party-id').value = 'p1';
    document.getElementById('inv-date').value = '2026-10-09';
    document.getElementById('inv-paid').value = '0';
    saleItems = [{id:'review-line',name:'Paper Cups',itemId:'i1',qty:5,rate:20,amt:100,unit:'Pcs',packCount:'',packType:''}];
    renderSaleItems();
  });
}
async function attemptSave(page) {
  return page.evaluate(async () => { try { await saveSaleInvoice(false); return null; } catch(e) { return e.name; } });
}
async function importText(page, content) {
  await page.evaluate(async content => {if(window.XLBackup)await importData({files:[new File([content], 'synthetic-backup.json', {type:'application/json'})],value:''});else await new Promise(resolve=>{const original=FileReader.prototype.readAsText;FileReader.prototype.readAsText=function(file){this.addEventListener('loadend',resolve,{once:true});return original.call(this,file);};importData({files:[new File([content],'synthetic.json')],value:''});});}, content);
  if(await page.locator('#xl-restore-confirm').count()){
    await page.locator('#xl-restore-confirm').click();
    if(await page.locator('#del-pin-overlay').count()){
      await page.locator('#del-pin-inp').fill('2468');await page.locator('#del-pin-ok').click();
      await page.waitForFunction(()=>!window.XLStore?.isBusy());
      await page.waitForFunction(()=>!document.getElementById('del-pin-overlay')||!!document.getElementById('del-pin-error')?.textContent);
    }
  }
}
async function exportedBackup(page) {
  return page.evaluate(() => new Promise(resolve => {
    URL.createObjectURL = blob => {blob.text().then(text=>resolve(JSON.parse(text)));return 'blob:synthetic';};
    HTMLAnchorElement.prototype.click = function() {};
    exportData();
  }));
}
async function probe(id, body, modify = () => {}) {
  if(group !== 'all' && !groups[group].includes(id)) return;
  if (only.size && !only.has(id)) return;
  const context = await browser.newContext({timezoneId:'Asia/Kolkata'});
  await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.on('dialog', dialog => dialog.accept());
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  const data = shop(2);if(group==='foundation')Object.assign(data.settings,hashedPin); modify(data);
  await page.addInitScript(data => {
    // Seed once; preserve bytes across reloads and interruption probes.
    if (!localStorage.getItem('__synthetic_review_seeded')) {
      localStorage.clear();
      for (const [k,v] of Object.entries(data)) localStorage.setItem('shop4_' + k, JSON.stringify(v));
      localStorage.setItem('shop4_app_version', '16');
      localStorage.setItem('__synthetic_review_seeded','yes');
    }
  }, data);
  try {
    await page.goto(origin);await page.waitForFunction(()=>!window.XLStore||window.XLAppReady);
    const outcome = await body(page, context);
    const result = {id, status:outcome.safe ? 'PASS' : 'FAIL', ...outcome, pageErrors};
    results.push(result);
    console.log(result.status + ' ' + id + ' ' + JSON.stringify(result.observed));
  } catch(error) {
    results.push({id,status:'HARNESS_ERROR',error:error.message,pageErrors});
    console.log('HARNESS_ERROR ' + id + ' ' + error.message);
  } finally { await context.close(); }
}
async function main() {
  server = http.createServer((req,res) => {res.setHeader('Content-Type','text/html');res.end(html);});
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  browser = await engines[browserName].launch();

  await probe('legacy-payment', async page => {
    await page.evaluate(() => openPayModal('s0'));
    await page.locator('#pay-amount').fill('10');
    await page.evaluate(() => savePayment());
    const inv = (await records(page))[0];
    return {safe:inv.paid === 30 && inv.balance === 70, observed:{paid:inv.paid,balance:inv.balance}};
  }, data => { delete data.invoices[0].payments; });

  await probe('historical-purchase-discount', async page => {
    const before=await snapshot(page);
    await page.evaluate(() => openPurPayModal('u1'));
    await page.locator('#pur-pay-amt').fill('480');
    await page.evaluate(() => savePurPayment());
    const pur=(await records(page,'purchases'))[0];
    const discount=pur.discounts.reduce((sum,p)=>sum+p.amt,0);
    const unchanged=JSON.stringify(before)===JSON.stringify(await snapshot(page));
    return {safe:unchanged || pur.paid+discount<=pur.total,observed:{paid:pur.paid,discount,total:pur.total,balance:pur.balance,unchanged}};
  }, data => {data.purchases[0].discount=10;data.purchases[0].discounts=[{date:'2026-10-09',amt:10,note:'Synthetic historical discount'}];data.purchases[0].balance=470;});

  await probe('legacy-discount', async page => {
    const before = await snapshot(page);
    await page.evaluate(() => openSettlementModal('p1','Synthetic Customer'));
    await page.locator('#settle-discount').fill('10');
    await page.evaluate(() => saveSettlement('p1','Synthetic Customer'));
    const inv = (await records(page))[0];
    const unchanged = JSON.stringify(before) === JSON.stringify(await snapshot(page));
    // A mismatch must be rejected without changes, or preserve the historical paid amount.
    return {safe:unchanged || (inv.paid === 30 && inv.balance === 70),observed:{paid:inv.paid,balance:inv.balance,history:inv.payments,unchanged}};
  }, data => { delete data.invoices[0].payments; });

  await probe('settlement-rounding', async page => {
    await page.evaluate(async () => {
      openSettlementModal('p1','Synthetic Customer');
      document.getElementById('settle-total-inp').value = '0.01';
      document.getElementById('si-s0').value = '0.006';
      document.getElementById('si-s1').value = '0.006';
      await saveSettlement('p1','Synthetic Customer');
    });
    const applied = (await records(page)).reduce((s,i) => s + i.paid - 20,0);
    return {safe:Math.abs(applied) < 0.000001 || Math.abs(applied - 0.01) < 0.000001,observed:{received:0.01,applied}};
  });

  await probe('payout-rounding', async page => {
    await page.evaluate(async () => {
      openPayOutModal();poutSelectParty('p2','Synthetic Supplier');
      document.getElementById('pout-amount').value = '0.01';
      document.getElementById('pi-u1').value = '0.006';
      document.getElementById('pi-u2').value = '0.006';
      await savePoutPayment();
    });
    const applied = (await records(page,'purchases')).reduce((s,i) => s + i.paid - 20,0);
    return {safe:Math.abs(applied) < 0.000001 || Math.abs(applied - 0.01) < 0.000001,observed:{received:0.01,applied}};
  }, data => { data.purchases.push({...data.purchases[0],id:'u2',billNo:'P-2'}); });

  await probe('startup-mutation', async page => {
    const inv = (await records(page))[0];
    return {safe:inv.paid === 150,observed:{paidBefore:150,paidAfter:inv.paid,paymentHistoryTotal:inv.payments.reduce((s,p)=>s+p.amt,0),audit:await records(page,'audit')}};
  }, data => { data.invoices[0].paid = 150;data.invoices[0].balance = -50;data.invoices[0].payments[0].amt = 150; });

  await probe('fractional-total-reload', async page => {
    await page.evaluate(() => openPayModal('s0'));
    await page.locator('#pay-amount').fill('2719.49');
    await page.evaluate(() => savePayment());
    const before = (await records(page))[0];
    await page.reload();await page.waitForFunction(()=>!window.XLStore||window.XLAppReady);
    const after = (await records(page))[0];
    return {safe:after.paid === before.paid && Math.abs(after.paid-after.payments.reduce((s,p)=>s+p.amt,0)) < 1e-9,observed:{total:after.total,paidBeforeReload:before.paid,paidAfterReload:after.paid,paymentHistoryTotal:after.payments.reduce((s,p)=>s+p.amt,0)}};
  }, data => { Object.assign(data.invoices[0],{total:2719.4895,paid:0,balance:2719.4895,payments:[]}); });

  await probe('corrupt-storage', async page => {
    await prepareInvoice(page);
    await page.evaluate(() => localStorage.setItem('shop4_invoices','{broken'));
    const error = await attemptSave(page);
    const raw = await page.evaluate(() => localStorage.getItem('shop4_invoices'));
    return {safe:raw === '{broken',observed:{error,originalBytesPreserved:raw === '{broken',invoiceCount:raw === '{broken' ? null : JSON.parse(raw).length}};
  });

  await probe('read-denied', async page => {
    await prepareInvoice(page);
    await page.evaluate(() => {
      const original = Storage.prototype.getItem;
      Storage.prototype.getItem = function(k) {if(k === 'shop4_invoices') throw new DOMException('Synthetic denied read','SecurityError');return original.call(this,k);};
    });
    const error = await attemptSave(page);
    // Reload restores the prototype and does not reseed the context.
    await page.reload();await page.waitForFunction(()=>!window.XLStore||window.XLAppReady);
    const ids = (await records(page)).map(i=>i.id);
    return {safe:ids.includes('s0') && ids.includes('s1'),observed:{error,originalIdsPreserved:ids.includes('s0') && ids.includes('s1'),invoiceCount:ids.length}};
  });

  for (const key of ['invoices','settings','audit']) {
    await probe('failed-write-' + key, async page => {
      await prepareInvoice(page);
      const before = await snapshot(page);
      await injectWriteFailure(page,'shop4_' + key);
      const error = await attemptSave(page);
      const after = await snapshot(page);
      const changedKeys = Object.keys(after).filter(k=>before[k] !== after[k]);
      const toast = await page.locator('#toast').textContent();
      await page.reload();await page.waitForFunction(()=>!window.XLStore||window.XLAppReady);
      const recovered = await snapshot(page);
      return {safe:JSON.stringify(before) === JSON.stringify(recovered),observed:{error,changedKeys,toast,recoveredToPreviousSnapshot:JSON.stringify(before) === JSON.stringify(recovered),invoiceCount:(await records(page)).length}};
    });
  }

  await probe('restore-truncated', async page => {
    const before = await snapshot(page);await importText(page,'{"invoices":[');
    return {safe:JSON.stringify(before) === JSON.stringify(await snapshot(page)),observed:{toast:await page.locator('#toast').textContent()}};
  });
  await probe('restore-wrong-schema', async page => {
    const before = await snapshot(page);await importText(page,'{"invoices":[]}');
    return {safe:JSON.stringify(before) === JSON.stringify(await snapshot(page)),observed:{invoiceCount:(await records(page)).length,toast:await page.locator('#toast').textContent()}};
  });
  await probe('restore-tampered-checksum', async page => {
    const before = await snapshot(page);
    const data = shop(2);
    const checksum = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    data.invoices[0].total = 999;
    await importText(page,JSON.stringify({...data,v:4,checksum}));
    return {safe:JSON.stringify(before) === JSON.stringify(await snapshot(page)),observed:{tamperedTotal:(await records(page))[0].total,tamperedInputApplied:(await records(page))[0].total===999,toast:await page.locator('#toast').textContent()}};
  });
  await probe('restore-legacy-valid', async page => {
    const data=shop(2);data.invoices[0].notes='Synthetic restored note';
    await importText(page,JSON.stringify({...data,v:4}));
    const inv=(await records(page))[0];
    return {safe:inv.notes===data.invoices[0].notes && inv.paid===20 && inv.items[0].qty===5,observed:{invoiceCount:(await records(page)).length,paid:inv.paid,quantity:inv.items[0].qty,legacyNoteRestored:inv.notes===data.invoices[0].notes}};
  });
  await probe('restore-partial-write', async page => {
    const before = await snapshot(page);await injectWriteFailure(page,'shop4_items');
    await importText(page,JSON.stringify({v:4,settings:{shopName:'Synthetic replacement'},items:[],parties:[],invoices:[],purchases:[],retail:[]}));
    const after = await snapshot(page);
    return {safe:JSON.stringify(before) === JSON.stringify(after),observed:{changedKeys:Object.keys(after).filter(k=>before[k]!==after[k]),shopName:(await records(page,'settings')).shopName,toast:await page.locator('#toast').textContent()}};
  });
  await probe('backup-completeness', async page => {
    const data = await exportedBackup(page);
    const raw=data.payload?.records?Object.fromEntries(data.payload.records.map(r=>[r.key,r.value])):null;return {safe:raw?Array.isArray(JSON.parse(raw.shop4_audit))&&!!data.checksum:Array.isArray(data.audit)&&!!data.checksum,observed:{exportedKeys:Object.keys(data),auditIncluded:raw?Object.hasOwn(raw,'shop4_audit'):'audit' in data,checksumIncluded:'checksum' in data,privateCredentialsIncluded:raw?JSON.parse(raw.shop4_settings).jsonbinKey==='synthetic-secret-only':data.settings.jsonbinKey==='synthetic-secret-only'}};
  }, data => { data.settings.jsonbinKey = 'synthetic-secret-only';data.audit=[{id:'a',type:'create',label:'Synthetic audit',ts:'2026-10-09T08:00:00Z'}]; });
  await probe('backup-rollback', async page => {
    const before=await snapshot(page), backup=await exportedBackup(page);
    await page.evaluate(() => delInvoice('s0'));
    await page.locator('#del-pin-inp').fill('2468');
    await page.waitForFunction(() => !document.getElementById('del-pin-ok').disabled);
    await page.locator('#del-pin-ok').click();
    await page.waitForFunction(() => !document.getElementById('del-pin-overlay') || !!document.getElementById('del-pin-error')?.textContent);
    if((await records(page)).length!==1)throw new Error('Synthetic deletion did not complete before restore.');
    await importText(page,JSON.stringify(backup));
    const after=await snapshot(page);
    return {safe:JSON.stringify(before)===JSON.stringify(after),observed:{invoiceCount:(await records(page)).length,auditEntries:(await records(page,'audit')).length,changedKeys:Object.keys(after).filter(k=>before[k]!==after[k])}};
  }, data => {Object.assign(data.settings,hashedPin);data.audit=[{id:'before',type:'create',label:'Synthetic original audit',ts:'2026-10-09T08:00:00Z'}];});

  await probe('old-bill-delete-pin', async page => {
    await page.evaluate(() => nav('prev-bills'));
    await page.locator('#page-prev-bills button[onclick^="pbDelBill"]').first().click();
    const count = (await records(page)).length;
    return {safe:count === 2,observed:{invoiceCount:count,pinDialogCount:await page.locator('#del-pin-overlay').count(),auditEntries:(await records(page,'audit')).length}};
  }, data => {Object.assign(data.settings,hashedPin);data.invoices.forEach(i=>i.isManual=true);});

  await probe('stale-payment-delete', async page => {
    await page.evaluate(() => deletePaymentEntry('s0',0));
    // A second tab changes the array after the first tab chose its payment.
    const other = await page.context().newPage();await other.goto(origin);await other.waitForFunction(()=>!window.XLStore||window.XLAppReady);
    await other.evaluate(() => XLStore.run('Synthetic concurrent payment',()=>{const invs=getInvoices();invs[0].payments.shift();invs[0].paid=30;invs[0].balance=70;DB.set('invoices',invs);}));
    await page.locator('#del-pin-inp').fill('2468');
    await page.waitForFunction(() => !document.getElementById('del-pin-ok').disabled);
    await page.locator('#del-pin-ok').click();
    await page.waitForFunction(() => !document.getElementById('del-pin-overlay') || !!document.getElementById('del-pin-error')?.textContent);
    const inv = (await records(page))[0];
    return {safe:inv.payments.length === 1 && inv.payments[0].note === 'second payment',observed:{payments:inv.payments,paid:inv.paid}};
  }, data => {Object.assign(data.settings,hashedPin);Object.assign(data.invoices[0],{paid:50,balance:50,payments:[{amt:20,date:'2026-10-09',mode:'Cash',note:'first payment'},{amt:30,date:'2026-10-09',mode:'Cash',note:'second payment'}]});});

  await probe('failed-delete-feedback', async page => {
    const before = await snapshot(page);await injectWriteFailure(page,'shop4_invoices');
    await page.evaluate(() => delInvoice('s0'));
    await page.locator('#del-pin-inp').fill('2468');
    await page.waitForFunction(() => !document.getElementById('del-pin-ok').disabled);
    await page.locator('#del-pin-ok').click();
    await page.waitForFunction(() => !document.getElementById('del-pin-overlay') || !!document.getElementById('del-pin-error')?.textContent);
    const after = await snapshot(page);
    return {safe:JSON.stringify(before) === JSON.stringify(after) && await page.locator('[role=alert]').count() > 0,observed:{invoiceCount:(await records(page)).length,auditEntries:(await records(page,'audit')).length,visibleAlertCount:await page.locator('[role=alert]').count(),toast:await page.locator('#toast').textContent()}};
  }, data => Object.assign(data.settings,hashedPin));

  await probe('stored-text-xss', async page => {
    await page.evaluate(() => XLStore.run('Synthetic stored text',()=>{const invs=getInvoices();invs[0].partyName='<img src="/synthetic-missing" onerror="window.__reviewXss=1">';DB.set('invoices',invs);renderSalesList();}));
    await page.waitForFunction(() => window.__reviewXss === 1, null, {timeout:1000}).catch(() => {});
    const executed=await page.evaluate(() => window.__reviewXss === 1);
    return {safe:!executed,observed:{harmlessScriptExecuted:executed}};
  });

  await probe('audit-search', async page => {
    await page.evaluate(() => {DB.set('audit',Array.from({length:25},(_,i)=>({id:'a'+i,type:'create',entityType:'invoice',label:'Record '+i,user:'Review Needle',ts:'2026-10-09T08:00:00Z'})));nav('audit-log');});
    await page.locator('#audit-srch').fill('Needle');
    const count=await page.locator('#page-audit-log tbody tr').count();
    return {safe:count === 20,observed:{rows:count,pager:await page.locator('#page-audit-log .pgn-info').textContent()}};
  });
  await probe('purchase-sort', async page => {
    await page.evaluate(() => {const purs=getPurchases();DB.set('purchases',[{...purs[0],id:'a',billNo:'P-2'},{...purs[0],id:'z',billNo:'P-1'}]);nav('purchase-list');});
    await page.locator('#purchase-table [aria-label="Sort column"]').selectOption('invoiceNo');
    await page.locator('#purchase-table [aria-label="Sort direction"]').selectOption('asc');
    const first = await page.locator('#purchase-table tbody tr').first().locator('td').nth(3).textContent();
    return {safe:first.trim()==='P-1',observed:{firstBill:first.trim(),sortableHeaders:await page.locator('#purchase-table th[aria-sort]').count()}};
  });
  await probe('party-transactions-tab', async page => {
    await page.evaluate(() => openPartyDetail('p1'));
    await page.locator('#pdt-txn').click();
    return {safe:await page.locator('#pd-tab-txn').isVisible(),observed:{transactionContentVisible:await page.locator('#pd-tab-txn').isVisible()}};
  });
  await probe('cancelled-payment-ledger', async page => {
    const entries=await page.evaluate(() => getAllPayments().filter(p=>p._invId==='s0').length);
    return {safe:entries===0,observed:{cancelledInvoicePaymentEntries:entries}};
  }, data => {data.invoices[0].status='cancelled';});

  await browser.close();browser=null;await new Promise(resolve=>server.close(resolve));server=null;
  if(!results.length) throw new Error('No safety probes selected; the gate cannot pass without evidence.');
  const workspaceCommit=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const report={workspaceCommit,sourceRevision:process.env.XL_REVIEW_REVISION || (process.env.XL_HTML ? null : workspaceCommit),sourceSha256:crypto.createHash('sha256').update(html).digest('hex'),runnerSha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),browser:browserName,results,summary:{pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length,harnessErrors:results.filter(r=>r.status==='HARNESS_ERROR').length}};
  const output=process.env.XL_REVIEW_REPORT || path.resolve('test-results/review/'+group+'-'+browserName+'.json');
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  console.log('Safety gate: '+JSON.stringify(report.summary));
  process.exitCode=report.summary.fail || report.summary.harnessErrors ? 1 : 0;
}
main().catch(async error=>{console.error(error);if(browser)await browser.close();if(server)server.close();process.exitCode=2;});
