// Firebase performs actual token authentication. Tests mock that remote service;
// these tokens intentionally do not carry a valid production signature.
let tokenSequence = 0;
export const identityEnv = (owner = 'owner') => ({ FIREBASE_API_KEY: 'fixture-key', FIREBASE_PROJECT_ID: 'billing-test', BILLING_OWNER_UID: owner });
export function testToken(claims = {}, owner = 'owner') {
  const now = Math.floor(Date.now() / 1000);
  const encode = object => Buffer.from(JSON.stringify(object)).toString('base64url');
  return `${encode({ alg: 'RS256', kid: 'test-key' })}.${encode({ aud: 'billing-test', iss: 'https://securetoken.google.com/billing-test', sub: owner, iat: now - 1, auth_time: now - 5, exp: now + 3600, firebase: { sign_in_provider: 'password' }, ...claims })}.fixture-${++tokenSequence}`;
}
export function mockIdentity(t, owner = 'owner') {
  t.mock.method(globalThis, 'fetch', async url => {
    if (!String(url).startsWith('https://identitytoolkit.googleapis.com/v1/accounts:lookup?')) throw new Error('Unexpected authentication endpoint');
    return Response.json({ users: [{ localId: owner, email: 'owner@example.test', validSince: '0', disabled: false }] });
  });
}
