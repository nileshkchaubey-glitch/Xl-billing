export class CloudError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}
// The hosted app authenticates through Sites; no database key/password is stored
// in the browser. PC and phone use the same signed-in ChatGPT account.
export class CloudClient {
  constructor(fetcher = globalThis.fetch) {
    // Block device-only posting while the initial host/session probe is pending.
    // Only a confirmed missing API enables the local development mode.
    this.fetcher = fetcher; this.available = true; this.session = null; this.googleConfigured = false;
  }
  get connected() { return Boolean(this.session); }
  async request(path, options = {}) {
    const response = await this.fetcher(path, { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(30000), ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
    let data; try { data = await response.json(); } catch { data = null; }
    if (!response.ok) throw new CloudError(data?.message || `Cloud request failed (${response.status}).`, data?.code || response.status);
    return data;
  }
  async discover() {
    try {
      const data = await this.request('/api/billing/session');
      this.available = data?.storage === 'd1'; this.session = data?.authenticated ? { user: data.user } : null; this.googleConfigured = Boolean(data?.googleConfigured);
    } catch (error) { if (error.code === 404) { this.available = false; return; } this.available = true; throw error; }
  }
  read() { return this.request('/api/billing/workspace'); }
  async readRevision() { return (await this.request('/api/billing/revision')).revision; }
  commit(data, expectedRevision, operationId, command = null) {
    return this.request('/api/billing/commit', { method: 'POST', body: JSON.stringify(command ? { expectedRevision, operationId, command } : { expectedRevision, operationId, data }) });
  }
}
