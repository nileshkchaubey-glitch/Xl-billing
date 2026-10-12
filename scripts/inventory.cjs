const fs=require('node:fs'),cp=require('node:child_process'),acorn=require('acorn'),walk=require('acorn-walk');
const html=cp.execFileSync('git',['show','29aeb20:index.html'],{maxBuffer:2e6}).toString();
const blocks=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
const defs=new Map(), rows=[], errors=[];
for(const [i,m] of blocks.entries()){
 const line=html.slice(0,m.index).split('\n').length;
 rows.push(`| ${i+1} | ${line} | ${m[1].trim().split('\n').find(x=>x.trim())?.replaceAll('|','/').slice(0,100)} |`);
 try { const ast=acorn.parse(m[1],{ecmaVersion:'latest',locations:true}); walk.simple(ast,{
 FunctionDeclaration(n){if(n.id)add(n.id.name,line+n.loc.start.line-1,'declaration');},
 AssignmentExpression(n){if(n.left.type==='MemberExpression'&&n.left.object.name==='window'&&/Function|Arrow/.test(n.right.type))add(n.left.property.name||n.left.property.value,line+n.loc.start.line-1,'window assignment');}
 }); }catch(e){errors.push(`Block ${i+1}: ${e.message}`);}
}
function add(name,line,kind){if(!defs.has(name))defs.set(name,[]);defs.get(name).push({line,kind});}
const pages=[...html.matchAll(/id="(page-[^"]+)"/g)].map(m=>m[1]);
const modals=[...html.matchAll(/id="([^"]*modal)"/g)].map(m=>m[1]);
const handlers=[...html.matchAll(/\bon\w+="([^"\n]*)"/g)].map(m=>({line:html.slice(0,m.index).split('\n').length,body:m[1]}));
const keys=[...new Set([...html.matchAll(/(?:DB\.(?:get|set|del)|localStorage\.(?:getItem|setItem|removeItem))\(['"]([^'"]+)/g)].map(m=>m[1]))];
const out=`# Baseline architecture inventory\n\nGenerated from commit 29aeb20 using Acorn; every inline script is parsed. This is a syntactic inventory: closures and wrapper references still execute earlier definitions. The last assignment is the public entry point, not proof that earlier code is dead. Template examples in tutorial text may appear as handler candidates. Runtime crawl supplies additional evidence.\n\n## Script blocks\n\n| Block | HTML line | First source line |\n| --- | --- | --- |\n${rows.join('\n')}\n\n## Named functions and overrides\n\n| Function | Last syntactic definition | Earlier definitions (still called by wrappers where applicable) |\n| --- | --- | --- |\n${[...defs].sort().map(([k,v])=>`| ${k} | ${v.at(-1).line} (${v.at(-1).kind}) | ${v.slice(0,-1).map(x=>x.line).join(', ')||'—'} |`).join('\n')}\n\n## Storage keys\n\nDB prefixes keys with shop4_. Literal keys: ${keys.join(', ')}. Dynamic keys/custom fields also need runtime review.\n\n## Pages\n\n${pages.join(', ')}\n\n## Modals (including generated templates)\n\n${[...new Set(modals)].join(', ')}\n\n## Inline handler candidates\n\n| HTML line | Handler | Named function found syntactically |\n| --- | --- | --- |\n${handlers.map(x=>{const n=x.body.match(/^([\w$]+)\(/)?.[1];return `| ${x.line} | ${x.body.replaceAll('|','/').replaceAll('`','').slice(0,200)} | ${n?(defs.has(n)?'yes':'needs runtime check'):'DOM expression / generated'} |`;}).join('\n')}\n\n## Parse errors\n\n${errors.join('\n')||'None'}\n`;
fs.mkdirSync('docs',{recursive:true});fs.writeFileSync('docs/ARCHITECTURE_BASELINE.md',out);
fs.writeFileSync('test/baseline-inventory.json',JSON.stringify({blocks:rows.length,functions:Object.fromEntries(defs),pages,modals,handlers,keys,errors},null,2));
console.log(`${blocks.length} script blocks; ${defs.size} named functions; ${handlers.length} inline handler candidates; ${errors.length} parse errors`);
