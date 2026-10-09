import { BillingError } from './d1.js';
const identityCache = new Map();
export const authenticationConfigured = env => Boolean(env.FIREBASE_API_KEY && env.FIREBASE_PROJECT_ID && env.BILLING_OWNER_UID);
const invalidIdentity = () => new BillingError('Sign in with your billing email and password.', 401, 'AUTH_REQUIRED');
export async function billingIdentity(request, env) {
  const authorization = request.headers.get('Authorization');
  if (!authorization) return null;
  if (!authenticationConfigured(env)) throw new BillingError('Billing login has not been configured by the owner.', 503, 'AUTH_SETUP');
  if (!authorization.startsWith('Bearer ')) throw invalidIdentity();
  const token = authorization.slice(7), parts = token.split('.'), now = Math.floor(Date.now() / 1000);
  let header, claims;
  try {
    if (token.length > 8192 || parts.length !== 3 || !parts[2]) throw invalidIdentity();
    const decode = part => JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    header = decode(parts[0]); claims = decode(parts[1]);
  } catch { throw invalidIdentity(); }
  // These checks reject invalid inputs early. They do NOT authenticate a token:
  // Google's account lookup below verifies it before we trust any user claims.
  if (header.alg !== 'RS256' || !header.kid || claims.aud !== env.FIREBASE_PROJECT_ID || claims.iss !== `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}` || typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 128 || !Number.isFinite(claims.exp) || claims.exp <= now || !Number.isFinite(claims.iat) || claims.iat > now || !Number.isFinite(claims.auth_time) || claims.auth_time > now || claims.firebase?.sign_in_provider !== 'password') throw invalidIdentity();
  if (claims.sub !== env.BILLING_OWNER_UID) throw new BillingError('This account does not have access to this business.', 403, 'OWNER_REQUIRED');
  const cacheKey = `${env.FIREBASE_PROJECT_ID}:${env.FIREBASE_API_KEY}:${token}`;
  const cached = identityCache.get(cacheKey);
  if (cached?.until > now) return cached.user;
  let response;
  try {
    response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_API_KEY)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }), signal: AbortSignal.timeout(10000) });
  } catch { throw new BillingError('Login verification is unavailable. Your saved data is preserved.', 503, 'AUTH_UNAVAILABLE'); }
  if (!response.ok) {
    if (response.status >= 500 || response.status === 429) throw new BillingError('Login verification is unavailable. Retry shortly.', 503, 'AUTH_UNAVAILABLE');
    throw invalidIdentity();
  }
  let account;
  try { account = (await response.json()).users?.[0]; } catch { throw invalidIdentity(); }
  if (!account || account.localId !== claims.sub || account.disabled || Number(account.validSince || 0) > claims.auth_time) throw invalidIdentity();
  const user = { id: account.localId, email: typeof account.email === 'string' ? account.email : '' };
  identityCache.set(cacheKey, { user, until: Math.min(now + 30, claims.exp) });
  if (identityCache.size > 64) identityCache.delete(identityCache.keys().next().value);
  return user;
}
