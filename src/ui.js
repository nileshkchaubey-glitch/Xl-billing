export const e = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export const currency = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(Number(value || 0));
export const dateLabel = value => { if (!value) return '—'; const [y, m, d] = value.split('-'); return `${d}/${m}/${y}`; };
export const options = (values, selected) => values.map(value => `<option value="${e(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${e(value)}</option>`).join('');
export function field(label, name, value = '', attributes = '') {
  return `<label class="field"><span>${e(label)}</span><input name="${e(name)}" value="${e(value)}" ${attributes}></label>`;
}
export function empty(title, text = '', action = '') {
  return `<div class="empty"><div class="empty-mark">XL</div><h3>${e(title)}</h3><p>${e(text)}</p>${action}</div>`;
}
export function toast(message, bad = false) {
  const element = document.getElementById('toast');
  element.textContent = message; element.className = `toast visible ${bad ? 'bad' : ''}`;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => element.classList.remove('visible'), 5000);
}
export function openDialog(title, body, wide = false) {
  const dialog = document.getElementById('dialog');
  dialog.className = wide ? 'dialog wide' : 'dialog';
  dialog.innerHTML = `<header class="dialog-head"><div><small>XL BILLING</small><h2>${e(title)}</h2></div><button class="button subtle" data-action="close-dialog" aria-label="Close dialog">Close</button></header><div class="dialog-body">${body}</div>`;
  if (!dialog.open) dialog.showModal();
  return dialog;
}
export function button(label, action, attributes = '', style = '') { return `<button type="button" class="button ${style}" data-action="${e(action)}" ${attributes}>${e(label)}</button>`; }
export function badge(record) {
  const status = record.status === 'cancelled' || record.dispatchStatus === 'cancelled' ? 'Cancelled' : record.dispatchStatus === 'draft' ? 'Draft' : Number(record.balance) > 0 ? 'Unpaid' : 'Paid';
  return `<span class="badge ${status.toLowerCase()}">${status}</span>`;
}
export function pageHead(title, subtitle, actions = '') { return `<div class="page-head"><div><div class="eyebrow">YOUR BUSINESS, IN ORDER</div><h1>${e(title)}</h1><p>${e(subtitle)}</p></div><div class="actions">${actions}</div></div>`; }
export const dataObject = form => Object.fromEntries(new FormData(form).entries());
