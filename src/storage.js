import { COLLECTIONS, blankState, normalizeState, applyCommand, clone, uid } from './domain.js';
import { BrowserCache } from './cache.js';
const STATE_KEY = 'xl_billing_v2';
const PENDING_KEY = 'xl_billing_pending';
export class BillingStore extends EventTarget {
  constructor(storage = globalThis.localStorage, cloud = null) {
    super(); this.storage = storage; this.cloud = cloud; this.busy = false; this.status = 'local';
    this.envelope = globalThis.indexedDB ? { revision: 0, data: blankState(), source: 'loading' } : this.readLocal();
    try { this.pending = JSON.parse(storage.getItem(PENDING_KEY) || 'null'); } catch { throw new Error('An unsaved operation is damaged. Export the browser data before continuing.'); }
    globalThis.addEventListener?.('storage', async event => {
      if ([STATE_KEY, 'xl_billing_cache_revision'].includes(event.key) && !this.busy) {
        try { this.envelope = await this.readFresh(); this.notify(); }
        catch (error) { this.markStatus('error', error.message); }
      }
    });
  }
  async initialize() {
    if (globalThis.indexedDB) {
      this.cache = new BrowserCache(); await this.cache.open();
      const saved = await this.cache.read();
      if (saved) {
        if (!Number.isSafeInteger(saved.revision) || saved.revision < 0) throw new Error('The browser cache revision is invalid. Keep your backup before continuing.');
        this.envelope = { ...saved, data: normalizeState(saved.data) };
      } else await this.save(this.readLocal());
    }
  }
  async readFresh() { return this.cache ? (await this.cache.read()) || this.envelope : this.readLocal(); }
  readLocal() {
    const raw = this.storage.getItem(STATE_KEY);
    if (raw) {
      const envelope = JSON.parse(raw);
      if (!Number.isSafeInteger(envelope.revision) || envelope.revision < 0) throw new Error('The local data revision is invalid. Restore a backup before billing.');
      return { ...envelope, data: normalizeState(envelope.data) };
    }
    const legacy = {};
    for (const name of ['settings', ...COLLECTIONS]) {
      const value = this.storage.getItem('shop4_' + name);
      if (value) legacy[name] = JSON.parse(value);
    }
    // Original shop4_* values remain untouched as a pre-migration recovery copy.
    return { revision: 0, data: Object.keys(legacy).length ? normalizeState(legacy) : blankState(), source: 'legacy-or-empty' };
  }
  get data() { return this.envelope.data; }
  notify() { this.dispatchEvent(new Event('change')); }
  async save(envelope) {
    const next = { ...envelope, data: normalizeState(envelope.data) };
    if (this.cache) {
      await this.cache.write(next);
      this.storage.removeItem(STATE_KEY);
      try { this.storage.setItem('xl_billing_cache_revision', `${next.ownerId || 'local'}:${next.revision}`); } catch { /* The committed cache remains recoverable. */ }
    } else this.storage.setItem(STATE_KEY, JSON.stringify(next));
    this.envelope = next; this.notify();
  }
  markStatus(status, error = '') { this.status = status; this.error = error; this.dispatchEvent(new Event('status')); }
  async connect() {
    if (!this.cloud?.connected) return;
    this.markStatus('syncing');
    try {
      const remote = await this.cloud.read();
      if (remote) {
        // Never silently overwrite local-only bills when first joining a cloud account.
        const localNonempty = COLLECTIONS.some(k => this.data[k].length);
        const sameOwner = this.envelope.ownerId === this.cloud.session.user.id;
        if (!sameOwner && localNonempty) throw new Error('Cloud already has billing data. Export your local backup, then choose “Use cloud data” below. Local data has been preserved.');
        await this.save({ ...remote, ownerId: this.cloud.session.user.id });
      } else {
        const saved = await this.cloud.commit(this.data, 0, uid());
        await this.save({ ...saved, ownerId: this.cloud.session.user.id });
      }
      this.markStatus('synced'); this.startPolling();
    } catch (error) { this.markStatus('error', error.message); throw error; }
  }
  async useCloud() {
    if (this.pending) throw new Error('Resolve the pending save before switching data.');
    const remote = await this.cloud.read();
    if (!remote) throw new Error('No cloud data exists for this account.');
    await this.save({ ...remote, ownerId: this.cloud.session.user.id });
    this.markStatus('synced'); this.startPolling();
  }
  startPolling() {
    clearInterval(this.timer);
    this.timer = setInterval(() => this.refresh().catch(() => {}), 8000);
    if (!this.focusBound) {
      this.focusBound = true;
      globalThis.addEventListener?.('focus', () => this.refresh().catch(() => {}));
      globalThis.addEventListener?.('online', () => this.refresh().catch(() => {}));
    }
  }
  async refresh() {
    if (!this.cloud?.connected || this.busy || this.envelope.ownerId !== this.cloud.session.user.id) return;
    try {
      // Poll a tiny revision value, not every bill/photo on unchanged workspaces.
      const revision = await this.cloud.readRevision();
      if (revision === null) throw new Error('Cloud workspace is missing. Check the project before posting more bills.');
      if (revision !== this.envelope.revision) {
        const remote = await this.cloud.read();
        if (!remote) throw new Error('Cloud workspace is missing.');
        await this.save({ ...remote, ownerId: this.cloud.session.user.id });
      }
      this.markStatus(this.pending ? 'pending' : 'synced');
    } catch (error) { this.markStatus('error', error.message); throw error; }
  }
  async execute(type, payload = {}, meta = {}) {
    if (this.pending) throw new Error('An earlier save is pending. Retry it in Data & Sync before creating another transaction.');
    return this.submit({ id: uid(), at: new Date().toISOString(), type, payload, ...meta });
  }
  async submit(command) {
    if (this.busy) throw new Error('A save is already running.');
    const work = async () => {
      this.busy = true;
      let knownRejected = false;
      try {
        if (this.pending && this.pending.id !== command.id) throw new Error('Resolve the pending save before starting another operation.');
        if (this.cloud?.connected) {
          if (this.envelope.ownerId !== this.cloud.session.user.id) throw new Error('Finish connecting the cloud account before saving.');
          let next = applyCommand(this.data, command); // Validation before persisting a pending operation.
          this.storage.setItem(PENDING_KEY, JSON.stringify(command)); this.pending = command;
          this.markStatus('syncing');
          let saved;
          try { saved = await this.cloud.commit(next, this.envelope.revision, command.id); }
          catch (error) {
            if (error.code !== '40001') throw error;
            const remote = await this.cloud.read();
            if (!remote) throw new Error('Cloud workspace is missing.');
            await this.save({ ...remote, ownerId: this.cloud.session.user.id });
            // Rebase independent creates. Version checks prevent rebasing stale edits.
            knownRejected = true;
            next = applyCommand(this.data, command);
            knownRejected = false;
            saved = await this.cloud.commit(next, this.envelope.revision, command.id);
          }
          await this.save({ ...saved, ownerId: this.cloud.session.user.id });
        } else {
          if (this.envelope.ownerId) throw new Error('Sign in to the cloud account to post bills. Offline work can be kept as a draft.');
          this.envelope = await this.readFresh();
          await this.save({ revision: this.envelope.revision + 1, data: applyCommand(this.data, command), source: 'local' });
        }
        this.storage.removeItem(PENDING_KEY); this.pending = null;
        this.markStatus(this.cloud?.connected ? 'synced' : 'local');
        return clone(this.data);
      } catch (error) {
        if (knownRejected || ['40001', '22023', '23505'].includes(error.code)) { this.storage.removeItem(PENDING_KEY); this.pending = null; }
        this.markStatus(this.pending ? 'pending' : 'error', error.message); throw error;
      } finally { this.busy = false; }
    };
    return globalThis.navigator?.locks ? navigator.locks.request('xl-billing-save', work) : work();
  }
  retry() {
    if (!this.pending) throw new Error('No pending save exists.');
    return this.submit(this.pending);
  }
}
