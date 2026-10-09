import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
const root = resolve(import.meta.dirname);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
http.createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname.split('/').some(part => part.startsWith('.'))) throw new Error('Forbidden');
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + sep) || !mime[extname(file)]) throw new Error('Forbidden');
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)] + '; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch { response.writeHead(404, { 'Content-Type': 'text/plain' }); response.end('Not found'); }
}).listen(Number(process.env.PORT || 4173), '0.0.0.0', () => process.stdout.write('XL Billing is available at http://localhost:4173\n'));
