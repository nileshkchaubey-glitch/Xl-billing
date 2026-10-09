import { BillingStore } from './storage.js';
import { CloudClient } from './cloud.js';
import { uid, today, cents, fifo, outstanding, clone, normalizeState } from './domain.js';
import { e, currency, dataObject, toast, openDialog, button } from './ui.js';
import { createEditor, renderEditor, updateEditorView, editorChange, rememberEditor, newLine, renderBulk, bulkRow } from './features/invoice.js';
import { renderDashboard, renderDocuments, renderMasters, renderTransactions, renderRetail, renderReports, renderAudit } from './features/lists.js';
import { masterForm, documentDetail, partyLedger, renderPriceHistory, paymentForm, allocationMarkup, openingPaymentForm } from './features/dialogs.js';
import { renderSettings, renderData, customFieldRow } from './features/settings.js';
import { download, exportBackup, exportCSV, masterImportCommands } from './export.js';
import { printDocument } from './print.js';

const navigation = [
  ['YOUR WORKSPACE', [['dashboard', 'Overview'], ['parties', 'Parties'], ['items', 'Items']]],
  ['SALES', [['sales', 'Sale invoices'], ['payment-in', 'Payment in'], ['retail', 'Retail sales']]],
  ['PURCHASES', [['purchases', 'Purchase bills'], ['payment-out', 'Payment out']]],
  ['BUSINESS', [['transactions', 'Transactions'], ['reports', 'Reports'], ['audit', 'Activity log'], ['data', 'Data & sync'], ['settings', 'Settings']]]
];
const titles = Object.fromEntries(navigation.flatMap(([, links]) => links));
let cloud, store, page = 'dashboard', editor = null, filter = {}, reviewedImport = null;
const view = document.getElementById('view');
const dialog = document.getElementById('dialog');
const closeDialog = () => { if (dialog.open) dialog.close(); };

function renderNavigation() {
  document.getElementById('desktop-navigation').innerHTML = navigation.map(([label, links]) => `<div class="nav-group"><small>${label}</small>${links.filter(([name]) => name !== 'retail' || store.data.settings.modules?.retail !== false).map(([name, text]) => `<a href="#${name}" ${page === name ? 'aria-current="page"' : ''}>${text}</a>`).join('')}</div>`).join('');
  document.getElementById('mobile-navigation').innerHTML = [['dashboard', 'Home'], ['sales', 'Sales'], ['parties', 'Parties'], ['items', 'Items']].map(([name, text]) => `<a href="#${name}" ${page === name ? 'aria-current="page"' : ''}>${text}</a>`).join('') + '<button type="button" data-action="toggle-menu" aria-controls="sidebar">More</button>';
  document.getElementById('business-name').textContent = store.data.settings.shopName;
  document.getElementById('business-owner').textContent = store.data.settings.owner || 'Owner workspace';
  document.getElementById('section-name').textContent = titles[page] || (page.includes('purchase') ? 'Purchase entry' : 'Sale entry');
  document.title = `${store.data.settings.shopName} · XL Billing`;
  renderStatus();
}
function renderStatus() {
  const text = { local: 'On this device', syncing: 'Saving to cloud…', synced: 'Cloud connected', pending: 'Save pending', error: 'Connection needs attention' }[store.status] || 'On this device';
  document.getElementById('sync-status').textContent = text;
  document.getElementById('sync-status').className = `sync-pill ${store.status}`;
  document.getElementById('sidebar-status').textContent = text;
  document.getElementById('sidebar-dot').className = `connection-dot ${store.status}`;
  const banner = document.getElementById('status-banner');
  banner.hidden = !['pending', 'error'].includes(store.status);
  banner.textContent = store.status === 'pending' ? `Your save is preserved and needs a retry in Data & Sync. ${store.error || ''}` : store.error || 'Open Data & Sync to reconnect.';
}
function renderPage() {
  const focused = document.activeElement;
  const focusId = focused?.id;
  const selection = focused && ['text', 'search'].includes(focused.type) ? [focused.selectionStart, focused.selectionEnd] : null;
  const state = store.data;
  if (editor) view.innerHTML = renderEditor(editor, state);
  else if (page === 'dashboard') view.innerHTML = renderDashboard(state);
  else if (page === 'sales' || page === 'purchases') view.innerHTML = renderDocuments(state, page === 'sales' ? 'invoices' : 'purchases', filter);
  else if (page === 'parties' || page === 'items') view.innerHTML = renderMasters(state, page, filter);
  else if (page === 'transactions' || page === 'payment-in' || page === 'payment-out') view.innerHTML = renderTransactions(state, filter, page === 'transactions' ? 'all' : page === 'payment-in' ? 'in' : 'out');
  else if (page === 'retail') view.innerHTML = renderRetail(state, filter);
  else if (page === 'reports') view.innerHTML = renderReports(state, filter);
  else if (page === 'audit') view.innerHTML = renderAudit(state, filter);
  else if (page === 'settings') view.innerHTML = renderSettings(state);
  else if (page === 'data') view.innerHTML = renderData(store, cloud);
  else if (page === 'bulk-sales' || page === 'bulk-purchases') view.innerHTML = renderBulk(page === 'bulk-sales' ? 'invoices' : 'purchases', state);
  renderNavigation();
  if (editor) updateEditorView(editor, state);
  if (focusId) {
    const restored = document.getElementById(focusId);
    if (restored) { restored.focus({ preventScroll: true }); if (selection && restored.setSelectionRange) restored.setSelectionRange(...selection); }
  }
}
function navigate(next) {
  if (![...Object.keys(titles), 'new-sale', 'new-purchase', 'bulk-sales', 'bulk-purchases'].includes(next)) next = 'dashboard';
  closeDialog();
  editor = next === 'new-sale' || next === 'new-purchase' ? createEditor(store, next === 'new-sale' ? 'invoices' : 'purchases') : null;
  filter = {}; page = next;
  if (location.hash !== `#${next}`) history.pushState(null, '', `#${next}`);
  document.getElementById('app-shell').classList.remove('menu-open');
  document.querySelector('.mobile-menu').setAttribute('aria-expanded', 'false');
  renderPage(); view.focus({ preventScroll: true }); window.scrollTo(0, 0);
}
function editDocument(kind, id) {
  closeDialog(); editor = createEditor(store, kind, id); page = kind === 'invoices' ? 'new-sale' : 'new-purchase';
  history.pushState(null, '', `#${page}`); renderPage(); window.scrollTo(0, 0);
}
function viewDocument(kind, id) {
  const row = store.data[kind].find(row => row.id === id);
  openDialog(row?.invoiceNo || row?.billNo || 'Bill details', documentDetail(store.data, kind, id), true);
}
function openPayment(direction, partyId = '', documentId = '') {
  openDialog(direction === 'out' ? 'Payment out' : 'Payment in', paymentForm(store.data, direction, partyId, documentId), true);
  refreshAllocation();
}
function refreshAllocation() {
  const form = document.getElementById('payment-form'); if (!form) return;
  document.getElementById('allocation-bills').innerHTML = allocationMarkup(store.data, form.dataset.direction, form.elements.partyId.value, form.dataset.document);
  allocationSummary();
}
function allocationSummary() {
  const form = document.getElementById('payment-form'); if (!form) return;
  const allocated = [...form.querySelectorAll('[name^="allocate:"]')].reduce((sum, input) => sum + cents(input.value), 0);
  const amount = cents(form.elements.amount.value);
  document.getElementById('allocation-summary').textContent = `Allocated ${currency(allocated / 100)} · Unallocated ${currency((amount - allocated) / 100)}. Discount is applied to the oldest remaining balances.`;
}
function autoAllocate() {
  const form = document.getElementById('payment-form');
  const rows = outstanding(store.data, form.dataset.direction).filter(row => (row.partyId || '') === form.elements.partyId.value && (!form.dataset.document || row.id === form.dataset.document));
  const allocations = fifo(rows, form.elements.amount.value);
  for (const input of form.querySelectorAll('[name^="allocate:"]')) input.value = allocations.find(row => row.id === input.name.slice(9))?.amount || '';
  allocationSummary();
}
async function handleClick(target) {
  const action = target.dataset.action, kind = target.dataset.kind, id = target.dataset.id;
  if (action === 'navigate') navigate(target.dataset.page);
  else if (action === 'close-dialog') closeDialog();
  else if (action === 'toggle-menu') {
    const opened = document.getElementById('app-shell').classList.toggle('menu-open');
    document.querySelector('.mobile-menu').setAttribute('aria-expanded', String(opened));
  } else if (action === 'close-menu') { document.getElementById('app-shell').classList.remove('menu-open'); document.querySelector('.mobile-menu').setAttribute('aria-expanded', 'false'); }
  else if (action === 'view-document') viewDocument(kind, id);
  else if (action === 'edit-document') editDocument(kind, id);
  else if (action === 'print-document') { closeDialog(); printDocument(store.data, kind, id); }
  else if (action === 'open-payment') openPayment(target.dataset.direction || (kind === 'purchases' ? 'out' : 'in'), target.dataset.party || '', id || '');
  else if (action === 'auto-allocate') autoAllocate();
  else if (action === 'opening-payment') openDialog('Opening balance payment', openingPaymentForm(store.data, id));
  else if (action === 'document-status') {
    const doc = store.data[kind].find(row => row.id === id);
    if (target.dataset.status === 'cancelled' && !confirm('Cancel this bill? It will be excluded from dues and sales totals. Its history remains available.')) return;
    await store.execute('document-status', { status: target.dataset.status }, { collection: kind, recordId: id, expectedVersion: doc.version });
    viewDocument(kind, id); toast('Bill status updated.');
  } else if (action === 'void-payment') {
    if (!confirm('Reverse this payment? The original entry stays in history and the balance will be recalculated.')) return;
    await store.execute('void-payment', {}, { collection: kind, recordId: id, paymentId: target.dataset.payment, ...(kind !== 'openingPayments' ? { expectedVersion: store.data[kind].find(row => row.id === id).version } : {}) });
    if (kind === 'openingPayments') openDialog('Party ledger', partyLedger(store.data, id), true); else viewDocument(kind, id);
    toast('Payment reversed.');
  } else if (action === 'edit-master') openDialog(kind === 'parties' ? 'Party details' : 'Item details', masterForm(store.data, kind, id), true);
  else if (action === 'archive-master') {
    if (!confirm('Archive this record? You can restore it from the Archived list.')) return;
    await store.execute('archive', {}, { collection: kind, recordId: id }); toast('Record archived.');
  } else if (action === 'restore-master') { await store.execute('restore-master', {}, { collection: kind, recordId: id }); toast('Record restored.'); }
  else if (action === 'party-ledger') openDialog('Party ledger', partyLedger(store.data, id), true);
  else if (action === 'new-for-party') {
    const party = store.data.parties.find(row => row.id === id);
    navigate(kind === 'invoices' ? 'new-sale' : 'new-purchase');
    editor.draft.partyId = party.id; editor.draft.partyName = party.name; rememberEditor(editor); renderPage();
  } else if (action === 'add-line') { editor.draft.items.push(newLine()); rememberEditor(editor); renderPage(); document.querySelector('.invoice-line:last-child [name="name"]').focus(); }
  else if (action === 'remove-line') { editor.draft.items = editor.draft.items.filter(row => row.id !== target.dataset.line); if (!editor.draft.items.length) editor.draft.items.push(newLine()); rememberEditor(editor); renderPage(); }
  else if (action === 'move-line') {
    const from = editor.draft.items.findIndex(row => row.id === target.dataset.line), to = from + Number(target.dataset.step);
    if (to >= 0 && to < editor.draft.items.length) { const [line] = editor.draft.items.splice(from, 1); editor.draft.items.splice(to, 0, line); rememberEditor(editor); renderPage(); }
  } else if (action === 'price-history') openDialog('Last item prices', renderPriceHistory(store.data, editor, target.dataset.line));
  else if (action === 'use-price') { const row = editor.draft.items.find(row => row.id === target.dataset.line); row.rate = Number(target.dataset.rate); rememberEditor(editor); closeDialog(); renderPage(); }
  else if (action === 'reset-editor') {
    if (!confirm('Clear this unfinished draft? Saved bills are kept.')) return;
    localStorage.removeItem(editor.draftKey); editor = createEditor(store, editor.kind); renderPage();
  } else if (action === 'add-bulk-row') document.getElementById('bulk-rows').insertAdjacentHTML('beforeend', bulkRow());
  else if (action === 'remove-bulk-row') target.closest('.bulk-row').remove();
  else if (action === 'clear-filter') { filter = {}; renderPage(); }
  else if (action === 'page-list') { filter.page = Math.max(1, (filter.page || 1) + Number(target.dataset.step)); renderPage(); }
  else if (action === 'export-backup') exportBackup(store.data);
  else if (action === 'export-csv') exportCSV(store.data, target.dataset.type);
  else if (action === 'add-custom-field') document.getElementById('custom-fields').insertAdjacentHTML('beforeend', customFieldRow({ id: uid(), label: '', type: 'text' }));
  else if (action === 'remove-custom-field') target.closest('.custom-row').remove();
  else if (action === 'refresh-cloud') { await store.refresh(); toast('Cloud data refreshed.'); renderPage(); }
  else if (action === 'retry-save') { await store.retry(); toast('Pending save completed.'); renderPage(); }
  else if (action === 'export-pending') download(JSON.stringify(store.pending, null, 2), `xl-billing-pending-${today()}.json`);
  else if (action === 'use-cloud') {
    if (!confirm('Use this account’s cloud data on this device? A full local backup will download first.')) return;
    exportBackup(store.data); await store.useCloud(); renderPage(); toast('Cloud workspace loaded.');
  } else if (action === 'logout-cloud') {
    await cloud.logout(); clearInterval(store.timer); store.markStatus('local'); renderPage();
  } else if (action === 'confirm-import') {
    if (!reviewedImport) return;
    exportBackup(store.data);
    if (reviewedImport.data) await store.execute('restore-backup', { data: reviewedImport.data });
    else await store.execute('batch', { commands: reviewedImport.commands });
    reviewedImport = null; closeDialog(); toast('Data imported. A backup of your previous data was downloaded.'); renderPage();
  } else if (action === 'google-export') {
    if (!cloud.connected) throw new Error('Sign in to your cloud account first.');
    target.disabled = true;
    try { const result = await cloud.request('/functions/v1/xl-billing-google', { method: 'POST', body: JSON.stringify({ action: target.dataset.type }) }); toast(result.message || 'Google export completed.'); }
    finally { target.disabled = false; }
  }
}

async function handleSubmit(form, submitter) {
  const input = dataObject(form);
  if (form.id === 'invoice-form') {
    const kind = editor.kind;
    const operationId = editor.draft.id;
    await store.execute('save-document', clone(editor.draft), { collection: kind });
    const saved = operationId ? store.data[kind].find(row => row.id === operationId) : store.data[kind].at(-1);
    localStorage.removeItem(editor.draftKey); editor.dirty = false;
    const print = submitter?.dataset.print === 'true'; navigate(kind === 'invoices' ? 'sales' : 'purchases');
    toast('Bill saved.'); if (print) printDocument(store.data, kind, saved.id);
  } else if (form.id === 'master-form') {
    await store.execute('save-master', { ...input, ...(form.dataset.id ? { id: form.dataset.id, expectedUpdatedAt: form.dataset.version || undefined } : {}) }, { collection: form.dataset.kind });
    closeDialog(); renderPage(); toast('Record saved.');
  } else if (form.id === 'payment-form') {
    const allocations = [...form.querySelectorAll('[name^="allocate:"]')].map(input => ({ id: input.name.slice(9), amount: Number(input.value || 0) })).filter(row => row.amount > 0);
    await store.execute('payment', { ...input, direction: form.dataset.direction, allocations }); closeDialog(); renderPage(); toast('Payment recorded.');
  } else if (form.id === 'opening-form') {
    await store.execute('opening-payment', { ...input, partyId: form.dataset.party, direction: form.dataset.direction }); closeDialog(); renderPage(); toast('Opening balance payment recorded.');
  } else if (form.id === 'retail-form') { await store.execute('retail', input); renderPage(); toast('Retail sale saved.'); }
  else if (form.id === 'settings-form') {
    const modules = Object.fromEntries(['packing', 'dispatch', 'retail', 'gst'].map(name => [name, form.elements[`module:${name}`].checked]));
    const printSettings = { ...store.data.settings.printSettings, paper: input['print:paper'], ...Object.fromEntries(['showPacking', 'showBrand', 'showBank', 'showTerms'].map(name => [name, form.elements[`print:${name}`].checked])) };
    const customFields = [...form.querySelectorAll('.custom-row')].map(row => ({ id: row.dataset.customId, label: row.querySelector('[name="label"]').value.trim(), type: row.querySelector('[name="type"]').value }));
    if (customFields.some(field => !field.label)) throw new Error('Custom fields need a label.');
    const payload = Object.fromEntries(['shopName', 'owner', 'address', 'phone', 'gstin', 'state', 'prefix', 'invNo', 'fy', 'bank', 'terms'].map(name => [name, input[name]]));
    await store.execute('settings', { ...payload, modules, printSettings, customFields, expectedUpdatedAt: form.dataset.version || undefined, expectedCounter: Number(form.dataset.counter) }); toast('Settings saved.'); renderPage();
  } else if (form.id === 'cloud-form') {
    cloud.configure(input.url, input.key);
    await cloud.login(input.email, input.password);
    form.elements.password.value = '';
    try { await store.connect(); toast('Cloud connected.'); }
    finally { renderPage(); }
  } else if (form.id === 'bulk-form') {
    const party = store.data.parties.find(row => row.id === input.partyId);
    if (!party) throw new Error('Select a party.');
    const collection = form.dataset.kind;
    const rows = [...form.querySelectorAll('.bulk-row')].map(row => Object.fromEntries([...row.querySelectorAll('input')].map(input => [input.name, input.value]))).filter(row => row.total !== '');
    await store.execute('bulk-documents', { partyId: party.id, partyName: party.name, rows: rows.map(row => ({ ...row, ...(collection === 'invoices' ? { invoiceNo: row.number } : { billNo: row.number }), paymentType: input.paymentType, dispatchStatus: 'dispatched' })) }, { collection });
    navigate(collection === 'invoices' ? 'sales' : 'purchases'); toast('Previous bills saved.');
  } else if (form.id === 'csv-form') {
    const file = form.elements.file.files[0]; if (!file || file.size > 5 * 1024 * 1024) throw new Error('Choose a CSV smaller than 5 MB.');
    const commands = masterImportCommands(store.data, input.kind, await file.text());
    reviewedImport = { commands };
    openDialog('Review CSV import', `<p class="info-strip">${commands.length} ${e(input.kind)} records will be added or updated. No bills are removed.</p><p>A backup will download before the import.</p><div class="dialog-actions">${button('Cancel', 'close-dialog', '', 'subtle')}${button('Import records', 'confirm-import', '', 'primary')}</div>`);
  }
}
function showError(error, form = null) {
  toast(error.message || 'Something went wrong.', true);
  const element = form?.querySelector('.form-error'); if (element) element.textContent = error.message;
}
document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]'); if (!target || target.disabled) return;
  event.preventDefault(); handleClick(target).catch(error => showError(error));
});
document.addEventListener('submit', async event => {
  event.preventDefault(); const form = event.target;
  if (!form.reportValidity()) return;
  const buttons = [...form.querySelectorAll('[type="submit"]')]; if (buttons.some(button => button.disabled)) return;
  buttons.forEach(button => { button.disabled = true; });
  try { await handleSubmit(form, event.submitter); } catch (error) { showError(error, form); }
  finally { buttons.forEach(button => { button.disabled = false; }); }
});
document.addEventListener('input', event => {
  try {
    const target = event.target;
    if (target.dataset.filter) { filter[target.dataset.filter] = target.value; filter.page = 1; clearTimeout(renderPage.timer); renderPage.timer = setTimeout(renderPage, 160); }
    else if (editor && target.closest('#invoice-form') && target.type !== 'file') { editorChange(editor, store.data, target); updateEditorView(editor, store.data); }
    else if (target.closest('#payment-form')) { if (target.name === 'amount') autoAllocate(); else allocationSummary(); }
  } catch (error) { showError(error); }
});
document.addEventListener('change', async event => {
  const target = event.target;
  try {
    if (target.id === 'backup-file') {
      const file = target.files[0]; target.value = ''; if (!file) return;
      if (file.size > 20 * 1024 * 1024) throw new Error('Choose a JSON backup smaller than 20 MB.');
      const source = JSON.parse(await file.text());
      const data = normalizeState(source.data || source);
      reviewedImport = { data };
      openDialog('Review backup restore', `<p class="info-strip">This replaces your current workspace with ${data.invoices.length} invoices, ${data.purchases.length} purchases, ${data.parties.length} parties and ${data.items.length} items.</p><p>The current workspace will download as a backup first. Original browser recovery data is retained.</p><div class="dialog-actions">${button('Cancel', 'close-dialog', '', 'subtle')}${button('Restore this backup', 'confirm-import', '', 'primary')}</div>`);
    } else if (target.id === 'payment-party') {
      const form = target.closest('form'); form.dataset.document = ''; form.elements.amount.value = ''; refreshAllocation();
    } else if (editor && target.closest('#invoice-form')) {
      if (target.name === 'attachment') {
        const file = target.files[0]; if (!file) return;
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) throw new Error('Use a PNG, JPEG or WebP image smaller than 1 MB.');
        editor.draft.photoData = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
        rememberEditor(editor); document.getElementById('attachment-status').textContent = `Attached: ${file.name}`;
      } else if (target.tagName === 'SELECT') {
        editorChange(editor, store.data, target);
        if (target.name === 'isManual') renderPage(); else updateEditorView(editor, store.data);
      }
    }
  } catch (error) { showError(error); }
});
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') { event.preventDefault(); navigate('new-sale'); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && editor && !dialog.open) { event.preventDefault(); document.getElementById('invoice-form').requestSubmit(); }
});
window.addEventListener('popstate', () => navigate(location.hash.slice(1)));
window.addEventListener('hashchange', () => { const next = location.hash.slice(1); if (next !== page) navigate(next); });

try {
  cloud = new CloudClient(); store = new BillingStore(localStorage, cloud); await store.initialize();
  store.addEventListener('change', () => { if (editor) { updateEditorView(editor, store.data); renderNavigation(); } else if (!['bulk-sales', 'bulk-purchases', 'settings'].includes(page)) renderPage(); });
  store.addEventListener('status', renderStatus);
  navigate(location.hash.slice(1) || 'dashboard');
  if (cloud.connected) store.connect().catch(error => showError(error));
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
} catch (error) {
  view.innerHTML = `<section class="card"><h1>Your data needs attention</h1><p class="form-error">${e(error.message)}</p><p>The app has not overwritten your saved records. Keep this browser’s data and restore a valid backup before continuing.</p></section>`;
}
