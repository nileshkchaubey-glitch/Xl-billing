import { today, uid, clone, calculate, priceHistory, active, key, nextInvoiceNumber, partyBalance } from '../domain.js';
import { e, currency, dateLabel, options, field, button, pageHead } from '../ui.js';
export const paymentModes = ['Cash', 'UPI', 'Cheque', 'NEFT', 'Card'];
export const itemChoice = item => `${item.name} · ${item.sku || item.id.slice(-6)}`;
export const partyChoice = party => `${party.name} · ${party.id.slice(-6)}`;
export function newLine() { return { id: uid(), itemId: '', name: '', qty: 1, rate: 0, unit: 'Pcs', colour: '', packType: '', packCount: '' }; }
export function createEditor(store, kind, recordId = '') {
  const record = recordId && store.data[kind].find(row => row.id === recordId);
  if (recordId && (!record || !active(record))) throw new Error('This bill cannot be edited.');
  const draftKey = `xl_draft_${store.envelope.ownerId || 'local'}_${kind}${recordId ? '_' + recordId : ''}`;
  let cached = null;
  try {
    cached = JSON.parse(localStorage.getItem(draftKey) || 'null');
    if (!Array.isArray(cached?.items) || (record ? cached.id !== record.id || cached.expectedVersion !== record.version : Boolean(cached.id))) cached = null;
  } catch { /* A bad draft must not affect saved bills. */ }
  return { kind, draftKey, dirty: false, draft: cached || (record ? { ...clone(record), expectedVersion: record.version, initialPaid: 0 } : { date: today(), due: '', partyId: '', partyName: '', items: [newLine()], discount: 0, taxPct: 0, initialPaid: 0, paymentType: 'Cash', dispatchStatus: 'pending', notes: '', billNo: '', invoiceNo: '', customFieldValues: {}, isManual: kind === 'purchases' }) };
}
export function rememberEditor(editor) {
  editor.dirty = true;
  // Saved-bill drafts are separate and restored only while their version matches.
  localStorage.setItem(editor.draftKey, JSON.stringify(editor.draft));
}
export function resolveParty(state, value) {
  const matches = state.parties.filter(p => !p.deletedAt && key(p.name) === key(value));
  const party = state.parties.find(p => !p.deletedAt && partyChoice(p) === value) || (matches.length === 1 ? matches[0] : null);
  return party ? { partyId: party.id, partyName: party.name } : { partyId: '', partyName: value.trim() };
}
function historyMarkup(state, line, partyId, kind) {
  const rates = priceHistory(state, line, partyId, 1, kind);
  return rates.length ? `<button type="button" class="last-price" data-action="price-history" data-line="${e(line.id)}">Last ${partyId ? 'party ' : ''}price: ${currency(rates[0].rate)} <span>· ${dateLabel(rates[0].date)}</span></button>` : `<span class="muted tiny">${line.name ? 'No previous price for this item / party' : 'Select an item to see its last price'}</span>`;
}
function lineMarkup(editor, state, line, index) {
  const master = state.items.find(item => item.id === line.itemId && !item.deletedAt);
  const displayName = master ? itemChoice(master) : line.name;
  const showPack = state.settings.modules?.packing !== false;
  return `<div class="invoice-line ${showPack ? '' : 'no-packing'}" data-line-id="${e(line.id)}">
    <div class="line-name"><span class="line-number">${index + 1}</span><label class="field"><span>Item description</span><input name="name" value="${e(displayName)}" list="item-options" autocomplete="off" placeholder="Search item or type description"></label><div class="history-hint" data-history="${e(line.id)}">${historyMarkup(state, line, editor.draft.partyId, editor.kind)}</div></div>
    ${field('Brand', 'colour', line.colour || '')}
    ${showPack ? `<label class="field"><span>Packing</span><select name="packType">${options(['', 'Box', 'Bag', 'Parcel', 'Packet', 'Carton'], line.packType)}</select></label>${field('Packs', 'packCount', line.packCount, 'type="number" min="0" step="any" inputmode="decimal"')}` : ''}
    <div class="quantity-cell">${field(`Qty (${line.unit || 'Pcs'})`, 'qty', line.qty, 'type="number" min="0.001" step="any" inputmode="decimal"')}<small class="line-unit">${e(line.unit || 'Pcs')}</small></div>
    ${field('Rate / unit', 'rate', line.rate, 'type="number" min="0" step="0.01" inputmode="decimal"')}
    <div class="line-amount"><span>Amount</span><strong data-line-total="${e(line.id)}">${currency(Number(line.qty || 0) * Number(line.rate || 0))}</strong></div>
    <div class="line-controls"><details class="line-menu"><summary>Actions</summary><div>${button('Move up', 'move-line', `data-line="${e(line.id)}" data-step="-1"`, 'subtle')}${button('Move down', 'move-line', `data-line="${e(line.id)}" data-step="1"`, 'subtle')}${button('Remove item', 'remove-line', `data-line="${e(line.id)}"`, 'subtle danger')}</div></details></div>
  </div>`;
}
export function renderEditor(editor, state) {
  const draft = editor.draft, sale = editor.kind === 'invoices';
  const party = state.parties.find(p => p.id === draft.partyId);
  const partyName = party ? partyChoice(party) : draft.partyName;
  const validFields = state.settings.customFields || [];
  const packing = state.settings.modules?.packing !== false;
  return `${pageHead(draft.id ? `Edit ${sale ? draft.invoiceNo : draft.billNo}` : sale ? 'Sale invoice' : 'Purchase bill', sale ? 'Create a sale and collect payment.' : 'Record your supplier bill.', button('Back to list', 'navigate', `data-page="${sale ? 'sales' : 'purchases'}"`, 'subtle'))}
  <form id="invoice-form" class="editor" novalidate>
    <section class="card"><div class="section-title"><h2>${sale ? 'Customer & invoice' : 'Supplier & bill'}</h2><span class="badge neutral">${draft.id ? 'Editing saved bill' : 'Draft on this device'}</span></div>
      <div class="form-grid invoice-meta"><label class="field span-2"><span>${sale ? 'Customer / party' : 'Supplier / party'}</span><input name="partyName" value="${e(partyName)}" list="party-options" autocomplete="off" placeholder="Search party or enter Cash" required></label>
      ${sale ? field('Invoice number', draft.isManual && !draft.id ? 'invoiceNo' : '_number', draft.invoiceNo || (draft.isManual ? '' : nextInvoiceNumber(state).number), draft.isManual && !draft.id ? 'placeholder="Blank = automatic"' : 'readonly') : field('Supplier bill number', 'billNo', draft.billNo, 'placeholder="Optional"')}
      ${field('Bill date', 'date', draft.date, 'type="date" required')}
      ${sale ? field('Due date', 'due', draft.due, 'type="date"') : ''}
      ${sale ? `<label class="field"><span>Dispatch / status</span><select name="dispatchStatus">${options(['pending', 'dispatched', 'draft'], draft.dispatchStatus)}</select></label>` : ''}
      <label class="field"><span>Entry mode</span><select name="isManual">${options(['Item-wise', 'Amount only'], draft.isManual ? 'Amount only' : 'Item-wise')}</select></label>
      </div><div class="party-strip"><p class="party-context muted" id="party-context"></p>${button('View ledger', 'party-ledger', 'id="editor-party-ledger" hidden', 'subtle')}</div>
    </section>
    <section class="card"><div class="section-title"><h2>${draft.isManual ? 'Bill amount' : 'Items'}</h2>${!draft.isManual ? button('Add item', 'add-line', '', 'secondary') : '<span class="muted tiny">For previous bills and supplier totals</span>'}</div>
      ${draft.isManual ? field('Total amount', 'total', draft.total || '', 'type="number" min="0.01" step="0.01" inputmode="decimal" required') : `<div class="invoice-grid"><div class="invoice-columns ${packing ? '' : 'no-packing'}" aria-hidden="true"><span>Item description</span><span>Brand</span>${packing ? '<span>Packing</span><span>Packs</span>' : ''}<span>Qty</span><span>Rate / unit</span><span>Amount</span><span>Actions</span></div><div id="invoice-lines">${draft.items.map((line, index) => lineMarkup(editor, state, line, index)).join('')}</div></div>${button('+ Add item', 'add-line', '', 'subtle')}`}
    </section>
    <section class="card"><div class="section-title"><h2>Payment & totals</h2><span class="muted tiny">Amounts in INR</span></div><div class="invoice-payment"><div><div class="form-grid">
      ${!draft.isManual ? field('Discount (₹)', 'discount', draft.discount || 0, 'type="number" min="0" step="0.01" inputmode="decimal"') : ''}
      ${!draft.isManual && state.settings.modules?.gst !== false ? field('Bill-level tax (%)', 'taxPct', draft.taxPct || 0, 'type="number" min="0" max="100" step="0.01" inputmode="decimal"') : ''}
      ${draft.id ? field(sale ? 'Already received' : 'Already paid', '_paid', draft.paid, 'readonly') : field(sale ? 'Amount received' : 'Amount paid', 'initialPaid', draft.initialPaid || 0, 'type="number" min="0" step="0.01" inputmode="decimal"')}
      <label class="field"><span>Payment mode</span><select name="paymentType">${options(paymentModes, draft.paymentType || draft.payType || 'Cash')}</select></label>
      </div><details class="invoice-extra" ${draft.notes || validFields.length || !sale ? 'open' : ''}><summary>Notes & additional details</summary><div class="form-grid">${validFields.map(cf => field(cf.label, `custom:${cf.id}`, draft.customFieldValues?.[cf.id] || '', `type="${['text', 'number', 'date'].includes(cf.type) ? cf.type : 'text'}"`)).join('')}<label class="field span-2"><span>Notes</span><textarea name="notes" rows="2">${e(draft.notes)}</textarea></label>${!sale ? '<label class="field span-2"><span>Bill photo (optional, max 1 MB)</span><input type="file" name="attachment" accept="image/png,image/jpeg,image/webp"></label><div id="attachment-status" class="muted tiny"></div>' : ''}</div></details>${draft.id ? '<p class="muted tiny">Existing payments are preserved. Record or reverse payments from the bill details.</p>' : ''}</div>
    <div class="summary" id="invoice-summary"></div></div><p class="form-error" id="invoice-error" role="alert"></p></section>
    <footer class="save-bar"><div><small id="draft-status">Draft kept on this device</small><strong id="save-total"></strong></div><div class="actions">${button('Clear draft', 'reset-editor', '', 'subtle')}<button type="submit" class="button secondary" data-print="true">Save & print</button><button type="submit" class="button primary">${draft.id ? 'Save changes' : sale ? 'Save invoice' : 'Save purchase'}</button></div></footer>
  </form><datalist id="party-options">${state.parties.filter(p => !p.deletedAt).map(p => `<option value="${e(partyChoice(p))}">${e(p.name)}</option>`).join('')}<option value="Cash"></datalist><datalist id="item-options">${state.items.filter(i => !i.deletedAt).map(i => `<option value="${e(itemChoice(i))}">${e(i.name)} · ${currency(sale ? i.saleRate : i.purchaseRate)} / ${e(i.unit || 'Pcs')}</option>`).join('')}</datalist>`;
}
export function updateEditorView(editor, state) {
  const draft = editor.draft;
  const party = state.parties.find(p => p.id === draft.partyId);
  const context = document.getElementById('party-context');
  const balance = party ? partyBalance(state, party) : 0;
  if (context) context.textContent = party ? `${party.phone || 'No phone saved'} · ${balance >= 0 ? 'To collect' : 'To pay'} ${currency(Math.abs(balance))}${party.gstin ? ` · GSTIN ${party.gstin}` : ''}` : 'Choose a saved party to see their balance and last prices.';
  const ledger = document.getElementById('editor-party-ledger'); if (ledger) { ledger.hidden = !party; ledger.dataset.id = party?.id || ''; }
  let totals;
  try { totals = draft.isManual ? { subtotal: Number(draft.total || 0), discount: 0, taxAmt: 0, total: Number(draft.total || 0) } : calculate(draft.items.filter(line => line.name), draft.discount, draft.taxPct); }
  catch (error) { document.getElementById('invoice-error').textContent = error.message; return; }
  document.getElementById('invoice-error').textContent = '';
  const paid = draft.id ? Number(draft.paid || 0) : Number(draft.initialPaid || 0);
  document.getElementById('invoice-summary').innerHTML = `<div><span>Subtotal</span><strong>${currency(totals.subtotal)}</strong></div><div><span>Discount</span><strong>${currency(totals.discount)}</strong></div><div><span>Tax</span><strong>${currency(totals.taxAmt)}</strong></div><div class="total"><span>Total</span><strong>${currency(totals.total)}</strong></div><div><span>Balance due</span><strong>${currency(Math.max(0, totals.total - paid))}</strong></div>`;
  document.getElementById('save-total').textContent = currency(totals.total);
  for (const line of draft.items) {
    const total = document.querySelector(`[data-line-total="${CSS.escape(line.id)}"]`);
    if (total) total.textContent = currency(Number(line.qty || 0) * Number(line.rate || 0));
    const hint = document.querySelector(`[data-history="${CSS.escape(line.id)}"]`);
    if (hint) hint.innerHTML = historyMarkup(state, line, draft.partyId, editor.kind);
  }
}
export function editorChange(editor, state, target) {
  const row = target.closest('[data-line-id]');
  if (row) {
    const line = editor.draft.items.find(item => item.id === row.dataset.lineId);
    if (target.name === 'name') {
      const item = state.items.find(item => !item.deletedAt && itemChoice(item) === target.value);
      line.name = item?.name || target.value; line.itemId = item?.id || '';
      if (item) {
        line.unit = item.unit || 'Pcs'; line.colour = item.colour || item.brand || ''; line.hsn = item.hsn || ''; line.rate = Number(editor.kind === 'invoices' ? item.saleRate || 0 : item.purchaseRate || 0);
        row.querySelector('[name="rate"]').value = line.rate;
        row.querySelector('[name="colour"]').value = line.colour;
        row.querySelector('[name="qty"]').previousElementSibling.textContent = `Qty (${line.unit})`;
        row.querySelector('.line-unit').textContent = line.unit;
      }
    } else line[target.name] = ['qty', 'rate'].includes(target.name) ? Number(target.value) : target.value;
  } else if (target.name === 'partyName') Object.assign(editor.draft, resolveParty(state, target.value));
  else if (target.name.startsWith('custom:')) { editor.draft.customFieldValues ||= {}; editor.draft.customFieldValues[target.name.slice(7)] = target.value; }
  else if (target.name === 'isManual') editor.draft.isManual = target.value === 'Amount only';
  else if (target.name && !['attachment', '_paid'].includes(target.name)) editor.draft[target.name] = target.value;
  rememberEditor(editor);
}
export function renderBulk(kind, state) {
  return `${pageHead(kind === 'invoices' ? 'Add previous sales' : 'Bulk purchase bills', 'Record several historical bills for one party in a single save.', button('Back', 'navigate', `data-page="${kind === 'invoices' ? 'sales' : 'purchases'}"`, 'subtle'))}<form id="bulk-form" data-kind="${kind}"><section class="card"><div class="form-grid"><label class="field span-2"><span>Party</span><select name="partyId" required><option value="">Choose a party</option>${state.parties.filter(p => !p.deletedAt).map(p => `<option value="${e(p.id)}">${e(p.name)}</option>`).join('')}</select></label><label class="field"><span>Payment mode</span><select name="paymentType">${options(paymentModes, 'Cash')}</select></label></div><div id="bulk-rows">${[0, 1, 2].map(() => bulkRow()).join('')}</div>${button('Add bill row', 'add-bulk-row', '', 'subtle')}<p class="form-error" role="alert" id="bulk-error"></p><div class="actions"><button type="submit" class="button primary">Save all bills</button></div></section></form>`;
}
export function bulkRow() {
  return `<div class="bulk-row">${field('Date', 'date', today(), 'type="date"')}${field('Bill number', 'number', '', 'placeholder="Optional"')}${field('Total', 'total', '', 'type="number" min="0.01" step="0.01" inputmode="decimal"')}${field('Paid', 'initialPaid', 0, 'type="number" min="0" step="0.01" inputmode="decimal"')}${field('Notes', 'notes')}${button('Remove', 'remove-bulk-row', '', 'subtle danger')}</div>`;
}
