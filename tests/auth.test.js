import test from 'node:test';
import assert from 'node:assert/strict';
import { billingIdentity } from '../backend/auth.js';
import { identityEnv, testToken } from './auth-helper.js';
const request = token => new Request('https://billing.example/api/billing/session', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
test('identity requires a Firebase-verified owner; host identity headers are ignored', async t => {
  const env = identityEnv(), token = testToken(); let lookups = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => { lookups++; assert.match(String(url), /accounts:lookup/); assert.equal(JSON.parse(options.body).idToken, token); return Response.json({ users: [{ localId: 'owner', email: 'billing@example.test' }] }); });
  assert.equal(await billingIdentity(new Request('https://billing.example', { headers: { 'oai-authenticated-user-id': 'owner' } }), env), null);
  assert.deepEqual(await billingIdentity(request(token), env), { id: 'owner', email: 'billing@example.test' });
  await billingIdentity(request(token), env); assert.equal(lookups, 1);
});
test('invalid project, expiry, provider and owner are rejected before remote verification', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Must not reach Google'); });
  const env = identityEnv();
  for (const claims of [{ aud: 'another-project' }, { iss: 'https://evil.example' }, { exp: 1 }, { iat: 9999999999 }, { sub: 'other' }, { firebase: { sign_in_provider: 'anonymous' } }]) await assert.rejects(billingIdentity(request(testToken(claims)), env));
  await assert.rejects(billingIdentity(request('not-a-token'), env));
});
test('Google token rejection, disabled accounts and revoked credentials fail closed', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 400 }));
  await assert.rejects(billingIdentity(request(testToken()), identityEnv()), error => error.status === 401);
  for (const account of [{ localId: 'other' }, { localId: 'owner', disabled: true }, { localId: 'owner', validSince: String(Math.floor(Date.now() / 1000) + 10) }]) {
    mock.mock.mockImplementation(async () => Response.json({ users: [account] }));
    await assert.rejects(billingIdentity(request(testToken()), identityEnv()), error => error.status === 401);
  }
});
test('verification outage never admits a user or exposes provider errors', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('private provider detail'); });
  await assert.rejects(billingIdentity(request(testToken()), identityEnv()), error => error.status === 503 && !error.message.includes('private provider detail'));
});
