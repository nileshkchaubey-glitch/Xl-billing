const CONFIG_KEY = 'xl_billing_connection';
const SESSION_KEY = 'xl_billing_session';
export class CloudError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}
export class CloudClient {
  constructor(storage = globalThis.localStorage, sessions = globalThis.sessionStorage, fetcher = globalThis.fetch) {
    this.storage = storage; this.sessions = sessions; this.fetcher = fetcher;
    this.config = JSON.parse(storage.getItem(CONFIG_KEY) || 'null');
    this.session = JSON.parse(sessions.getItem(SESSION_KEY) || 'null');
  }
  get connected() { return Boolean(this.config && this.session); }
  configure(url, publishableKey) {
    const origin = new URL(url);
    publishableKey = String(publishableKey || '').trim();
    if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error('Use the HTTPS project URL, without a path or credentials.');
    if (!publishableKey || publishableKey.startsWith('sb_secret_')) throw new Error('Use the publishable/anon key. A secret key must never be entered here.');
    if (!publishableKey.startsWith('sb_publishable_') && publishableKey.split('.').length !== 3) throw new Error('Use a valid publishable/anon key.');
    if (publishableKey.split('.').length === 3) {
      try { if (JSON.parse(atob(publishableKey.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role !== 'anon') throw new Error('Use the anon key, never service_role.'); }
      catch { throw new Error('Use a valid publishable/anon key.'); }
    }
    if (this.config?.url !== origin.origin || this.config?.key !== publishableKey.trim()) { this.session = null; this.sessions.removeItem(SESSION_KEY); }
    this.config = { url: origin.origin, key: publishableKey.trim() };
    this.storage.setItem(CONFIG_KEY, JSON.stringify(this.config));
  }
  async request(path, options = {}, authenticated = true) {
    if (!this.config) throw new Error('Configure the cloud project first.');
    if (authenticated && this.session?.expires_at < Date.now() / 1000 + 90) await this.refresh();
    const response = await this.fetcher(this.config.url + path, { signal: AbortSignal.timeout(30000), ...options, headers: { apikey: this.config.key, 'Content-Type': 'application/json', ...(authenticated && this.session ? { Authorization: `Bearer ${this.session.access_token}` } : {}), ...options.headers } });
    let data; try { data = await response.json(); } catch { data = null; }
    if (!response.ok) throw new CloudError(data?.message || data?.msg || data?.error_description || `Cloud request failed (${response.status}).`, data?.code || response.status);
    return data;
  }
  async login(email, password) {
    const session = await this.request('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
    this.session = session; this.sessions.setItem(SESSION_KEY, JSON.stringify(session));
    return session.user;
  }
  async refresh() {
    if (this.refreshing) return this.refreshing;
    this.refreshing = (async () => {
      const session = await this.request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: this.session.refresh_token }) }, false);
      this.session = session; this.sessions.setItem(SESSION_KEY, JSON.stringify(session));
    })();
    try { await this.refreshing; } finally { this.refreshing = null; }
  }
  async logout() {
    try { if (this.session) await this.request('/auth/v1/logout', { method: 'POST' }); }
    finally { this.session = null; this.sessions.removeItem(SESSION_KEY); }
  }
  async read() {
    const rows = await this.request('/rest/v1/xl_billing_workspaces?select=data,revision&limit=1');
    return rows?.[0] || null;
  }
  async readRevision() {
    const rows = await this.request('/rest/v1/xl_billing_workspaces?select=revision&limit=1');
    return rows?.[0]?.revision ?? null;
  }
  async commit(data, expectedRevision, operationId) {
    return this.request('/rest/v1/rpc/xl_billing_commit', { method: 'POST', body: JSON.stringify({ next_data: data, expected_revision: expectedRevision, operation_id: operationId }) });
  }
}
