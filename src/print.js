import { e, currency, dateLabel } from './ui.js';
export function invoicePrintMarkup(state, kind, id) {
  const doc = state[kind].find(row => row.id === id);
  if (!doc) throw new Error('Bill not found.');
  const settings = state.settings, print = settings.printSettings || {};
  const party = doc.partySnapshot || state.parties.find(row => row.id === doc.partyId) || {};
  return `<article class="printed-invoice ${print.paper === '80mm' ? 'thermal' : ''}"><header><div><h1>${e(settings.shopName)}</h1><p>${e(settings.address)}</p><p>${e(settings.phone)}${settings.gstin ? ` · GSTIN ${e(settings.gstin)}` : ''}</p></div><div><h2>${kind === 'invoices' ? 'SALE INVOICE' : 'PURCHASE RECORD'}</h2><strong>${e(doc.invoiceNo || doc.billNo)}</strong><p>Date: ${dateLabel(doc.date)}</p>${doc.due ? `<p>Due: ${dateLabel(doc.due)}</p>` : ''}</div></header><section><h3>${kind === 'invoices' ? 'Bill to' : 'Supplier'}: ${e(doc.partyName)}</h3>${party.address ? `<p>${e(party.address)}</p>` : ''}${party.phone ? `<p>${e(party.phone)}</p>` : ''}${party.gstin ? `<p>GSTIN ${e(party.gstin)}</p>` : ''}${doc.status === 'cancelled' || doc.dispatchStatus === 'cancelled' ? '<h2>CANCELLED</h2>' : ''}${Object.entries(doc.customFieldValues || {}).map(([key, value]) => `<p>${e((settings.customFields || []).find(cf => cf.id === key)?.label || key)}: ${e(value)}</p>`).join('')}</section><table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${(doc.items || []).map(line => `<tr><td>${e(line.name)}${line.hsn ? `<small>HSN ${e(line.hsn)}</small>` : ''}${print.showBrand !== false && line.colour ? `<small>${e(line.colour)}</small>` : ''}${print.showPacking !== false && line.packType ? `<small>${e(line.packCount || '')} ${e(line.packType)}</small>` : ''}</td><td>${e(line.qty)} ${e(line.unit)}</td><td>${currency(line.rate)}</td><td>${currency(line.amt)}</td></tr>`).join('') || `<tr><td colspan="3">Amount-only bill</td><td>${currency(doc.total)}</td></tr>`}</tbody></table><div class="print-totals"><p>Subtotal <strong>${currency(doc.subtotal ?? doc.total)}</strong></p><p>Discount <strong>${currency(doc.discount)}</strong></p><p>Tax (${Number(doc.taxPct || 0)}%) <strong>${currency(doc.taxAmt)}</strong></p><p class="grand">Total <strong>${currency(doc.total)}</strong></p><p>Paid / adjusted <strong>${currency(doc.paid)}</strong></p><p>Balance <strong>${currency(doc.balance)}</strong></p></div>${doc.notes ? `<p>${e(doc.notes)}</p>` : ''}${print.showBank !== false && settings.bank ? `<section><h3>Payment details</h3><p>${e(settings.bank)}</p></section>` : ''}${print.showTerms !== false && settings.terms ? `<section><h3>Terms</h3><p>${e(settings.terms)}</p></section>` : ''}</article>`;
}
export function printDocument(state, kind, id) {
  const area = document.getElementById('print-area');
  area.innerHTML = invoicePrintMarkup(state, kind, id);
  document.body.classList.add('printing');
  const cleanup = () => { document.body.classList.remove('printing'); area.replaceChildren(); };
  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
}
