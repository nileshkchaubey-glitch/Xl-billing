// Exercise the exact deployment artifact without creating live test records.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LocalD1, LocalBucket } from '../tests/d1-helper.js';
import { fixture, command } from '../tests/helpers.js';
import { identityEnv, testToken } from '../tests/auth-helper.js';
const source = await readFile(new URL('../dist/server/index.js', import.meta.url), 'utf8');
const { default: worker } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const env = { DB: new LocalD1(), BUCKET: new LocalBucket(), ...identityEnv('review-owner') }, origin = 'https://billing.example';
const call = (path, options = {}) => worker.fetch(new Request(origin + path, options), env);
const headers = { Origin: origin, 'Content-Type': 'application/json', Authorization: 'Bearer ' + testToken({}, 'review-owner') };
const originalFetch = globalThis.fetch;
globalThis.fetch = async url => {
  assert.match(String(url), /^https:\/\/identitytoolkit\.googleapis\.com\/v1\/accounts:lookup\?/);
  return Response.json({ users: [{ localId:'review-owner',email:'review@example.test' }] });
};
try {
  const html = await call('/'); assert.equal(html.status, 200);
  const shell = await html.text();
  const main = await call('/src/main.js'); assert.equal(main.status, 200); assert.match(main.headers.get('Content-Type'), /javascript/);
  for (const match of shell.matchAll(/(?:src|href)="(\.?\/?(?:src|styles)\/[^"?]+)"/g)) assert.equal((await call('/' + match[1].replace(/^\.\//, ''))).status, 200);
  assert.equal((await call('/backend/d1.js')).status, 404);
  assert.equal((await call('/api/billing/workspace')).status, 401);
  assert.deepEqual(await (await call('/api/billing/health')).json(), { storage: 'd1', schemaReady: true, photosReady: true });
  const initial = await call('/api/billing/commit', { method: 'POST', headers, body: JSON.stringify({ data: fixture(), expectedRevision: 0, operationId: 'initialize' }) });
  assert.equal(initial.status, 200); assert.equal((await initial.json()).revision, 1);
  const operation = command('save-document', { date: '2026-10-09', partyId: 'customer', partyName: 'Asha', isManual: true, total: 100, initialPaid: 20, photoData: 'data:image/png;base64,aGVsbG8=' }, { collection: 'purchases' });
  const options = { method: 'POST', headers, body: JSON.stringify({ expectedRevision: 1, operationId: operation.id, command: operation }) };
  const saved = await call('/api/billing/commit', options); assert.equal(saved.status, 200);
  const state = await saved.json(); assert.equal(state.revision, 2); assert.equal(state.data.purchases[0].balance, 80);
  assert.deepEqual(await (await call('/api/billing/commit', options)).json(), state);
  assert.deepEqual(await (await call('/api/billing/workspace', { headers })).json(), state);
  assert.equal(env.BUCKET.files.size, 1);
  console.log('Built Worker verified: asset routes, auth boundary, SQLite commit, private photos and safe retry.');
} finally { env.DB.close(); globalThis.fetch = originalFetch; }
