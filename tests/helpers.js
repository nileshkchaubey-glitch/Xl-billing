import { applyCommand, blankState, clone } from '../src/domain.js';
import { CloudError } from '../src/cloud.js';
export class MemoryStorage {
  constructor(entries = {}) { this.values = new Map(Object.entries(entries)); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}
let sequence = 0;
export function command(type, payload = {}, meta = {}) { return { id: `op-${++sequence}`, at: `2026-10-09T12:00:${String(sequence % 60).padStart(2, '0')}Z`, type, payload, ...meta }; }
export function fixture() {
  const state = blankState();
  state.parties.push({ id: 'customer', name: 'Asha', type: 'both', openingBal: 0 });
  state.items.push({ id: 'item', name: 'Cable', unit: 'Pcs', saleRate: 10, colour: 'Blue' });
  return state;
}
export function sale(state, values = {}, kind = 'invoices') {
  return applyCommand(state, command('save-document', { date: '2026-10-08', partyId: 'customer', partyName: 'Asha', items: [{ id: 'line', itemId: 'item', name: 'Cable', unit: 'Pcs', colour: 'Blue', qty: 10, rate: 10 }], dispatchStatus: 'pending', ...values }, { collection: kind }));
}
export function remoteCloud(data = fixture()) {
  return {
    connected: true, session: { user: { id: 'owner' } }, envelope: { revision: 1, data: clone(data) }, operations: new Set(), writes: 0,
    async read() { return clone(this.envelope); },
    async readRevision() { return this.envelope.revision; },
    async commit(next, expectedRevision, id) {
      if (this.operations.has(id)) return this.read();
      if (expectedRevision !== this.envelope.revision) throw new CloudError('Changed', '40001');
      this.envelope = { revision: expectedRevision + 1, data: clone(next) }; this.operations.add(id); this.writes++;
      return this.read();
    }
  };
}
