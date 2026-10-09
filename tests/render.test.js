import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, sale } from './helpers.js';
import { renderDashboard, renderDocuments, renderMasters, renderTransactions, renderReports, renderAudit, renderRetail } from '../src/features/lists.js';
import { renderEditor } from '../src/features/invoice.js';
import { masterForm, documentDetail, partyLedger, paymentForm } from '../src/features/dialogs.js';
import { invoicePrintMarkup } from '../src/print.js';
import { renderSettings, renderData } from '../src/features/settings.js';
import { sheetsProjection, sheetRequests, cell } from '../backend/functions/xl-billing-google/projections.js';

test('all main screen and dialog renderers safely escape record text and emit no inline handlers', () => {
  let state = fixture(); const payload = '<img src=x onerror=alert(1)>';
  state.parties[0].name = payload; state.items[0].name = payload; state.settings.shopName = payload;
  state = sale(state, { partyName: payload, items: [{ itemId: 'item', name: payload, qty: 1, rate: 10 }], notes: payload });
  const outputs = [renderDashboard(state), renderDocuments(state, 'invoices', {}), renderMasters(state, 'parties', {}), renderMasters(state, 'items', {}), renderTransactions(state, {}), renderReports(state, {}), renderAudit(state, {}), renderRetail(state, {}), masterForm(state, 'parties', 'customer'), documentDetail(state, 'invoices', state.invoices[0].id), partyLedger(state, 'customer'), paymentForm(state, 'in', 'customer'), invoicePrintMarkup(state, 'invoices', state.invoices[0].id), renderSettings(state), renderData({ data: state, envelope: { revision: 1 } }, { connected: false })];
  const editor = { kind: 'invoices', draft: { ...state.invoices[0], initialPaid: 0 }, draftKey: 'test' }; outputs.push(renderEditor(editor, state));
  for (const output of outputs) { assert.doesNotMatch(output, /<img src=x|\son(?:click|input|change)=/i); assert.match(output, /data-action=|form|card|printed-invoice/); }
});
test('spreadsheet export includes payment reversals, cancellation and activity; literal cells never become formulas', () => {
  const state = sale(fixture(), { initialPaid: 10 }); state.invoices[0].payments[0].voidedAt = '2026-10-09';
  const projection = sheetsProjection(state, 7);
  assert.ok(projection.Payments[0].includes('voidedAt')); assert.equal(projection.Snapshot[1][0], 7);
  assert.equal(cell('=IMPORTXML("bad")').userEnteredValue.stringValue, '=IMPORTXML("bad")');
  assert.equal(cell(10).userEnteredValue.numberValue, 10);
});
test('spreadsheet updates clear stale rows inside one batch and preserve unrelated tabs', () => {
  const requests = sheetRequests({ Items: [['name'],['New']] }, [{ properties: { title: 'Items', sheetId: 1, gridProperties: { rowCount: 100, columnCount: 10 } } }, { properties: { title: 'Personal', sheetId: 2 } }]);
  assert.equal(requests.length, 1); assert.deepEqual(requests[0].updateCells.range, { sheetId: 1 });
  assert.equal(requests[0].updateCells.fields, 'userEnteredValue');
});
