const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path');const html=fs.readFileSync('index.html','utf8');
const cases=[
 ['B1','P0-1 invoice',s=>s.replace("overlay.addEventListener('input',refresh);","input.setAttribute('oninput','v15CheckPin(this,');")],
 ['B2','P0-2',s=>s.replace('function isCancelled(record)','function hiddenIsCancelled(record)')],
 ['B3','P0-3 pagination reaches',s=>s.replace('function listPager(key,render) {','function listPager(key,render) { return "";')],
 ['B4','P0-4 overpayment rejected',s=>s.replace("  if(!allowPayment(inv,amt,discount,'pay-amount'))return;",'')],
 ['B5','P0-5 batches',s=>s.replace('invoiceNo: numbers[i]',"invoiceNo: r.billNo || `PB-${pName.slice(0,3).toUpperCase()}-${i+1}`")]
];
let killed=0;for(const[id,grep,change]of cases){const mutated=change(html);if(mutated===html)throw Error('Mutation did not apply: '+id);const file=path.resolve('test-results/mutation-'+id+'.html');fs.writeFileSync(file,mutated);const r=cp.spawnSync('npx',['playwright','test','--project=chromium','--grep',grep],{encoding:'utf8',env:{...process.env,XL_HTML:file,XL_REPORT:'test-results/mutation-'+id+'.json'}});fs.writeFileSync('test-results/mutation-'+id+'.log',r.stdout+r.stderr);const report=JSON.parse(fs.readFileSync('test-results/mutation-'+id+'.json'));const caught=r.status!==0&&report.stats.unexpected>0;console.log(`${id}: ${caught?'CAUGHT':'NOT CAUGHT'}; ${report.stats.unexpected} failing test(s)`);if(caught)killed++;fs.unlinkSync(file);}
console.log(`${killed}/5 mutations caught`);process.exitCode=killed===5?0:1;
