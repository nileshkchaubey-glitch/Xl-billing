const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
fs.mkdirSync('test-results',{recursive:true});const file=path.resolve('test-results/baseline.html');fs.writeFileSync(file,cp.execFileSync('git',['show','baseline-2026-10-09:index.html'],{maxBuffer:2e6}));
const r=cp.spawnSync('npx',['playwright','test','--project=chromium'],{encoding:'utf8',env:{...process.env,XL_HTML:file,XL_REPORT:'test-results/baseline.json'}});fs.writeFileSync('test-results/baseline.log',r.stdout+r.stderr);console.log(r.stdout+r.stderr);process.exitCode=r.status;
