'use strict';
const {test,expect}=require('@playwright/test'),{shop}=require('../fixtures/shop.cjs'),crypto=require('node:crypto');
// Real file inputs, isolated browser contexts and synthetic records only.
async function ready(page){await page.waitForFunction(()=>window.XLAppReady===true);}
async function raw(page){return page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('shop4_')||k.startsWith('v8_')).sort().map(k=>[k,localStorage.getItem(k)])));}
async function seed(page){
 const data=shop(2);data.settings.deletePinSalt='synthetic-csv';data.settings.deletePinHash=crypto.createHash('sha256').update('synthetic-csv:2468').digest('hex');
 await page.goto('/');await ready(page);
 await page.evaluate(data=>{localStorage.clear();for(const[k,v]of Object.entries(data))localStorage.setItem('shop4_'+k,JSON.stringify(v));localStorage.setItem('shop4_future','opaque synthetic CSV fixture');},data);
 await page.reload();await ready(page);
}
async function upload(page,screen,text){
 await page.locator(`a.nl[data-pg="${screen==='previous'?'prev-bills':'excel-connect'}"]`).click();
 if(screen==='previous')await page.locator('#pb-tab-csv').click();
 const input=screen==='previous'?'#pb-mode-csv input[type="file"]':'#xl-file-input';
 await page.locator(input).setInputFiles({name:'synthetic-only.csv',mimeType:'text/csv',buffer:Buffer.from(text)});
}
test.beforeEach(async({page})=>{await page.route('**/*',route=>{const u=new URL(route.request().url());return u.hostname==='127.0.0.1'?route.continue():route.abort();});await seed(page);});
const invalid={
 'mixed valid then malformed paid':'invoiceNo,date,partyName,total,paid\nGOOD-ROW,2026-10-12,Synthetic Customer,100,20\nBAD-ROW,2026-10-12,Synthetic Customer,100,NaN',
 'sub-paise monetary value':'invoiceNo,date,partyName,total,paid\nBAD-ROW,2026-10-12,Synthetic Customer,100,0.001',
 'extra row cells':'invoiceNo,date,partyName,total,paid\nBAD-ROW,2026-10-12,Synthetic Customer,100,0,ignored',
 'unsupported historical column':'invoiceNo,date,partyName,total,paid,refund\nBAD-ROW,2026-10-12,Synthetic Customer,100,0,50',
 'missing declared relationship':'invoiceNo,date,partyId,partyName,total,paid\nBAD-ROW,2026-10-12,missing,Synthetic Customer,100,0',
 'duplicate within file':'invoiceNo,date,partyName,total,paid\nDUPLICATE,2026-10-12,Synthetic Customer,100,0\nDUPLICATE,2026-10-12,Synthetic Customer,100,0'
};
for(const screen of ['previous','excel'])for(const[name,text]of Object.entries(invalid))test(`CSV ${screen}: ${name} leaves all business bytes unchanged`,async({page})=>{
 const before=await raw(page);await upload(page,screen,text);
 await expect.poll(()=>page.evaluate(()=>!!document.getElementById('storage-error')||/imported successfully/.test((document.getElementById('csv-import-result')?.textContent||'')+(document.getElementById('xl-import-result')?.textContent||'')))).toBe(true);
 expect(await raw(page)).toEqual(before);
 await expect(page.locator('#storage-error')).toBeVisible();await expect(page.locator('#storage-error')).toContainText(/CSV rejected|duplicate/i);
 await expect(page.locator('#toast')).not.toContainText(/imported|success/i);
});
for(const screen of ['previous','excel'])test(`CSV ${screen}: legacy summaries retain opening receipt without fabricated events`,async({page})=>{
 const before=await raw(page);
 await upload(page,screen,'invoiceNo,date,partyName,subtotal,discount,taxAmt,total,paid,balance,notes\r\nLEGACY-SUMMARY,2026-10-12,Synthetic Customer,100,10,0,90,20,70,"Synthetic \'quote\', comma\r\nand multiline"');
 const result=screen==='previous'?'#csv-import-result':'#xl-import-result';await expect(page.locator(result)).toContainText(/summary records only/);
 const record=await page.evaluate(()=>getInvoices().find(r=>r.invoiceNo==='LEGACY-SUMMARY'));
 expect(record).toMatchObject({subtotal:100,discount:10,total:90,paid:20,openingPaid:20,payments:[],partyId:'',balance:70});
 expect(record.notes).toBe("Synthetic 'quote', comma\r\nand multiline");
 const after=await raw(page);for(const key of Object.keys(before).filter(k=>k!=='shop4_invoices'))expect(after[key]).toBe(before[key]);
});
test('CSV real export and upload preserve invoice histories, IDs and unknown fields exactly',async({page})=>{
 await page.evaluate(()=>XLStore.run('Synthetic CSV history fixture',()=>{const records=getInvoices();Object.assign(records[0],{discount:10,total:90,balance:70,unknownCSV:{preserve:'exact'}});DB.set('invoices',records);}));
 const original=await page.evaluate(()=>getInvoices());
 await page.locator('a.nl[data-pg="excel-connect"]').click();
 const waiting=page.waitForEvent('download');await page.locator('button[onclick="exportToCSV(\'invoices\')"]').click();
 const download=await waiting,stream=await download.createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);const text=Buffer.concat(chunks).toString('utf8');
 expect(text).toContain('recordJSON');expect(text).toContain('XL-CSV-1:invoices');
 await page.evaluate(()=>XLStore.run('Synthetic empty CSV destination',()=>DB.set('invoices',[])));
 await upload(page,'excel',text);await expect(page.locator('#xl-import-result')).toContainText('2 invoices imported');
 expect(await page.evaluate(()=>getInvoices())).toEqual(original);
});
test('CSV own text literals retain actual apostrophes and every formula prefix on reimport',async({page})=>{
 const names=["'=real-apostrophe", "''literal",'=1+1','+1','-1','@SUM(1)','  =spaces','\t=tab','Synthetic "quote", CR\r\nLF'];
 await page.evaluate(names=>XLStore.run('Synthetic literal export source',()=>DB.set('items',names.map((name,i)=>({id:'literal'+i,name,unit:'Pcs',saleRate:1,purchaseRate:0,gst:0})))),names);
 const original=await page.evaluate(()=>getItems()),text=await page.evaluate(()=>xlCSVService().export('items',getItems()));
 const rows=await page.evaluate(text=>xlCSVService().parse(text),text);for(const row of rows.slice(1))expect(row[0].startsWith("'")).toBe(true);
 await page.evaluate(()=>XLStore.run('Synthetic empty literal destination',()=>DB.set('items',[])));
 await upload(page,'excel',text);await expect(page.locator('#xl-import-result')).toContainText('9 items imported');expect(await page.evaluate(()=>getItems())).toEqual(original);
});
test('CSV dual representation tampering rejects the entire file through real upload',async({page})=>{
 const before=await raw(page),text=await page.evaluate(()=>{const csv=xlCSVService(),rows=csv.parse(csv.export('invoices',getInvoices()));rows[1][rows[0].indexOf('subtotal')]='99';return csv.stringify(rows);});
 await upload(page,'excel',text);await expect(page.locator('#storage-error')).toContainText(/Readable columns differ/);expect(await raw(page)).toEqual(before);
});
