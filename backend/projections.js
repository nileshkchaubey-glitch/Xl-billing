// Sheets is a reporting projection. The database remains the billing source.
export function sheetsProjection(data, revision) {
  const table = (rows, columns) => [columns, ...rows.map(row => columns.map(column => row[column] ?? ''))];
  const lines = [], payments = [];
  for (const [kind, docs] of [['Sale', data.invoices], ['Purchase', data.purchases]]) {
    for (const doc of docs) {
      const reference = doc.invoiceNo || doc.billNo || '';
      for (const line of doc.items || []) lines.push({ ...line, kind, reference, documentId: doc.id, date: doc.date });
      for (const payment of doc.payments || []) payments.push({ ...payment, kind, reference, documentId: doc.id, partyId: doc.partyId, cancelled: doc.status === 'cancelled' || doc.dispatchStatus === 'cancelled' });
    }
  }
  return {
    Items: table(data.items, ['id','name','unit','sku','colour','hsn','saleRate','purchaseRate','gst','deletedAt']),
    Parties: table(data.parties, ['id','name','phone','address','type','gstin','openingBal','deletedAt']),
    Sales: table(data.invoices, ['id','invoiceNo','date','due','partyId','partyName','subtotal','discount','taxPct','taxAmt','total','paid','balance','status','dispatchStatus','notes']),
    Purchases: table(data.purchases, ['id','billNo','date','partyId','partyName','total','paid','balance','status','notes']),
    Lines: table(lines, ['documentId','kind','reference','date','itemId','name','unit','colour','qty','rate','amt','packType','packCount']),
    Payments: table(payments, ['id','documentId','kind','reference','partyId','date','amt','mode','note','cancelled','voidedAt']),
    Retail: table(data.retail, ['id','date','amount','notes','deletedAt']),
    OpeningPayments: table(data.openingPayments, ['id','partyId','date','amt','direction','mode','note','voidedAt']),
    Audit: table(data.audit, ['id','type','entityType','entityId','label','details','ts','user']),
    Snapshot: [['revision','exportedAt'], [revision, new Date().toISOString()]]
  };
}
export function cell(value) {
  // Typed literal cells prevent user-entered text being interpreted as a formula.
  if (typeof value === 'number' && Number.isFinite(value)) return { userEnteredValue: { numberValue: value } };
  if (typeof value === 'boolean') return { userEnteredValue: { boolValue: value } };
  return { userEnteredValue: { stringValue: typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '') } };
}
export function sheetRequests(projection, existingSheets) {
  const requests = [], reservedIds = new Set(existingSheets.map(s => s.properties.sheetId));
  let candidate = 1000;
  for (const [title, rows] of Object.entries(projection)) {
    let properties = existingSheets.find(sheet => sheet.properties.title === title)?.properties;
    if (!properties) {
      while (reservedIds.has(candidate)) candidate++;
      properties = { sheetId: candidate++, title, gridProperties: { rowCount: Math.max(rows.length, 100), columnCount: rows[0].length, frozenRowCount: 1 } };
      reservedIds.add(properties.sheetId); requests.push({ addSheet: { properties } });
    } else if (rows.length > properties.gridProperties.rowCount || rows[0].length > properties.gridProperties.columnCount) {
      requests.push({ updateSheetProperties: { properties: { sheetId: properties.sheetId, gridProperties: { rowCount: Math.max(rows.length, properties.gridProperties.rowCount), columnCount: Math.max(rows[0].length, properties.gridProperties.columnCount) } }, fields: 'gridProperties.rowCount,gridProperties.columnCount' } });
    }
    requests.push({ updateCells: { range: { sheetId: properties.sheetId }, rows: rows.map(values => ({ values: values.map(cell) })), fields: 'userEnteredValue' } });
  }
  return requests;
}
