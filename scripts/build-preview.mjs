// A standalone visual review using production renderers and sample-only state.
// It never boots main.js, BrowserCache, CloudClient or BillingStore.
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { blankState, applyCommand, today } from '../src/domain.js';
const root = new URL('../', import.meta.url);
let state = blankState(); state.settings.shopName = 'XL Billing · Demo';
state.parties = [{ id:'demo-customer',name:'Demo Customer',type:'customer',openingBal:0,phone:'' },{ id:'demo-supplier',name:'Demo Supplier',type:'supplier',openingBal:0,phone:'' }];
state.items = [{ id:'demo-cups',name:'Demo Paper Cups',unit:'Pcs',saleRate:8,purchaseRate:6,colour:'Demo brand' }];
state = applyCommand(state, { id:'sample-sale',at:new Date().toISOString(),type:'save-document',collection:'invoices',payload:{date:today(),partyId:'demo-customer',partyName:'Demo Customer',items:[{id:'sample-line',itemId:'demo-cups',name:'Demo Paper Cups',unit:'Pcs',colour:'Demo brand',qty:100,rate:8}],initialPaid:200,discount:0,taxPct:0,dispatchStatus:'pending'} });
let html = await readFile(new URL('index.html',root),'utf8');
const css = await readFile(new URL('styles/app.css',root),'utf8');
html = html.replace(/<link rel="stylesheet"[^>]+>/,'<style>'+css+'</style>').replace(/<link rel="manifest"[^>]+>/,'').replace(/<script type="module"[^>]+><\/script>/,'');
const files=['src/domain.js','src/ui.js','src/navigation.js','src/features/invoice.js','src/features/lists.js','src/features/dialogs.js','src/features/settings.js'];
const modules=[]; for(const file of files) modules.push((await readFile(new URL(file,root),'utf8')).replace(/^import[^\n]+\n/gm,'').replace(/^export /gm,''));
const controller = `
let demoState = ${JSON.stringify(state).replace(/</g,'\\u003c')};
let demoPage = 'new-sale', demoFilter = {}, demoEditor;
const demoCloud = { configured:true,connected:false,available:true,googleConfigured:false };
function freshEditor(kind, record) {
  const party = demoState.parties.find(p=>p.id===(kind==='invoices'?'demo-customer':'demo-supplier'));
  return { kind, draft:record ? {...clone(record),expectedVersion:record.version,initialPaid:0} : {date:today(),due:'',partyId:party.id,partyName:party.name,invoiceNo:'',billNo:'',dispatchStatus:'pending',isManual:false,items:[{...newLine(),itemId:'demo-cups',name:'Demo Paper Cups',unit:'Pcs',colour:'Demo brand',qty:100,rate:kind==='invoices'?8:6}],discount:0,taxPct:0,initialPaid:0,paymentType:'Cash',notes:'',customFieldValues:{}} };
}
function demoRender() {
  const view=document.getElementById('view');
  view.innerHTML = demoEditor ? renderEditor(demoEditor,demoState) : demoPage==='dashboard'?renderDashboard(demoState):demoPage==='sales'||demoPage==='purchases'?renderDocuments(demoState,demoPage==='sales'?'invoices':'purchases',demoFilter):demoPage==='parties'||demoPage==='items'?renderMasters(demoState,demoPage,demoFilter):demoPage==='data'?renderData({data:demoState,envelope:{revision:1}},demoCloud):demoPage==='settings'?renderSettings(demoState):demoPage==='reports'?renderReports(demoState,demoFilter):demoPage==='audit'?renderAudit(demoState,demoFilter):demoPage==='retail'?renderRetail(demoState,demoFilter):demoPage.startsWith('bulk-')?renderBulk(demoPage==='bulk-sales'?'invoices':'purchases',demoState):renderTransactions(demoState,demoFilter,demoPage==='payment-in'?'in':demoPage==='payment-out'?'out':'all');
  document.getElementById('desktop-navigation').innerHTML=navigation.map(([label,links])=>'<div class="nav-group"><small>'+label+'</small>'+links.map(([name,text])=>'<a href="#'+name+'" '+(name===demoPage?'aria-current="page"':'')+'>'+text+'</a>').join('')+'</div>').join('');
  document.getElementById('mobile-navigation').innerHTML=[['dashboard','Home'],['sales','Sales'],['parties','Parties'],['items','Items']].map(([name,text])=>'<a href="#'+name+'" '+(name===demoPage?'aria-current="page"':'')+'>'+text+'</a>').join('')+'<button type="button" data-action="toggle-menu">More</button>';
  document.getElementById('business-name').textContent=demoState.settings.shopName;
  document.getElementById('section-name').textContent=demoEditor?'Invoice preview':'Design preview';
  const banner=document.getElementById('status-banner'); banner.hidden=false; banner.textContent='DESIGN PREVIEW · Sample data only. Nothing is stored or sent. Do not enter real passwords or billing data.';
  if(demoEditor){updateEditorView(demoEditor,demoState);document.getElementById('draft-status').textContent='Preview only · not stored';}
}
function demoNavigate(page) { demoPage=page;demoFilter={};demoEditor=page==='new-sale'||page==='new-purchase'?freshEditor(page==='new-sale'?'invoices':'purchases'):null;document.getElementById('app-shell').classList.remove('menu-open');demoRender();window.scrollTo(0,0); }
document.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#"]');if(link){event.preventDefault();demoNavigate(link.getAttribute('href').slice(1));return;}
  const target=event.target.closest('[data-action]');if(!target)return;event.preventDefault();
  const action=target.dataset.action,kind=target.dataset.kind,id=target.dataset.id;
  if(action==='navigate')demoNavigate(target.dataset.page);
  else if(action==='toggle-menu')document.getElementById('app-shell').classList.toggle('menu-open');
  else if(action==='close-menu')document.getElementById('app-shell').classList.remove('menu-open');
  else if(action==='close-dialog')document.getElementById('dialog').close();
  else if(action==='add-line'){demoEditor.draft.items.push(newLine());demoRender();}
  else if(action==='reset-editor'){demoEditor=freshEditor(demoEditor.kind);demoRender();}
  else if(action==='remove-line'){demoEditor.draft.items=demoEditor.draft.items.filter(line=>line.id!==target.dataset.line);demoRender();}
  else if(action==='move-line'){const items=demoEditor.draft.items,index=items.findIndex(line=>line.id===target.dataset.line),next=index+Number(target.dataset.step);if(next>=0&&next<items.length){[items[index],items[next]]=[items[next],items[index]];demoRender();}}
  else if(action==='price-history')openDialog('Last item prices',renderPriceHistory(demoState,demoEditor,target.dataset.line));
  else if(action==='use-price'){demoEditor.draft.items.find(line=>line.id===target.dataset.line).rate=Number(target.dataset.rate);document.getElementById('dialog').close();demoRender();}
  else if(action==='party-ledger')openDialog('Demo party ledger',partyLedger(demoState,id),true);
  else if(action==='view-document')openDialog('Demo bill details',documentDetail(demoState,kind,id),true);
  else if(action==='edit-document'){demoEditor=freshEditor(kind,demoState[kind].find(row=>row.id===id));demoPage=kind==='invoices'?'new-sale':'new-purchase';document.getElementById('dialog').close();demoRender();}
  else if(action==='page-list'){demoFilter.page=Math.max(1,(demoFilter.page||1)+Number(target.dataset.step));demoRender();}
  else if(action==='clear-filter'){demoFilter={};demoRender();}
  else toast('Design preview only. This action uses no real data or cloud service.');
});
document.addEventListener('input',event=>{
  const target=event.target;if(!demoEditor||!target.name||target.type==='file')return;
  const row=target.closest('[data-line-id]');
  if(row){const line=demoEditor.draft.items.find(line=>line.id===row.dataset.lineId);line[target.name]=['qty','rate'].includes(target.name)?Number(target.value):target.value;}
  else if(target.name==='partyName')Object.assign(demoEditor.draft,resolveParty(demoState,target.value));
  else if(target.name==='isManual')demoEditor.draft.isManual=target.value==='Amount only';
  else demoEditor.draft[target.name]=target.value;
  updateEditorView(demoEditor,demoState);
});
document.addEventListener('change',event=>{
  if(event.target.dataset.filter){demoFilter[event.target.dataset.filter]=event.target.value;demoRender();}
  if(demoEditor&&event.target.name==='isManual')demoRender();
});
document.addEventListener('submit',event=>{
  event.preventDefault();
  if(event.target.id==='invoice-form'){
    try{const kind=demoEditor.kind;demoState=applyCommand(demoState,{id:uid(),at:new Date().toISOString(),type:'save-document',collection:kind,payload:clone(demoEditor.draft)});demoNavigate(kind==='invoices'?'sales':'purchases');toast('Sample bill added to this preview only. Nothing is stored.');}catch(error){toast(error.message,true);}
  }else{if(event.target.elements.password)event.target.elements.password.value='';toast('Preview only. No information was sent or saved.');}
});
demoEditor=freshEditor('invoices');demoRender();
`;
const script = modules.join('\n')+'\n'+controller;
const check = spawnSync(process.execPath,['--input-type=module','--check'],{input:script,encoding:'utf8'});
if(check.status!==0)throw new Error(check.stderr || 'Preview script could not be parsed.');
html=html.replace('</body>','<script type="module">'+script+'</script></body>');
await writeFile(new URL('docs/ui-preview.html',root),html);
console.log('Built standalone sample-only UI preview from production renderers and styles.');
