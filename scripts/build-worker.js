// A small deterministic packager for this dependency-free app. Feature source
// remains modular; only the Worker deployment embeds the static asset strings.
import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
async function list(directory) { const output=[]; for(const entry of await readdir(resolve(root,directory),{withFileTypes:true})) { const path=directory+'/'+entry.name; if(entry.isDirectory()) output.push(...await list(path)); else output.push(path); } return output; }
const paths=['index.html','config.json','manifest.webmanifest','sw.js',...await list('src'),...await list('styles')];
const assets={}; for(const path of paths) assets['/'+path]=await readFile(resolve(root,path),'utf8');
const modules=['src/domain.js','backend/d1.js','backend/auth.js','backend/projections.js','backend/google.js','backend/worker.js'];
const server=[];
for(const file of modules) server.push((await readFile(resolve(root,file),'utf8')).replace(/^import[^\n]+\n/gm,'').replace(/^export /gm,''));
const worker=server.join('\n')+'\nconst PUBLIC_ASSETS = '+JSON.stringify(assets)+';\n'+`
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/billing/')) return billingApi(request, env);
    if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed', { status:405 });
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    if (!Object.hasOwn(PUBLIC_ASSETS,path)) return new Response('Not found',{status:404});
    const extension=path.slice(path.lastIndexOf('.'));
    const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json'}[extension] || 'text/plain';
    return new Response(request.method==='HEAD' ? null : PUBLIC_ASSETS[path], { headers:{'Content-Type':type+';charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'} });
  }
};
`;
await mkdir(resolve(root,'worker'),{recursive:true}); await writeFile(resolve(root,'worker/index.js'),worker);
await rm(resolve(root,'dist'),{recursive:true,force:true});
await mkdir(resolve(root,'dist/server'),{recursive:true});
await writeFile(resolve(root,'dist/server/index.js'),worker);
await cp(resolve(root,'drizzle'),resolve(root,'dist/drizzle'),{recursive:true});
process.stdout.write('Built dependency-free Worker with modular source, D1 migrations and private photo storage.\n');
