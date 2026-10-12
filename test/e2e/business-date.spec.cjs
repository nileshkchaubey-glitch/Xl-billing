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
   await expect(page.locator('#pl-from')).toHaveValue(boundary.first);await expect(page.locator('#pl-to')).toHaveValue(boundary.last);
   await page.locator('.nl[data-pg="new-sale"]').click();await expect(page.locator('#inv-date')).toHaveValue(boundary.date);
   // The real Save button owns the operation; synthetic line entry replaces only item typing.
   await page.locator('#inv-party').fill('Synthetic Customer');
   await page.evaluate(()=>{document.getElementById('inv-party-id').value='p1';saleItems=[{id:'synthetic-date-row',name:'Paper Cups',itemId:'i1',qty:5,rate:20,amt:100,unit:'Pcs',packCount:'',packType:''}];renderSaleItems();});
   await page.locator('#save-inv-btn').click();await expect(page.locator('#toast')).toContainText('saved');
   const stored=await page.evaluate(()=>({invoice:getInvoices().at(-1),settings:getSettings(),audit:DB.get('audit')}));
   expect(stored.invoice.date).toBe(boundary.date);expect(stored.invoice.invoiceNo).toBe('INV-1001');expect(stored.settings.invNo).toBe(1002);expect(stored.settings.fy).toBe('2026-27');
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
