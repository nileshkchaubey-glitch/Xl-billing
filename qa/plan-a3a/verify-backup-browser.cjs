'use strict';
// A3a three-engine browser checks. All data/picker/files are synthetic.
// Native OS file permissions, Drive sync and durability are NOT tested here.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,firefox,webkit}=require('playwright');
const pageHtml=fs.readFileSync(path.resolve(__dirname,'../../verified-backup.html'));
const blank='<!doctype html><title>synthetic origin</title>';
const records={shop4_settings:JSON.stringify({shopName:'SYNTHETIC PRIVATE SHOP',jsonbinKey:'SYNTHETIC SECRET',prefix:'TEST-'}),
shop4_invoices:JSON.stringify([{id:'synthetic-1',total:10,paid:5,payments:[]}]),
shop4_parties:'[]',shop4_items:'[]',shop4_audit:'[]',shop4_app_version:'16'};
function serverTask(fn){
  return new Promise(async(resolve,reject)=>{
    const server=http.createServer((request,response)=>{
      const u=request.url;
      if(u==='/Xl-billing/verified-backup.html'){
        response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});response.end(pageHtml);
      }else if(u==='/Xl-billing/seed'){
        response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});response.end(blank);
      }else{response.writeHead(404);response.end('missing');}
    });
    try{
      await new Promise(r=>server.listen(0,'127.0.0.1',r));
      const url='http://127.0.0.1:'+server.address().port;
      try{await fn(url);resolve();}catch(e){reject(e);}
    }catch(e){reject(e);}finally{server.close();}
  });
}
async function scenario(engine,origin,mode){
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext({serviceWorkers:'block'});
  const requests=[],errors=[];
  const page=await context.newPage();
  await context.route('**/*',route=>{
    const url=route.request().url();
    if(url!==origin+'/Xl-billing/seed' && url!==origin+'/Xl-billing/verified-backup.html'){
      requests.push('unexpected-request');return route.abort('blockedbyclient');
    }
    route.continue();
  });
  page.on('pageerror',error=>errors.push(error.name));
  try {
    await page.goto(origin+'/Xl-billing/seed',{waitUntil:'load'});
    await page.evaluate(records=>{
      for(const [key,raw] of Object.entries(records))localStorage.setItem(key,raw);
    },records);
    await context.addInitScript(()=>{
      const files=new Map();
      window.__testFiles=files;
      window.__testMode='normal';
      const dir={async getFileHandle(name,opts){
        if(!files.has(name)){
          if(!opts?.create)throw new DOMException('Missing','NotFoundError');
          files.set(name,'');
        }
        return {
          async createWritable(){
            if(window.__testMode==='denyWrite')throw new DOMException('Denied','NotAllowedError');
            let tmp='';
            return {
              async write(v){tmp=String(v);},
              async close(){
                if(window.__testMode==='denyClose')throw new Error('Synthetic close failure');
                files.set(name,tmp);
              }
            };
          },
          async getFile(){
            return {async text(){return window.__testMode==='corrupt'?'{"corrupt":true}':files.get(name);}};
          }
        };
      }};
      Object.defineProperty(window,'showDirectoryPicker',{configurable:true,value:async()=>{
        if(window.__testMode==='cancel')throw new DOMException('Cancelled','AbortError');
        return dir;
      }});
    });
    await page.goto(origin+'/Xl-billing/verified-backup.html',{waitUntil:'load'});
    assert.equal(await page.title(),'XL Billing | Verified Private Backup');
    const snapshot=()=>page.evaluate(()=>{
      const out={};
      for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);out[key]=localStorage.getItem(key);}
      return out;
    });
    const before=await snapshot();
    if(mode!=='normal')await page.evaluate(mode=>window.__testMode=mode,mode);
    await page.locator('#folder-save').click();
    await page.waitForFunction(()=>!/Preparing and verifying|Choose a private folder/.test(document.getElementById('backup-status').textContent),null,{timeout:15000});
    const status=await page.locator('#backup-status').innerText();
    if(mode==='normal'){
      assert.match(status,/LOCAL FILE VERIFIED/);
      assert.match(status,/upload UNKNOWN/);
      const data=await page.evaluate(()=>({
        count:window.__testFiles.size,
        items:[...window.__testFiles.values()].map(x=>JSON.parse(x))
      }));
      assert.equal(data.count,1);
      assert.equal(data.items[0].format,'xl-billing-private');
      const store=Object.fromEntries(data.items[0].payload.records.map(row=>[row.key,row.value]));
      assert.equal(store.shop4_settings,records.shop4_settings);
      assert.equal(store.shop4_invoices,records.shop4_invoices);
      assert.equal(store.shop4_audit,records.shop4_audit);
      // A second click in the same mocked millisecond may produce another
      // unique random token. Neither operation may alter the existing file.
    }else{
      assert.doesNotMatch(status,/LOCAL FILE VERIFIED/);
    }
    assert.deepEqual(await snapshot(),before,'no billing/local storage mutation');
    assert.deepEqual(requests,[],'zero external network attempts');
    assert.deepEqual(errors,[],'zero page errors');
    assert.doesNotMatch(await page.locator('body').innerText(),/SYNTHETIC PRIVATE SHOP|SYNTHETIC SECRET/);
    console.log('PASS '+engine.name()+' '+mode+' synthetic local file verification; original storage unchanged');
  }finally{
    await context.close();await browser.close();
  }
}
(async()=>{await serverTask(async origin=>{
  for(const engine of [chromium,firefox,webkit]){
    for(const mode of ['normal','cancel','denyWrite','denyClose','corrupt'])await scenario(engine,origin,mode);
  }
});})().catch(e=>{console.error('FAIL A3a browser safety: '+(e.stack||e));process.exitCode=1;});
