'use strict';
const {test,expect}=require('@playwright/test'),{shop}=require('../fixtures/shop.cjs');
const boundaries=[
 {label:'October 00:30 IST',instant:'2026-09-30T19:00:00.000Z',date:'2026-10-01',first:'2026-10-01',last:'2026-10-31',fy:'2026-27'},
 {label:'October 23:30 IST',instant:'2026-10-01T18:00:00.000Z',date:'2026-10-01',first:'2026-10-01',last:'2026-10-31',fy:'2026-27'},
 {label:'March 31 late evening IST',instant:'2026-03-31T18:00:00.000Z',date:'2026-03-31',first:'2026-03-01',last:'2026-03-31',fy:'2025-26'},
 {label:'April 1 early morning IST',instant:'2026-03-31T19:00:00.000Z',date:'2026-04-01',first:'2026-04-01',last:'2026-04-30',fy:'2026-27'},
 {label:'December 31 late evening IST',instant:'2026-12-31T18:00:00.000Z',date:'2026-12-31',first:'2026-12-01',last:'2026-12-31',fy:'2026-27'},
 {label:'January 1 early morning IST',instant:'2026-12-31T19:00:00.000Z',date:'2027-01-01',first:'2027-01-01',last:'2027-01-31',fy:'2026-27'}
];
for(const timezoneId of ['Asia/Kolkata','America/Los_Angeles','Pacific/Auckland'])for(const boundary of boundaries){
 test(`business date ${boundary.label}, device ${timezoneId}`,async({browser,baseURL})=>{
  const ctx=await browser.newContext({timezoneId}),page=await ctx.newPage();
  try{
   await page.clock.setFixedTime(new Date(boundary.instant));
   await page.goto(baseURL);await page.waitForFunction(()=>window.XLAppReady);
   await page.evaluate(data=>{localStorage.clear();for(const[k,v]of Object.entries(data))localStorage.setItem('shop4_'+k,JSON.stringify(v));},shop(0));
   await page.reload();await page.waitForFunction(()=>window.XLAppReady);
   await page.locator('.nl[data-pg="new-sale"]').click();
   // The real Save button owns the operation; synthetic line entry replaces only item typing.
   await page.locator('#inv-party').fill('Synthetic Customer');
   await page.evaluate(()=>{document.getElementById('inv-party-id').value='p1';saleItems=[{id:'synthetic-date-row',name:'Paper Cups',itemId:'i1',qty:5,rate:20,amt:100,unit:'Pcs',packCount:'',packType:''}];renderSaleItems();});
   await page.locator('#save-inv-btn').click();await expect(page.locator('#toast')).toContainText('saved');
   const stored=await page.evaluate(()=>({invoice:getInvoices().at(-1),settings:getSettings(),audit:DB.get('audit')}));
   expect(stored.invoice.date).toBe(boundary.date);await expect(page.locator('#pl-from')).toHaveValue(boundary.first);await expect(page.locator('#pl-to')).toHaveValue(boundary.last);expect(stored.invoice.invoiceNo).toBe('INV-1001');expect(stored.settings.invNo).toBe(1002);expect(stored.settings.fy).toBe('2026-27');
   expect(stored.invoice.createdAt).toBe(boundary.instant);expect(stored.audit.at(-1).ts).toBe(boundary.instant);
   expect(await page.evaluate(()=>businessFinancialYear(today()))).toBe(boundary.fy);
   await page.evaluate(()=>{nav('retail-entry');});await expect(page.locator('#ret-date')).toHaveValue(boundary.date);
   await page.evaluate(()=>nav('new-purchase'));await expect(page.locator('#pur-date')).toHaveValue(boundary.date);
  }finally{await ctx.close();}
 });
}
test('October filters include both endpoints and dashboard uses the business month',async({browser,baseURL})=>{
 const ctx=await browser.newContext({timezoneId:'America/Los_Angeles'}),page=await ctx.newPage();
 try{
  await page.clock.setFixedTime(new Date('2026-09-30T19:00:00Z'));await page.goto(baseURL);await page.waitForFunction(()=>window.XLAppReady);
  const data=shop(4);for(const [i,date]of ['2026-09-30','2026-10-01','2026-10-31','2026-11-01'].entries())data.invoices[i].date=date;
  data.purchases=data.invoices.map((invoice,i)=>({id:'synthetic-purchase-'+i,billNo:'P-'+i,date:invoice.date,total:100,paid:0,balance:100,items:[],payments:[],partyName:'Synthetic Supplier'}));
  data.retail=[];
  await page.evaluate(data=>{localStorage.clear();for(const[k,v]of Object.entries(data))localStorage.setItem('shop4_'+k,JSON.stringify(v));},data);await page.reload();await page.waitForFunction(()=>window.XLAppReady);
  await expect(page.locator('#dash-body .sc').filter({has:page.locator('.sc-lbl', {hasText:'This Month Sale'})}).locator('.sc-val')).toHaveText('₹200.00');
  await page.evaluate(()=>nav('purchase-list'));await expect(page.locator('#purchase-table tbody tr')).toHaveCount(2);await expect(page.locator('#purchase-table')).toContainText('01/10/2026');await expect(page.locator('#purchase-table')).toContainText('31/10/2026');
  await page.evaluate(()=>nav('sales-list'));await expect(page.locator('#sl-from')).toHaveValue('');await page.locator('#sl-from').fill('2026-10-01');await page.locator('#sl-to').fill('2026-10-31');await page.evaluate(()=>renderSalesList());await expect(page.locator('#sales-table tbody tr')).toHaveCount(2);await expect(page.locator('#sales-table')).toContainText('01/10/2026');await expect(page.locator('#sales-table')).toContainText('31/10/2026');
 }finally{await ctx.close();}
});
test('IST aging, payment defaults and UTC event timestamps preserve stored history',async({browser,baseURL})=>{
 const ctx=await browser.newContext({timezoneId:'America/Los_Angeles'}),page=await ctx.newPage(),instant='2026-09-30T19:00:00.000Z';
 try{
  await page.clock.setFixedTime(new Date(instant));await page.goto(baseURL);await page.waitForFunction(()=>window.XLAppReady);
  const freshFY=await page.evaluate(()=>getSettings().fy),data=shop(2);
  data.invoices[0].date='2026-08-31';data.invoices[1].date='2026-09-01';
  data.parties[0].createdAt='2020-01-01';data.audit=[{id:'synthetic-timed-audit',type:'create',entityType:'invoice',entityId:'s0',label:'Synthetic timestamp',details:'',ts:instant,user:'Owner'}];
  await page.evaluate(data=>{localStorage.clear();for(const[k,v]of Object.entries(data))localStorage.setItem('shop4_'+k,JSON.stringify(v));},data);await page.reload();await page.waitForFunction(()=>window.XLAppReady);
  await page.evaluate(()=>{nav('reports');repTab('outstanding');});
  const oldRow=page.locator('#rep-content tbody tr').filter({has:page.locator('td',{hasText:'INV-1001'})});await expect(oldRow.locator('td').nth(5)).toHaveText('31');
  await expect(page.locator('#rep-content .sc').filter({has:page.locator('.sc-lbl',{hasText:'31–60 Days'})}).locator('.sc-val')).toHaveText('₹80.00');
  expect(freshFY).toBe('2026-27');
  await page.evaluate(()=>openPurPayModal('u1'));await expect(page.locator('#pur-pay-date')).toHaveValue('2026-10-01');await page.evaluate(()=>closeModal('pur-pay-modal'));
  await page.evaluate(()=>openSettlementModal('p1','Synthetic Customer'));await expect(page.locator('#settle-date')).toHaveValue('2026-10-01');await page.evaluate(()=>closeModal('settlement-modal'));
  await page.evaluate(()=>openPayOutModal());await expect(page.locator('#pout-date')).toHaveValue('2026-10-01');await page.evaluate(()=>closeModal('pay-out-modal'));
  await page.evaluate(()=>nav('prev-bills'));expect(await page.evaluate(()=>pbRows.map(r=>r.date))).toEqual(['2026-10-01','2026-10-01','2026-10-01','2026-10-01','2026-10-01']);
  await page.evaluate(()=>nav('pur-bulk'));expect(await page.evaluate(()=>XLDomainState.purchaseBulk.capture().map(r=>r.date))).toEqual(['2026-10-01','2026-10-01','2026-10-01','2026-10-01','2026-10-01']);
  await page.evaluate(()=>nav('audit-log'));await expect(page.locator('#page-audit-log tbody tr').first().locator('td').first()).toContainText('01/10');
  const historicalBefore=await page.evaluate(()=>localStorage.getItem('shop4_invoices'));
  await page.evaluate(async()=>{nav('new-sale');await quickAddParty('inv-party','inv-party-id','ac-inv-party','Synthetic timestamp customer');});
  await page.locator('#qp-area').fill('Synthetic area');await page.locator('#quick-party-modal button').filter({hasText:'Save Party'}).click();await expect(page.locator('#quick-party-modal')).not.toBeVisible();
  const parties=await page.evaluate(()=>getParties());expect(parties.find(p=>p.id==='p1').createdAt).toBe('2020-01-01');expect(parties.at(-1).createdAt).toBe(instant);expect(await page.evaluate(()=>localStorage.getItem('shop4_invoices'))).toBe(historicalBefore);
 }finally{await ctx.close();}
});
