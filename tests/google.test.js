import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './helpers.js';

test('Google integration enforces origin + owner auth, reads database snapshot and uses server-only tokens', async t => {
  const originalFetch = globalThis.fetch, originalDeno = globalThis.Deno;
  let handler;
  const variables = { APP_ORIGIN: 'https://billing.example', BILLING_OWNER_ID: 'owner', SUPABASE_URL: 'https://project.supabase.co', SUPABASE_ANON_KEY: 'anon', GOOGLE_CLIENT_ID: 'client', GOOGLE_CLIENT_SECRET: 'server-secret', GOOGLE_REFRESH_TOKEN: 'server-refresh', GOOGLE_DRIVE_FOLDER_ID: 'folder', GOOGLE_SHEET_ID: 'sheet' };
  globalThis.Deno = { env: { get: name => variables[name] }, serve: fn => { handler = fn; } };
  t.after(() => { globalThis.fetch = originalFetch; globalThis.Deno = originalDeno; });
  await import('../backend/functions/xl-billing-google/index.js');
  const call = (action, auth = 'Bearer user-jwt', origin = 'https://billing.example') => handler(new Request('https://project.supabase.co/functions/v1/xl-billing-google', { method: 'POST', headers: { Origin: origin, Authorization: auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) }));
  let calls = [], owner = 'someone-else';
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (String(url).endsWith('/auth/v1/user')) return Response.json({ id: owner });
    if (String(url).includes('/rest/v1/')) return Response.json([{ data: fixture(), revision: 7 }]);
    if (String(url).includes('oauth2.googleapis.com')) return Response.json({ access_token: 'google-server-token' });
    if (String(url).includes('/upload/drive/')) return new Response(null, { headers: { Location: 'https://www.googleapis.com/upload/session' } });
    if (String(url).endsWith('/upload/session')) return Response.json({ id: 'backup-file' });
    if (String(url).includes('?fields=sheets.properties')) return Response.json({ sheets: [] });
    if (String(url).endsWith(':batchUpdate')) return Response.json({ replies: [] });
    throw new Error('Unexpected endpoint');
  };
  assert.equal((await call('backup', 'Bearer user-jwt', 'https://evil.example')).status, 403); assert.equal(calls.length, 0);
  assert.equal((await call('backup', 'none')).status, 401); assert.equal(calls.length, 0);
  assert.equal((await call('backup')).status, 403); assert.equal(calls.length, 1);
  calls = []; owner = 'owner';
  const backup = await call('backup'); assert.equal(backup.status, 200); const reply = await backup.json();
  assert.equal(reply.id, 'backup-file'); assert.doesNotMatch(JSON.stringify(reply), /server-secret|server-refresh|google-server-token/);
  const upload = calls.find(call => String(call.url).endsWith('/upload/session'));
  const contents = JSON.parse(new TextDecoder().decode(upload.options.body)); assert.equal(contents.revision, 7); assert.ok(contents.data.audit);
  assert.equal(calls.find(call => String(call.url).includes('/rest/')).options.headers.Authorization, 'Bearer user-jwt');
  assert.equal((await call('sheets')).status, 200);
  assert.ok(calls.some(call => String(call.url).endsWith(':batchUpdate')));
});
