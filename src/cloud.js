export class CloudError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}
const TOKEN_KEY = 'xl_billing_login';
export class CloudClient {
  constructor(fetcher = globalThis.fetch, tokenStorage = globalThis.sessionStorage) {
    this.fetcher = fetcher; this.tokenStorage = tokenStorage; this.available = true;
    this.configured = false; this.session = null; this.googleConfigured = false; this.tokens = null;
    this.config = { apiBaseUrl: '', firebaseApiKey: '', firebaseProjectId: '' };
  }
  get connected() { return Boolean(this.session); }
  async discover() {
    const response = await this.fetcher('./config.json', { cache: 'no-store' });
    if (response.status === 404) { this.available = false; return; }
    if (!response.ok) throw new CloudError('Could not read the cloud configuration.', 'CONFIG_ERROR');
    const config = await response.json();
    if (!config || typeof config !== 'object') throw new CloudError('Cloud configuration is invalid.', 'CONFIG_ERROR');
    if (config.apiBaseUrl) {
      const url = new URL(config.apiBaseUrl);
      if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new CloudError('The billing API needs an HTTPS origin.', 'CONFIG_ERROR');
      config.apiBaseUrl = url.origin;
    }
    this.config = { ...this.config, ...config };
    this.configured = Boolean(this.config.firebaseApiKey && this.config.firebaseProjectId);
    if (!this.configured) { this.available = false; return; }
    try {
      const saved = JSON.parse(this.tokenStorage?.getItem(TOKEN_KEY) || 'null');
      if (saved?.project === this.config.firebaseProjectId && saved?.api === this.config.apiBaseUrl) this.tokens = saved;
    } catch { this.tokenStorage?.removeItem(TOKEN_KEY); }
    const data = await this.request('/api/billing/session');
    if (data.storage !== 'd1' || !data.configured) throw new CloudError('Cloud login needs to be configured by the owner.', 'CONFIG_ERROR');
    this.available = true; this.session = data.authenticated ? { user: data.user } : null; this.googleConfigured = Boolean(data.googleConfigured);
  }
  async authRequest(endpoint, options) {
    const response = await this.fetcher(endpoint + '?key=' + encodeURIComponent(this.config.firebaseApiKey), { cache: 'no-store', signal: AbortSignal.timeout(20000), ...options });
    const data = await response.json();
    if (!response.ok) throw new CloudError('Sign-in failed. Check your email/password or reset the password.', 'AUTH_FAILED');
    return data;
  }
  saveTokens(data) {
    if (!data.idToken || !data.refreshToken || !(Number(data.expiresIn) > 0)) throw new CloudError('The login response is incomplete.', 'AUTH_FAILED');
    this.tokens = { idToken: data.idToken, refreshToken: data.refreshToken, expiresAt: Date.now() + Number(data.expiresIn) * 1000, project: this.config.firebaseProjectId, api: this.config.apiBaseUrl };
    this.tokenStorage?.setItem(TOKEN_KEY, JSON.stringify(this.tokens));
  }
  async signIn(email, password) {
    if (!this.configured) throw new CloudError('Cloud login is not configured yet.', 'CONFIG_ERROR');
    const data = await this.authRequest('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
    this.saveTokens(data);
    try {
      const session = await this.request('/api/billing/session');
      if (!session.authenticated) throw new CloudError('This billing account could not be verified.', 'AUTH_FAILED');
      this.session = { user: session.user }; this.available = true; this.googleConfigured = Boolean(session.googleConfigured);
    } catch (error) { this.signOut(); throw error; }
  }
  signOut() { this.tokens = null; this.session = null; this.googleConfigured = false; this.tokenStorage?.removeItem(TOKEN_KEY); }
  async resetPassword(email) {
    if (!this.configured || !email) throw new CloudError('Enter your billing email first.', 'AUTH_FAILED');
    await this.authRequest('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }) });
  }
  async ensureToken() {
    if (!this.tokens || this.tokens.expiresAt > Date.now() + 60000) return;
    if (!this.refreshing) this.refreshing = (async () => {
      try {
        const data = await this.authRequest('https://securetoken.googleapis.com/v1/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: this.tokens.refreshToken }) });
        this.saveTokens({ idToken: data.id_token, refreshToken: data.refresh_token, expiresIn: data.expires_in });
      } catch (error) { if (error.code === 'AUTH_FAILED') this.signOut(); throw error; }
    })().finally(() => { this.refreshing = null; });
    await this.refreshing;
  }
  async request(path, options = {}) {
    if (!path.startsWith('/api/billing/')) throw new CloudError('Invalid billing route.', 'CONFIG_ERROR');
    await this.ensureToken();
    const response = await this.fetcher(this.config.apiBaseUrl + path, { credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(30000), ...options, headers: { 'Content-Type': 'application/json', ...options.headers, ...(this.tokens ? { Authorization: 'Bearer ' + this.tokens.idToken } : {}) } });
    let data; try { data = await response.json(); } catch { data = null; }
    if (!response.ok) { if (response.status === 401) this.signOut(); throw new CloudError(data?.message || `Cloud request failed (${response.status}).`, data?.code || response.status); }
    return data;
  }
  read() { return this.request('/api/billing/workspace'); }
  async readRevision() { return (await this.request('/api/billing/revision')).revision; }
  commit(data, expectedRevision, operationId, command = null) { return this.request('/api/billing/commit', { method: 'POST', body: JSON.stringify(command ? { expectedRevision, operationId, command } : { expectedRevision, operationId, data }) }); }
}
