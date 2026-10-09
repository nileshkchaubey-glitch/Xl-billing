import { BillingError, readWorkspace, readRevision, commitWorkspace } from './d1.js';
import { googleConfigured, googleExport } from './google.js';
const jsonResponse = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
async function readInput(request) {
  const limit = 21 * 1024 * 1024;
  if (Number(request.headers.get('Content-Length')) > limit) throw new BillingError('The save exceeds the size limit.', 413);
  const reader = request.body?.getReader(), chunks = []; let size = 0;
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > limit) { await reader.cancel(); throw new BillingError('The save exceeds the size limit.', 413); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
  }
  const body = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  let input; try { input = JSON.parse(new TextDecoder().decode(body)); } catch { throw new BillingError('Invalid JSON request.'); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BillingError('Send a billing object.');
  return input;
}
export async function billingApi(request, env) {
  const url = new URL(request.url), path = url.pathname;
  try {
    if (!env.DB) throw new BillingError('Cloud database is not configured.', 503, 'DATABASE_SETUP');
    // This handler is deployed behind the owner-private Sites dispatch boundary.
    // Identity headers are supplied by dispatch, never by frontend form inputs.
    const owner = request.headers.get('oai-authenticated-user-id');
    if (path === '/api/billing/health' && request.method === 'GET') {
      const rows = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('billing_workspaces','billing_records','billing_operations')").all();
      return jsonResponse({ storage: 'd1', schemaReady: rows.results.length === 3, photosReady: Boolean(env.BUCKET) });
    }
    if (path === '/api/billing/session' && request.method === 'GET') return jsonResponse({ storage: 'd1', authenticated: Boolean(owner), user: owner ? { id: owner, email: request.headers.get('oai-authenticated-user-email') || '' } : null, googleConfigured: googleConfigured(env) });
    if (!owner) throw new BillingError('Sign in with ChatGPT to access billing data.', 401, 'AUTH_REQUIRED');
    if (path === '/api/billing/workspace' && request.method === 'GET') return jsonResponse(await readWorkspace(env, owner));
    if (path === '/api/billing/revision' && request.method === 'GET') return jsonResponse({ revision: await readRevision(env, owner) });
    if (request.method !== 'POST' || !['/api/billing/commit', '/api/billing/google'].includes(path)) throw new BillingError('Unknown billing route.', 404, 'NOT_FOUND');
    if (request.headers.get('Origin') !== url.origin) throw new BillingError('Cross-origin changes are not allowed.', 403, 'ORIGIN_REQUIRED');
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new BillingError('Send JSON billing data.', 415, '22023');
    const input = await readInput(request);
    if (path === '/api/billing/commit') return jsonResponse(await commitWorkspace(env, owner, input));
    if (!googleConfigured(env) || env.GOOGLE_OWNER_ID !== owner) throw new BillingError('This Google connection is not configured for this billing owner.', 403, 'GOOGLE_SETUP');
    const workspace = await readWorkspace(env, owner); if (!workspace) throw new BillingError('Connect the cloud workspace first.');
    return jsonResponse(await googleExport(env, workspace.data, workspace.revision, input.action));
  } catch (error) {
    return jsonResponse({ message: error instanceof BillingError ? error.message : 'Cloud request failed. Keep your backup and retry.', code: error instanceof BillingError ? error.code : 'DATABASE_ERROR' }, error instanceof BillingError ? error.status : 503);
  }
}
