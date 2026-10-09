import { normalizeState, cleanSettings, transactions, today, uid, key } from './domain.js';
export function download(content, filename, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function backupObject(state) {
  const data = normalizeState(state); data.settings = cleanSettings(data.settings);
  return { schemaVersion: 2, exportedAt: new Date().toISOString(), data };
}
export function exportBackup(state) { download(JSON.stringify(backupObject(state), null, 2), `xl-billing-backup-${today()}.json`); }
export function csvCell(value) {
  let text = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
  if (typeof value === 'string' && /^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function makeCSV(rows, headers) { return '\uFEFF' + [headers.map(csvCell).join(','), ...rows.map(row => headers.map(header => csvCell(row[header])).join(','))].join('\r\n'); }
export function exportCSV(state, type) {
  let rows = state[type], headers;
  if (type === 'transactions') { rows = transactions(state); headers = ['date', 'type', 'partyName', 'reference', 'amount', 'balance', 'mode', 'note', 'cancelled']; }
  else if (type === 'items') headers = ['id', 'name', 'unit', 'saleRate', 'purchaseRate', 'gst', 'hsn', 'colour', 'sku'];
  else if (type === 'parties') headers = ['id', 'name', 'phone', 'type', 'address', 'gstin', 'openingBal'];
  else if (type === 'invoices') headers = ['id', 'invoiceNo', 'date', 'partyId', 'partyName', 'subtotal', 'discount', 'taxPct', 'taxAmt', 'total', 'paid', 'balance', 'dispatchStatus', 'status', 'notes'];
  else if (type === 'purchases') headers = ['id', 'billNo', 'date', 'partyId', 'partyName', 'total', 'paid', 'balance', 'status', 'notes'];
  else throw new Error('Unsupported export type.');
  download(makeCSV(rows, headers), `xl-billing-${type}-${today()}.csv`, 'text/csv;charset=utf-8');
}
export function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '');
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else if (quoted) quoted = false;
      else if (!cell) quoted = true;
      else throw new Error('Invalid CSV quoting.');
    } else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) { row.push(cell); rows.push(row); row = []; cell = ''; if (char === '\r' && text[i + 1] === '\n') i++; }
    else cell += char;
  }
  if (quoted) throw new Error('CSV contains an unclosed quote.');
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = rows.shift()?.map(value => value.trim().toLowerCase());
  if (!headers?.length || !headers.includes('name')) throw new Error('CSV must contain a name column.');
  if (new Set(headers).size !== headers.length) throw new Error('CSV has duplicate column headings.');
  return rows.filter(row => row.some(value => value.trim())).map((row, index) => {
    if (row.length !== headers.length) throw new Error(`CSV row ${index + 2} has the wrong number of columns.`);
    return Object.fromEntries(headers.map((header, i) => [header, row[i]]));
  });
}
export function masterImportCommands(state, kind, text, commandId = uid()) {
  if (!['items', 'parties'].includes(kind)) throw new Error('Choose items or parties.');
  const rows = parseCSV(text); if (!rows.length || rows.length > 500) throw new Error('Import between 1 and 500 records per file.');
  const names = new Set();
  return rows.map((row, index) => {
    if (!row.name.trim() || names.has(key(row.name))) throw new Error(`Missing or duplicate name at row ${index + 2}.`);
    names.add(key(row.name));
    const existing = row.id ? state[kind].find(record => record.id === row.id && !record.deletedAt) : null;
    if (row.id && !existing) throw new Error(`Unknown ID at row ${index + 2}. Remove the ID to add a new record.`);
    const payload = kind === 'items' ? { name: row.name, unit: row.unit || 'Pcs', saleRate: row.salerate || 0, purchaseRate: row.purchaserate || 0, gst: row.gst || 0, hsn: row.hsn || '', colour: row.colour || row.brand || '', sku: row.sku || '' } : { name: row.name, phone: row.phone || '', type: row.type || 'both', address: row.address || '', gstin: row.gstin || '', openingBal: row.openingbal || 0 };
    if (existing) Object.assign(payload, { id: existing.id, expectedUpdatedAt: existing.updatedAt });
    return { id: `${commandId}-${index}`, at: new Date().toISOString(), type: 'save-master', collection: kind, payload };
  });
}
