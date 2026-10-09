// Billing rules live here, independently of screens and persistence.
export const COLLECTIONS = ['items', 'parties', 'invoices', 'purchases', 'retail', 'audit', 'openingPayments'];
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const uid = () => crypto.randomUUID();
export const clone = value => structuredClone(value);
export const active = row => !row.deletedAt && row.status !== 'cancelled' && row.dispatchStatus !== 'cancelled';
export const key = value => String(value ?? '').trim().toLocaleLowerCase('en-IN');
export function cents(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || Math.abs(number) > 1e11) throw new Error('Enter a valid amount.');
  return Math.round((number + Math.sign(number) * Number.EPSILON) * 100);
}
export const money = value => cents(value) / 100;
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
export function blankState() {
  const now = new Date();
  const year = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  return { schemaVersion: 2, settings: { shopName: 'My Shop', owner: '', address: '', phone: '', gstin: '', state: '', prefix: 'INV-', invNo: 1001, fy: `${year}-${String(year + 1).slice(-2)}`, terms: '', bank: '', customFields: [], modules: { packing: true, dispatch: true, retail: true, gst: true }, printSettings: {} }, ...Object.fromEntries(COLLECTIONS.map(name => [name, []])) };
}
export function cleanSettings(settings) {
  const output = { ...settings };
  // Legacy integration secrets do not belong in a backup or billing database.
  for (const field of ['jsonbinKey', 'jsonbinId', 'gsUrl', 'deletePin']) delete output[field];
  return output;
}
export function paymentTotal(record) {
  return (record.payments || []).filter(p => !p.voidedAt).reduce((sum, p) => sum + cents(p.amt), 0) / 100;
}
export function reconcile(record) {
  record.paid = paymentTotal(record);
  record.balance = Math.max(0, cents(record.total) - cents(record.paid)) / 100;
  return record;
}
export function normalizeState(input) {
  requireValue(input && typeof input === 'object' && !Array.isArray(input), 'Invalid backup: expected a billing data object.');
  requireValue(COLLECTIONS.some(name => name in input) || 'settings' in input, 'This file does not contain billing data.');
  requireValue(input.settings === undefined || (input.settings && typeof input.settings === 'object' && !Array.isArray(input.settings)), 'Invalid business settings.');
  const defaults = blankState();
  const output = { ...clone(input), schemaVersion: 2, settings: { ...defaults.settings, ...cleanSettings(input.settings || {}) } };
  requireValue(Array.isArray(output.settings.customFields), 'Invalid custom invoice fields.');
  for (const cf of output.settings.customFields) requireValue(cf && typeof cf.id === 'string' && typeof cf.label === 'string', 'Invalid custom invoice field.');
  for (const collection of COLLECTIONS) {
    requireValue(input[collection] === undefined || Array.isArray(input[collection]), `Invalid ${collection} data.`);
    output[collection] = clone(input[collection] || []);
    const ids = new Set();
    for (const row of output[collection]) {
      requireValue(row && typeof row === 'object' && typeof row.id === 'string' && row.id, `Invalid record in ${collection}: missing ID.`);
      requireValue(!ids.has(row.id), `Duplicate ID in ${collection}.`);
      ids.add(row.id);
    }
  }
  for (const row of [...output.items, ...output.parties]) requireValue(typeof row.name === 'string' && row.name.trim(), 'An item or party is missing its name.');
  for (const party of output.parties) party.openingBal = money(party.openingBal);
  for (const collection of ['invoices', 'purchases']) {
    for (const doc of output[collection]) {
      requireValue(Number.isFinite(Number(doc.total)) && Number(doc.total) >= 0, 'A bill has an invalid total.');
      requireValue(validDate(doc.date), 'A bill has an invalid date.');
      doc.total = money(doc.total);
      requireValue(doc.items === undefined || Array.isArray(doc.items), 'Invalid invoice lines.');
      requireValue(doc.payments === undefined || Array.isArray(doc.payments), 'Invalid payment history.');
      doc.items ||= [];
      doc.payments ||= [];
      doc.partyId ||= '';
      // Older versions stored an amount received without creating payment entries.
      const missingPaid = cents(doc.paid) - cents(paymentTotal(doc));
      if (missingPaid > 0 && !doc.payments.some(p => p.voidedAt)) doc.payments.push({ id: `legacy-${doc.id}`, date: doc.date, amt: missingPaid / 100, mode: doc.paymentType || doc.payType || 'Cash', note: 'Migrated opening payment' });
      doc.payments = doc.payments.map((payment, i) => ({ ...payment, id: payment.id || `legacy-${doc.id}-${i}` }));
      const paymentIds = new Set();
      for (const payment of doc.payments) {
        requireValue(validDate(payment.date) && cents(payment.amt) >= 0, 'A payment has an invalid date or amount.');
        requireValue(!paymentIds.has(payment.id), 'Duplicate payment ID.'); paymentIds.add(payment.id);
      }
      doc.version ||= 1;
      reconcile(doc);
    }
  }
  const numbers = new Set();
  for (const doc of output.invoices) {
    requireValue(typeof doc.invoiceNo === 'string' && doc.invoiceNo.trim() && !numbers.has(doc.invoiceNo), 'Missing or duplicate invoice number.'); numbers.add(doc.invoiceNo);
  }
  for (const payment of output.openingPayments) requireValue(validDate(payment.date) && cents(payment.amt) > 0 && ['in', 'out'].includes(payment.direction), 'Invalid opening payment.');
  for (const row of output.retail) requireValue(validDate(row.date) && cents(row.amount) > 0, 'Invalid retail entry.');
  return output;
}
export function calculate(lines, discount = 0, taxPct = 0) {
  const subtotal = lines.reduce((sum, line) => {
    const qty = Number(line.qty), rate = Number(line.rate);
    requireValue(Number.isFinite(qty) && qty > 0, 'Each item needs a quantity greater than zero.');
    requireValue(Number.isFinite(rate) && rate >= 0, 'Rates cannot be negative.');
    return sum + cents(qty * rate);
  }, 0);
  const deduction = cents(discount), tax = Number(taxPct);
  requireValue(deduction >= 0 && deduction <= subtotal, 'Discount must be between zero and the subtotal.');
  requireValue(Number.isFinite(tax) && tax >= 0 && tax <= 100, 'Enter a tax percentage between 0 and 100.');
  const taxAmount = Math.round((subtotal - deduction) * tax / 100);
  return { subtotal: subtotal / 100, discount: deduction / 100, taxPct: tax, taxAmt: taxAmount / 100, total: (subtotal - deduction + taxAmount) / 100 };
}
const histories = new WeakMap();
export function priceHistory(state, line, partyId = '', limit = 5, kind = 'invoices') {
  if (!line.name && !line.itemId) return [];
  // Store saves replace state objects. Index once per snapshot, rather than
  // rescanning every historical bill for every keystroke in every invoice row.
  let indexes = histories.get(state);
  if (!indexes) { indexes = new Map(); histories.set(state, indexes); }
  if (!indexes.has(kind)) {
    const byId = new Map(), byName = new Map();
    const add = (map, id, entry) => { if (!map.has(id)) map.set(id, []); map.get(id).push(entry); };
    for (const invoice of state[kind].filter(row => active(row) && row.dispatchStatus !== 'draft' && row.status !== 'draft')) {
      for (const item of invoice.items || []) {
        if (Number(item.rate) <= 0) continue;
        const entry = { item, invoice };
        if (item.itemId) add(byId, item.itemId, entry);
        add(byName, key(item.name), entry);
      }
    }
    indexes.set(kind, { byId, byName });
  }
  const { byId, byName } = indexes.get(kind);
  const named = byName.get(key(line.name)) || [];
  const candidates = line.itemId ? [...(byId.get(line.itemId) || []), ...named.filter(entry => !entry.item.itemId)] : named;
  return candidates.filter(({ item, invoice }) => (!partyId || invoice.partyId === partyId) && key(line.unit || 'Pcs') === key(item.unit || 'Pcs') && key(line.colour || '') === key(item.colour || ''))
    .map(({ item, invoice }) => ({ rate: Number(item.rate), date: invoice.date, createdAt: invoice.createdAt || '', invoiceNo: invoice.invoiceNo || invoice.billNo, partyName: invoice.partyName, unit: item.unit || 'Pcs', packType: item.packType || '', invoiceId: invoice.id }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.invoiceId.localeCompare(a.invoiceId)).slice(0, limit);
}
export function partyBalance(state, party) {
  const invoiceDue = state.invoices.filter(d => active(d) && d.dispatchStatus !== 'draft' && d.partyId === party.id).reduce((sum, d) => sum + cents(d.balance), 0);
  const purchaseDue = state.purchases.filter(d => active(d) && d.partyId === party.id).reduce((sum, d) => sum + cents(d.balance), 0);
  const openingPaid = state.openingPayments.filter(p => !p.voidedAt && p.partyId === party.id).reduce((sum, p) => sum + cents(p.amt) * (p.direction === 'out' ? -1 : 1), 0);
  return (cents(party.openingBal) - openingPaid + invoiceDue - purchaseDue) / 100;
}
export function outstanding(state, direction, partyId = '') {
  const collection = direction === 'out' ? 'purchases' : 'invoices';
  const docs = state[collection].filter(d => active(d) && d.dispatchStatus !== 'draft' && d.status !== 'draft' && cents(d.balance) > 0 && (!partyId || d.partyId === partyId));
  return [...docs].sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt || '').localeCompare(b.createdAt || ''));
}
export function fifo(docs, amount) {
  let remaining = cents(amount);
  requireValue(remaining >= 0, 'Payment cannot be negative.');
  return docs.map(doc => { const allocation = Math.min(remaining, cents(doc.balance)); remaining -= allocation; return { id: doc.id, amount: allocation / 100 }; }).filter(row => row.amount > 0);
}
export function transactions(state) {
  const rows = [];
  for (const [kind, docs] of [['Sale', state.invoices], ['Purchase', state.purchases]]) {
    for (const doc of docs) {
      if (doc.deletedAt) continue;
      rows.push({ id: doc.id, date: doc.date, partyId: doc.partyId, partyName: doc.partyName, reference: doc.invoiceNo || doc.billNo, type: kind, amount: doc.total, balance: doc.balance, cancelled: !active(doc), collection: kind === 'Sale' ? 'invoices' : 'purchases' });
      for (const payment of doc.payments || []) if (!payment.voidedAt) rows.push({ id: payment.id, documentId: doc.id, date: payment.date, partyId: doc.partyId, partyName: doc.partyName, reference: doc.invoiceNo || doc.billNo, type: payment.mode === 'Discount' ? 'Settlement discount' : kind === 'Sale' ? 'Payment in' : 'Payment out', amount: payment.amt, mode: payment.mode, note: payment.note, cancelled: !active(doc), collection: kind === 'Sale' ? 'invoices' : 'purchases' });
    }
  }
  for (const row of state.retail.filter(active)) rows.push({ ...row, type: 'Retail', reference: 'Retail', partyName: 'Walk-in', balance: 0 });
  for (const row of state.openingPayments.filter(p => !p.voidedAt)) rows.push({ ...row, amount: row.amt, reference: 'Opening balance', type: row.direction === 'out' ? 'Payment out' : 'Payment in', partyName: state.parties.find(p => p.id === row.partyId)?.name || 'Party' });
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}
function audit(state, command, entity, label) {
  state.audit.push({ id: command.id, type: command.type, entityType: command.collection || '', entityId: entity || '', label, details: '', ts: command.at, user: state.settings.owner || 'Owner' });
}
function findDoc(state, command) {
  requireValue(['invoices', 'purchases'].includes(command.collection), 'Invalid bill type.');
  const doc = state[command.collection].find(row => row.id === command.recordId);
  requireValue(doc && !doc.deletedAt, 'This bill is no longer available.');
  if (command.expectedVersion != null) requireValue(doc.version === command.expectedVersion, 'This bill changed on another screen or device. Open it again before editing.');
  return doc;
}
function saveDocument(state, command, payload, suffix = '') {
  const collection = command.collection;
  requireValue(['invoices', 'purchases'].includes(collection), 'Invalid bill type.');
  const previous = payload.id ? state[collection].find(row => row.id === payload.id) : null;
  if (payload.id) requireValue(previous && !previous.deletedAt && active(previous), 'This bill cannot be edited.');
  if (previous) requireValue(previous.version === payload.expectedVersion, 'This bill changed. Open the latest version before editing.');
  requireValue(validDate(payload.date), 'Enter a valid bill date.');
  requireValue(!payload.due || (validDate(payload.due) && payload.due >= payload.date), 'Due date must be on or after the bill date.');
  requireValue(String(payload.partyName || '').trim(), 'Select a party or enter Cash.');
  let partyId = payload.partyId || '';
  if (partyId) requireValue(state.parties.some(p => p.id === partyId && !p.deletedAt), 'Select an active party.');
  if (!partyId && key(payload.partyName) !== 'cash') {
    const matches = state.parties.filter(p => !p.deletedAt && key(p.name) === key(payload.partyName));
    requireValue(matches.length <= 1, 'Several parties have this name. Select a party from the list.');
    partyId = matches[0]?.id || `${command.id}-party`;
    if (!matches.length) state.parties.push({ id: partyId, name: payload.partyName.trim(), type: collection === 'invoices' ? 'customer' : 'supplier', openingBal: 0, createdAt: command.at });
  }
  const lines = clone(payload.items || []).filter(line => String(line.name || '').trim());
  requireValue(payload.isManual || lines.length, 'Add at least one item.');
  for (const line of lines) {
    line.name = line.name.trim();
    line.qty = Number(line.qty); line.rate = Number(line.rate); line.amt = money(line.qty * line.rate);
  }
  const totals = payload.isManual ? { subtotal: money(payload.total), discount: 0, taxPct: 0, taxAmt: 0, total: money(payload.total) } : calculate(lines, payload.discount, payload.taxPct);
  requireValue(totals.total > 0, 'Bill total must be greater than zero.');
  let number = previous?.invoiceNo || previous?.billNo;
  if (!number && collection === 'invoices') {
    number = String(payload.invoiceNo || '').trim();
    if (!number) {
      let counter = Number(state.settings.invNo) || 1001;
      do { number = `${state.settings.prefix || 'INV-'}${counter++}`; } while (state.invoices.some(d => d.invoiceNo === number));
      state.settings.invNo = counter;
    }
    requireValue(!state.invoices.some(d => d.invoiceNo === number), 'This invoice number already exists.');
  }
  if (!number && collection === 'purchases') number = String(payload.billNo || '').trim() || `PUR-${command.id.slice(0, 8)}${suffix}`;
  if (collection === 'purchases') requireValue(!state.purchases.some(d => d.id !== previous?.id && d.partyId === partyId && d.billNo === number), 'This supplier bill number already exists.');
  const initialPaid = cents(payload.initialPaid);
  requireValue(initialPaid >= 0 && initialPaid <= cents(totals.total), 'Received/paid amount cannot exceed this bill total.');
  const payments = clone(previous?.payments || []);
  const party = state.parties.find(row => row.id === partyId);
  const partySnapshot = previous?.partyId === partyId && previous?.partySnapshot ? previous.partySnapshot : { name: payload.partyName.trim(), address: party?.address || '', phone: party?.phone || '', gstin: party?.gstin || '' };
  if (!previous && initialPaid) payments.push({ id: `${command.id}${suffix}-paid`, date: payload.date, amt: initialPaid / 100, mode: payload.paymentType || 'Cash', note: 'At billing' });
  const row = reconcile({ ...previous, ...payload, ...totals, partySnapshot, id: previous?.id || `${command.id}${suffix}`, invoiceNo: collection === 'invoices' ? number : undefined, billNo: collection === 'purchases' ? number : undefined, partyId, partyName: payload.partyName.trim(), items: lines, payments, payType: payload.paymentType, mode: payload.isManual ? 'amount' : 'items', customFieldValues: payload.customFieldValues || {}, createdAt: previous?.createdAt || command.at, updatedAt: command.at, version: (previous?.version || 0) + 1 });
  requireValue(!previous || cents(row.paid) <= cents(row.total), 'New total is below payments already recorded. Reverse or correct those payments first.');
  delete row.expectedVersion; delete row.initialPaid;
  const index = state[collection].findIndex(d => d.id === row.id);
  if (index < 0) state[collection].push(row); else state[collection][index] = row;
  return row;
}
export function applyCommand(current, command) {
  const state = clone(current);
  const payload = command.payload || {};
  requireValue(command.id && command.at, 'Missing operation identity.');
  // Also protects retries in local mode; audit events are retained with business data.
  if (state.audit.some(row => row.id === command.id)) return state;
  if (command.type === 'save-document') {
    const row = saveDocument(state, command, payload);
    audit(state, command, row.id, `${payload.id ? 'Updated' : 'Created'} ${row.invoiceNo || row.billNo}`);
  } else if (command.type === 'bulk-documents') {
    requireValue(Array.isArray(payload.rows) && payload.rows.length, 'Enter at least one bill.');
    payload.rows.forEach((row, i) => saveDocument(state, command, { ...row, partyId: payload.partyId, partyName: payload.partyName, isManual: true }, `-${i}`));
    audit(state, command, '', `Imported ${payload.rows.length} bills`);
  } else if (command.type === 'save-master') {
    requireValue(['items', 'parties'].includes(command.collection), 'Invalid master type.');
    requireValue(String(payload.name || '').trim(), 'Enter a name.');
    const previous = payload.id ? state[command.collection].find(row => row.id === payload.id) : null;
    requireValue(!payload.id || (previous && !previous.deletedAt), 'This record is no longer available.');
    if (previous) requireValue(previous.updatedAt === payload.expectedUpdatedAt, 'This record changed. Open it again.');
    const row = { ...previous, ...payload, id: previous?.id || command.id, name: payload.name.trim(), updatedAt: command.at };
    delete row.expectedUpdatedAt;
    if (command.collection === 'items') {
      for (const field of ['saleRate', 'purchaseRate', 'gst']) { row[field] = Number(row[field] || 0); requireValue(Number.isFinite(row[field]) && row[field] >= 0, 'Rates and GST cannot be negative.'); }
      requireValue(row.gst <= 100, 'GST percentage must not exceed 100.');
    } else {
      row.openingBal = money(row.openingBal);
      const paidOpening = state.openingPayments.filter(p => p.partyId === row.id && !p.voidedAt).reduce((sum, p) => sum + cents(p.amt), 0);
      requireValue(!paidOpening || (Math.sign(row.openingBal) === Math.sign(previous.openingBal) && Math.abs(cents(row.openingBal)) >= paidOpening), 'Reverse opening payments before changing their direction or reducing the balance below payments.');
    }
    const index = state[command.collection].findIndex(d => d.id === row.id);
    if (index < 0) state[command.collection].push(row); else state[command.collection][index] = row;
    audit(state, command, row.id, `Saved ${row.name}`);
  } else if (command.type === 'payment') {
    requireValue(['in', 'out'].includes(payload.direction), 'Invalid payment direction.');
    requireValue(validDate(payload.date), 'Enter a valid payment date.');
    const collection = payload.direction === 'out' ? 'purchases' : 'invoices';
    const amount = cents(payload.amount), discount = cents(payload.discount);
    requireValue(amount >= 0 && discount >= 0 && amount + discount > 0, 'Enter a payment or settlement discount.');
    const seen = new Set(); let sum = 0;
    for (const allocation of payload.allocations || []) {
      requireValue(!seen.has(allocation.id), 'Duplicate bill allocation.'); seen.add(allocation.id);
      const doc = state[collection].find(d => d.id === allocation.id);
      const allocated = cents(allocation.amount);
      requireValue(doc && active(doc) && doc.dispatchStatus !== 'draft' && doc.partyId === payload.partyId, 'A selected bill is unavailable or belongs to another party.');
      requireValue(allocated > 0 && allocated <= cents(doc.balance), 'Allocation exceeds a bill balance.');
      sum += allocated;
      doc.payments.push({ id: `${command.id}-${doc.id}`, date: payload.date, amt: allocated / 100, mode: payload.mode || 'Cash', note: payload.note || '' });
      reconcile(doc); doc.updatedAt = command.at; doc.version += 1;
    }
    requireValue(sum === amount, 'Allocate the full payment amount to bills. Advances are not recorded by this screen.');
    if (discount > 0) {
      const due = outstanding(state, payload.direction).filter(doc => doc.partyId === payload.partyId);
      requireValue(due.reduce((sum, d) => sum + cents(d.balance), 0) >= discount, 'Settlement discount exceeds the remaining balance.');
      for (const allocation of fifo(due, discount / 100)) {
        const doc = state[collection].find(d => d.id === allocation.id);
        doc.payments.push({ id: `${command.id}-discount-${doc.id}`, date: payload.date, amt: allocation.amount, mode: 'Discount', note: payload.note || 'Settlement discount' });
        reconcile(doc); doc.updatedAt = command.at; doc.version += 1;
      }
    }
    audit(state, command, payload.partyId, `Payment ${payload.direction}: ${amount / 100}, discount: ${discount / 100}`);
  } else if (command.type === 'opening-payment') {
    const party = state.parties.find(p => p.id === payload.partyId && !p.deletedAt);
    requireValue(party && validDate(payload.date), 'Select a party and payment date.');
    const paid = state.openingPayments.filter(p => p.partyId === party.id && !p.voidedAt).reduce((sum, p) => sum + cents(p.amt), 0);
    const amount = cents(payload.amount);
    requireValue(amount > 0 && amount <= Math.abs(cents(party.openingBal)) - paid, 'Payment exceeds the outstanding opening balance.');
    requireValue(payload.direction === (cents(party.openingBal) < 0 ? 'out' : 'in'), 'Wrong opening-balance payment direction.');
    state.openingPayments.push({ ...payload, id: command.id, amt: amount / 100, createdAt: command.at });
    audit(state, command, party.id, 'Opening balance payment');
  } else if (command.type === 'void-payment') {
    if (command.collection === 'openingPayments') {
      const payment = state.openingPayments.find(p => p.id === command.paymentId && !p.voidedAt);
      requireValue(payment, 'Payment no longer available.'); payment.voidedAt = command.at;
    } else {
      const doc = findDoc(state, command);
      const payment = doc.payments.find(p => p.id === command.paymentId && !p.voidedAt);
      requireValue(payment, 'Payment no longer available.'); payment.voidedAt = command.at;
      reconcile(doc); doc.version += 1; doc.updatedAt = command.at;
    }
    audit(state, command, command.recordId, 'Reversed payment');
  } else if (command.type === 'document-status') {
    const doc = findDoc(state, command);
    requireValue(['cancelled', 'restored', 'dispatched', 'pending'].includes(payload.status), 'Invalid status.');
    if (payload.status === 'cancelled') { requireValue(active(doc), 'This bill is already cancelled.'); doc.previousDispatch = doc.dispatchStatus; doc.status = 'cancelled'; doc.dispatchStatus = 'cancelled'; }
    else if (payload.status === 'restored') { requireValue(!active(doc), 'This bill is already active.'); doc.status = 'active'; doc.dispatchStatus = doc.previousDispatch || 'pending'; }
    else { requireValue(active(doc), 'Restore the bill first.'); doc.dispatchStatus = payload.status; }
    doc.version += 1; doc.updatedAt = command.at;
    audit(state, command, doc.id, `${payload.status}: ${doc.invoiceNo || doc.billNo}`);
  } else if (command.type === 'archive') {
    requireValue(['items', 'parties', 'retail'].includes(command.collection), 'Cancel bills instead of deleting them.');
    const row = state[command.collection].find(d => d.id === command.recordId && !d.deletedAt);
    requireValue(row, 'Record no longer available.');
    if (command.collection === 'parties') {
      const paidOpening = state.openingPayments.filter(p => p.partyId === row.id && !p.voidedAt).reduce((sum, p) => sum + cents(p.amt), 0);
      requireValue(!outstanding(state, 'in', row.id).length && !outstanding(state, 'out', row.id).length && Math.abs(cents(row.openingBal)) === paidOpening, 'Settle all bills and opening balances before archiving this party.');
    }
    row.deletedAt = command.at;
    audit(state, command, row.id, `Archived ${row.name || row.date}`);
  } else if (command.type === 'restore-master') {
    requireValue(['items', 'parties', 'retail'].includes(command.collection), 'Invalid record type.');
    const row = state[command.collection].find(d => d.id === command.recordId && d.deletedAt);
    requireValue(row, 'Archived record not found.'); delete row.deletedAt;
    audit(state, command, row.id, 'Restored record');
  } else if (command.type === 'retail') {
    requireValue(validDate(payload.date) && cents(payload.amount) > 0, 'Enter a date and positive retail amount.');
    state.retail.push({ ...payload, amount: money(payload.amount), id: command.id, createdAt: command.at });
    audit(state, command, command.id, 'Retail sale');
  } else if (command.type === 'settings') {
    requireValue(String(payload.shopName || '').trim(), 'Enter a business name.');
    requireValue(state.settings.updatedAt === payload.expectedUpdatedAt, 'Settings changed on another device. Open them again.');
    const settingsPayload = { ...payload };
    if (Number(payload.invNo) === payload.expectedCounter) settingsPayload.invNo = state.settings.invNo;
    else requireValue(Number(state.settings.invNo) === payload.expectedCounter, 'The invoice counter changed. Open settings again.');
    delete settingsPayload.expectedCounter; delete settingsPayload.expectedUpdatedAt;
    state.settings = { ...state.settings, ...cleanSettings(settingsPayload), updatedAt: command.at };
    requireValue(Number.isSafeInteger(Number(state.settings.invNo)) && Number(state.settings.invNo) > 0, 'Invoice counter must be a positive integer.');
    audit(state, command, '', 'Updated business settings');
  } else if (command.type === 'batch') {
    requireValue(Array.isArray(payload.commands) && payload.commands.length > 0 && payload.commands.length <= 500, 'Invalid import batch.');
    let result = state;
    for (const child of payload.commands) {
      requireValue(child.type === 'save-master', 'Only master imports are supported in this batch.');
      result = applyCommand(result, child);
    }
    audit(result, command, '', `Imported ${payload.commands.length} master records`);
    return result;
  } else if (command.type === 'restore-backup') {
    const restored = normalizeState(payload.data);
    audit(restored, command, '', 'Restored backup');
    return restored;
  } else throw new Error('Unknown billing operation.');
  return state;
}
