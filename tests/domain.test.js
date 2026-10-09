import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCommand, normalizeState, calculate, priceHistory, partyBalance, outstanding, fifo, cents, clone } from '../src/domain.js';
import { backupObject, makeCSV, parseCSV, masterImportCommands } from '../src/export.js';
import { fixture, sale, command } from './helpers.js';

test('amounts round per line, then discount and bill-level tax', () => {
  assert.deepEqual(calculate([{ qty: 3, rate: 0.335 }, { qty: 2, rate: 10 }], 1.01, 18), { subtotal: 21.01, discount: 1.01, taxPct: 18, taxAmt: 3.6, total: 23.6 });
  assert.equal(cents(1.005), 101);
  assert.throws(() => calculate([{ qty: 0, rate: 10 }]), /quantity/);
  assert.throws(() => calculate([{ qty: 1, rate: -10 }]), /negative/);
  assert.throws(() => calculate([{ qty: 1, rate: 10 }], 11), /Discount/);
});
test('legacy migration preserves unlisted fields, photos, audit and the initial paid amount', () => {
  const original = sale(fixture()).invoices[0];
  original.paid = 40; original.payments = [{ date: original.date, amt: 10, mode: 'UPI' }]; original.photoData = 'data:image/png;base64,aGVsbG8='; original.extra = { keep: true };
  const state = fixture(); state.invoices = [original]; state.settings.jsonbinKey = 'old-secret'; state.audit = [{ id: 'old', details: 'history' }];
  const migrated = normalizeState(state);
  assert.equal(migrated.invoices[0].paid, 40); assert.equal(migrated.invoices[0].balance, 60);
  assert.equal(migrated.invoices[0].payments.length, 2);
  const backup = backupObject(migrated);
  assert.equal(backup.data.settings.jsonbinKey, undefined);
  assert.deepEqual(normalizeState(backup.data), migrated);
  assert.equal(backup.data.invoices[0].photoData, original.photoData);
  assert.deepEqual(state.invoices[0].payments, [{ date: original.date, amt: 10, mode: 'UPI' }]);
});
test('reject malformed backups without quietly replacing the workspace with empty records', () => {
  for (const input of [{}, [], { items: {} }, { settings: [] }, { items: [{ id: 'a' }, { id: 'a' }] }]) assert.throws(() => normalizeState(input));
  const state = sale(fixture(), { date: '2026-02-28' }); state.invoices[0].date = '2026-02-30'; assert.throws(() => normalizeState(state), /date/);
});
test('last price uses bill date, stable item identity, party, unit and brand; excludes drafts/cancelled', () => {
  let state = sale(fixture(), { date: '2026-10-08', items: [{ itemId: 'item', name: 'Old name', unit: 'Pcs', colour: 'Blue', qty: 1, rate: 28 }] });
  state = sale(state, { date: '2026-09-01', items: [{ itemId: 'item', name: 'Cable', unit: 'Pcs', colour: 'Blue', qty: 1, rate: 15 }] });
  state = sale(state, { date: '2026-10-09', dispatchStatus: 'draft', items: [{ itemId: 'item', name: 'Cable', unit: 'Pcs', colour: 'Blue', qty: 1, rate: 90 }] });
  state = sale(state, { date: '2026-10-09', status: 'cancelled', items: [{ itemId: 'item', name: 'Cable', unit: 'Pcs', colour: 'Blue', qty: 1, rate: 100 }] });
  state = sale(state, { date: '2026-10-09', items: [{ itemId: 'item', name: 'Cable', unit: 'Pcs', colour: 'Red', qty: 1, rate: 80 }] });
  const line = { itemId: 'item', name: 'New name', unit: 'Pcs', colour: 'Blue' };
  assert.deepEqual(priceHistory(state, line, 'customer').map(row => row.rate), [28, 15]);
  assert.deepEqual(priceHistory(state, line, 'another-customer'), []);
  assert.deepEqual(priceHistory(state, { ...line, unit: 'Box' }), []);
});
test('new sale numbering remains unique even when a settings counter is moved backwards', () => {
  let state = sale(fixture()); state.settings.invNo = 1001; state = sale(state);
  assert.deepEqual(state.invoices.map(d => d.invoiceNo), ['INV-1001', 'INV-1002']);
});
test('a retried operation returns the same bill and audit, with no duplicate payments', () => {
  const operation = command('save-document', { date: '2026-10-09', partyName: 'Cash', isManual: true, total: 50, initialPaid: 50 }, { collection: 'invoices' });
  const state = applyCommand(fixture(), operation);
  assert.deepEqual(applyCommand(state, operation), state);
  assert.equal(state.invoices[0].payments.length, 1);
});
test('bulk previous bills are atomic when any row is invalid', () => {
  const state = fixture(), before = clone(state);
  assert.throws(() => applyCommand(state, command('bulk-documents', { partyId: 'customer', partyName: 'Asha', rows: [{ date: '2026-10-01', total: 50 }, { date: '2026-10-02', total: -1 }] }, { collection: 'invoices' })));
  assert.deepEqual(state, before);
});
test('payment allocation rejects duplicate, wrong-party, excess and unallocated amounts atomically', () => {
  const state = sale(fixture()), id = state.invoices[0].id, before = clone(state);
  for (const payload of [
    { amount: 101, allocations: [{ id, amount: 101 }] },
    { amount: 30, allocations: [{ id, amount: 10 }] },
    { amount: 20, allocations: [{ id, amount: 10 }, { id, amount: 10 }] },
    { amount: 10, partyId: 'wrong', allocations: [{ id, amount: 10 }] }
  ]) assert.throws(() => applyCommand(state, command('payment', { direction: 'in', date: '2026-10-09', partyId: 'customer', ...payload })));
  assert.deepEqual(state, before);
});
test('FIFO payment + settlement discount clear oldest balances and reversal restores only the selected payment', () => {
  let state = sale(fixture(), { date: '2026-10-01', total: 100, isManual: true });
  state = sale(state, { date: '2026-10-02', total: 80, isManual: true });
  const allocations = fifo(outstanding(state, 'in', 'customer'), 150);
  assert.deepEqual(allocations.map(a => a.amount), [100, 50]);
  state = applyCommand(state, command('payment', { direction: 'in', date: '2026-10-09', partyId: 'customer', amount: 150, discount: 30, allocations }));
  assert.equal(partyBalance(state, state.parties[0]), 0);
  const doc = state.invoices[1], payment = doc.payments.find(p => p.mode !== 'Discount');
  state = applyCommand(state, command('void-payment', {}, { collection: 'invoices', recordId: doc.id, paymentId: payment.id, expectedVersion: doc.version }));
  assert.equal(state.invoices[1].balance, 50); assert.ok(state.invoices[1].payments[0].voidedAt);
});
test('payment out and negative opening balances use the correct payable direction', () => {
  let state = sale(fixture(), { isManual: true, total: 100 }, 'purchases'); state.parties[0].openingBal = -30;
  assert.equal(partyBalance(state, state.parties[0]), -130);
  assert.throws(() => applyCommand(state, command('opening-payment', { partyId: 'customer', date: '2026-10-09', amount: 10, direction: 'in' })), /direction/);
  state = applyCommand(state, command('opening-payment', { partyId: 'customer', date: '2026-10-09', amount: 10, direction: 'out' }));
  const doc = state.purchases[0];
  state = applyCommand(state, command('payment', { direction: 'out', date: '2026-10-09', partyId: 'customer', amount: 40, allocations: [{ id: doc.id, amount: 40 }] }));
  assert.equal(partyBalance(state, state.parties[0]), -80);
  assert.throws(() => applyCommand(state, command('save-master', { id: 'customer', name: 'Asha', openingBal: 20 }, { collection: 'parties' })), /Reverse opening/);
});
test('stale bill edits cannot overwrite payments or changed bill contents', () => {
  const state = sale(fixture()), doc = state.invoices[0];
  const changed = applyCommand(state, command('payment', { direction: 'in', date: '2026-10-09', partyId: 'customer', amount: 10, allocations: [{ id: doc.id, amount: 10 }] }));
  assert.throws(() => applyCommand(changed, command('save-document', { ...doc, expectedVersion: doc.version }, { collection: 'invoices' })), /changed/);
  assert.equal(changed.invoices[0].balance, 90);
});
test('cancellation and restoration retain payment history and remove/add dues', () => {
  let state = sale(fixture(), { initialPaid: 25 }), doc = state.invoices[0];
  state = applyCommand(state, command('document-status', { status: 'cancelled' }, { collection: 'invoices', recordId: doc.id, expectedVersion: doc.version }));
  assert.equal(partyBalance(state, state.parties[0]), 0); assert.equal(state.invoices[0].payments.length, 1);
  state = applyCommand(state, command('document-status', { status: 'restored' }, { collection: 'invoices', recordId: doc.id, expectedVersion: 2 }));
  assert.equal(partyBalance(state, state.parties[0]), 75);
});
test('parties with offsetting unpaid sale/purchase balances cannot be archived', () => {
  let state = sale(fixture()); state = sale(state, {}, 'purchases');
  assert.equal(partyBalance(state, state.parties[0]), 0);
  assert.throws(() => applyCommand(state, command('archive', {}, { collection: 'parties', recordId: 'customer' })), /Settle all bills/);
});
test('settings preserve a newer auto-number counter and reject stale settings edits', () => {
  let state = sale(fixture());
  state = applyCommand(state, command('settings', { shopName: 'Updated', invNo: 1001, expectedCounter: 1001 }));
  assert.equal(state.settings.invNo, 1002);
  assert.throws(() => applyCommand(state, command('settings', { shopName: 'Stale', invNo: 1002, expectedCounter: 1002 })), /Settings changed/);
});
test('CSV roundtrip handles commas, quoted text, line breaks and Unicode, and exports formula text safely', () => {
  const csv = makeCSV([{ name: 'तार, "blue"\nsecond line', unit: 'Pcs' }], ['name','unit']);
  assert.equal(parseCSV(csv)[0].name, 'तार, "blue"\nsecond line');
  assert.match(makeCSV([{ name: '=IMPORTXML("bad")' }], ['name']), /'=IMPORTXML/);
  assert.throws(() => parseCSV('name,name\nx,y'), /duplicate/);
  assert.throws(() => parseCSV('name\n"unfinished'), /unclosed/);
});
test('CSV master imports apply atomically and preserve unknown fields on matching IDs', () => {
  const state = fixture(); state.items[0].legacyField = 'keep';
  const commands = masterImportCommands(state, 'items', 'id,name,saleRate\nitem,Updated,12\n,New,20');
  const imported = applyCommand(state, command('batch', { commands }));
  assert.equal(imported.items[0].legacyField, 'keep'); assert.equal(imported.items.length, 2);
  commands[1].payload.saleRate = -5;
  assert.throws(() => applyCommand(state, command('batch', { commands })), /negative/);
  assert.equal(state.items.length, 1);
});
test('Cash settlement discounts never adjust another party’s unpaid bill', () => {
  let state = sale(fixture()); state = sale(state, { partyId: '', partyName: 'Cash', isManual: true, total: 50 });
  state = applyCommand(state, command('payment', { direction: 'in', partyId: '', date: '2026-10-09', amount: 0, discount: 50, allocations: [] }));
  assert.equal(state.invoices[0].balance, 100); assert.equal(state.invoices[1].balance, 0);
});
