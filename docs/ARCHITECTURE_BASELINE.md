# Baseline architecture inventory

Generated from commit 29aeb20 using Acorn; every inline script is parsed. This is a syntactic inventory: closures and wrapper references still execute earlier definitions. The last assignment is the public entry point, not proof that earlier code is dead. Template examples in tutorial text may appear as handler candidates. Runtime crawl supplies additional evidence.

## Script blocks

| Block | HTML line | First source line |
| --- | --- | --- |
| 1 | 687 | // ═══════════════════════════════════ |
| 2 | 2047 | // ═══════════════════════════════════════════════════════ |
| 3 | 2647 | // ═══════════════════════════════════════════════════════ |
| 4 | 3196 | (function v6patch(){ |
| 5 | 3838 | // ═══ V6 BUG FIXES & IMPROVEMENTS ═══ |
| 6 | 4033 | // ═══ USER FIX: Party Area + Description Patch (First instance) ═══ |
| 7 | 4232 | (function v8(){ |
| 8 | 4914 | (function v9patch(){ |
| 9 | 5301 | (function v10(){ |
| 10 | 5788 | (function v11(){ |
| 11 | 6114 | (function v12fix(){ |
| 12 | 6316 | (function v13(){ |
| 13 | 7190 | (function v14(){ |
| 14 | 8183 | (function v15(){ |
| 15 | 9060 | (function v16(){ |
| 16 | 9863 | (function invoiceFastEntry(){ |

## Named functions and overrides

| Function | Last syntactic definition | Earlier definitions (still called by wrappers where applicable) |
| --- | --- | --- |
| _delPinCb | 8243 (window assignment) | — |
| acHighlight | 5834 (declaration) | — |
| acSetup | 5798 (declaration) | — |
| addCustomField | 1917 (declaration) | — |
| addDescriptionField | 4158 (declaration) | — |
| addPurItem | 1432 (declaration) | — |
| addSaleItem | 5094 (window assignment) | 903 |
| auditLog | 8193 (declaration) | — |
| buildLedger | 9719 (declaration) | 1772 |
| buildPartyTxnLog | 8579 (declaration) | — |
| calcPurTotal | 1467 (declaration) | — |
| calcSaleTotal | 1011 (declaration) | — |
| cancelEdit | 1128 (declaration) | — |
| cancelInvoice | 6390 (window assignment) | — |
| clearAllData | 2001 (declaration) | — |
| clearPLFilter | 1514 (declaration) | — |
| clearPayFilters | 3981 (window assignment) | — |
| clearSLFilter | 9083 (window assignment) | 1146 |
| closeAllRatePopups | 5474 (declaration) | — |
| closeDotMenus | 4519 (window assignment) | — |
| closeModal | 2011 (declaration) | — |
| cloudPull | 2446 (window assignment) | — |
| cloudPush | 2425 (window assignment) | — |
| collectPaymentFromView | 1321 (declaration) | — |
| confirmDel | 2012 (declaration) | — |
| copyGsCode | 4801 (window assignment) | — |
| createNewBin | 2473 (window assignment) | — |
| delInvoice | 8264 (window assignment) | 1201 |
| delInvoiceSafe | 8273 (window assignment) | 4524 |
| delItem | 8301 (window assignment) | 1621 |
| delParty | 8291 (window assignment) | 1682 |
| delPurPayEntry | 7794 (window assignment) | — |
| delPurchase | 8279 (window assignment) | 1565 |
| delRetail | 1406 (declaration) | — |
| deletePayment | 3326 (window assignment) | — |
| deletePaymentEntry | 6636 (window assignment) | — |
| dispBadge | 827 (declaration) | — |
| downloadCSVTemplate | 2275 (window assignment) | — |
| editInvoice | 1097 (declaration) | — |
| editInvoiceFromList | 1198 (declaration) | — |
| editPayment | 3842 (window assignment) | 3304 |
| ensureLast5Panel | 4320 (declaration) | — |
| ensureQuickPartyModal | 4038 (declaration) | — |
| exportData | 1976 (declaration) | — |
| exportToCSV | 4667 (window assignment) | — |
| filterLedger | 9757 (window assignment) | 1771 |
| fmtMonth | 1868 (declaration) | — |
| getAllPayments | 3986 (window assignment) | 3201 |
| getDeletePin | 8215 (declaration) | — |
| getInvoiceStatus | 6333 (declaration) | — |
| getItemInfo | 5889 (declaration) | — |
| getItemRates | 4921 (declaration) | — |
| getPrintSettings | 5308 (declaration) | — |
| gsPull | 8886 (window assignment) | 4800 |
| gsPush | 8855 (window assignment) | 4785 |
| handlePhoto | 1476 (declaration) | — |
| importCSV | 2284 (window assignment) | — |
| importData | 1985 (declaration) | — |
| initNewPurchase | 1414 (declaration) | — |
| initNewSale | 5013 (window assignment) | 879, 4253 |
| isCancelled | 6331 (declaration) | — |
| itemNavPage | 6705 (window assignment) | — |
| itemRepToggle | 9654 (window assignment) | — |
| labelSaleEntryRows | 9872 (window assignment) | — |
| loadSettings | 9894 (window assignment) | 1873, 2622, 5572, 8935 |
| loadSlCols | 4245 (declaration) | — |
| nav | 8604 (window assignment) | 732, 2140, 3227, 4264, 5623, 7276 |
| openItemModal | 1590 (declaration) | — |
| openPartyDetail | 8529 (window assignment) | 6789 |
| openPartyModal | 4167 (window assignment) | 1653, 3454 |
| openPayModal | 6596 (window assignment) | 1340 |
| openPayOutModal | 9516 (window assignment) | — |
| openPurPayModal | 7719 (window assignment) | — |
| openSettlementModal | 8351 (window assignment) | — |
| openStandalonePayModal | 4009 (window assignment) | 3340 |
| partyAC | 5850 (window assignment) | 836, 3426, 4099 |
| partyNavPage | 6740 (window assignment) | — |
| pbAddRow | 2938 (declaration) | — |
| pbCalcRow | 3021 (declaration) | — |
| pbClearAll | 2953 (declaration) | — |
| pbDelBill | 2930 (declaration) | — |
| pbDeleteRow | 3051 (declaration) | — |
| pbNewRow | 2854 (declaration) | — |
| pbNotesKeydown | 3058 (declaration) | — |
| pbPartyAC | 2866 (declaration) | — |
| pbQuickAddParty | 2900 (declaration) | — |
| pbRenderRows | 2962 (declaration) | — |
| pbSaveAll | 3071 (declaration) | — |
| pbSelectParty | 2885 (declaration) | — |
| pbShowPartyHistory | 2907 (declaration) | — |
| pbUpdate | 3016 (declaration) | — |
| pbUpdateAllPayTypes | 2948 (declaration) | — |
| pbUpdateTotals | 3035 (declaration) | — |
| pdShowTab | 6887 (window assignment) | — |
| piName | 1448 (declaration) | — |
| piNum | 1449 (declaration) | — |
| plNavPage | 6653 (window assignment) | — |
| poutAutoAllocate | 9434 (window assignment) | — |
| poutLoadBills | 9372 (window assignment) | — |
| poutPartyAC | 9347 (window assignment) | — |
| poutRecalc | 9452 (window assignment) | — |
| poutSelectParty | 9363 (window assignment) | — |
| poutToggleFull | 9426 (window assignment) | — |
| printFromList | 9251 (window assignment) | 4532 |
| printInvoice | 6421 (window assignment) | 1322, 5580 |
| printInvoiceA5 | 5161 (window assignment) | — |
| ptBadge | 826 (declaration) | — |
| purBulkAddRow | 7555 (window assignment) | — |
| purBulkCalcBal | 7230 (declaration) | — |
| purBulkCalcRowDOM | 7523 (window assignment) | — |
| purBulkClear | 7571 (window assignment) | — |
| purBulkDelRow | 7565 (window assignment) | — |
| purBulkNewRow | 7219 (declaration) | — |
| purBulkNotesKey | 7580 (window assignment) | — |
| purBulkQuickAdd | 7459 (window assignment) | — |
| purBulkRenderRows | 7467 (window assignment) | — |
| purBulkSaveAll | 7588 (window assignment) | — |
| purBulkSelectParty | 7433 (window assignment) | — |
| purBulkShowHistory | 7627 (window assignment) | — |
| purBulkUpdate | 7519 (window assignment) | — |
| purBulkUpdateTotals | 7538 (window assignment) | — |
| purbPartyAC | 7412 (window assignment) | — |
| quickAddParty | 4068 (window assignment) | 858 |
| quickCreateItem | 2102 (window assignment) | — |
| quickDispatch | 7101 (window assignment) | 1206 |
| removeCustomField | 1929 (declaration) | — |
| removePI | 1450 (declaration) | — |
| removePhoto | 1485 (declaration) | — |
| removeSI | 982 (declaration) | — |
| renderAuditPage | 8632 (window assignment) | — |
| renderCustomFieldInputs | 1936 (declaration) | — |
| renderCustomFieldsList | 1905 (declaration) | — |
| renderDashboard | 6904 (window assignment) | 760 |
| renderDispatchRep | 9670 (window assignment) | 1840 |
| renderExcelPage | 4540 (window assignment) | — |
| renderGitHubGuide | 5628 (window assignment) | — |
| renderItemRep | 9564 (window assignment) | 1792 |
| renderItems | 6708 (window assignment) | 1570 |
| renderLearnPage | 3530 (window assignment) | — |
| renderModuleToggles | 1884 (declaration) | — |
| renderOutstandingRep | 9782 (window assignment) | 2329 |
| renderPageBtns | 6363 (declaration) | — |
| renderPagination | 4496 (declaration) | — |
| renderParties | 8979 (window assignment) | 1626, 3804, 6742 |
| renderPartyLedger | 9705 (window assignment) | 1763 |
| renderPaymentLedger | 3902 (window assignment) | 3233 |
| renderPendingRep | 8766 (window assignment) | 1810 |
| renderPrevBillsPage | 2654 (window assignment) | 2145 |
| renderPrevBillsTable | 3130 (window assignment) | 2257 |
| renderPrintSettingsUI | 5537 (declaration) | — |
| renderPurBulkPage | 7285 (window assignment) | — |
| renderPurItems | 1433 (declaration) | — |
| renderPurPayPage | 7893 (window assignment) | — |
| renderPurRep | 8803 (window assignment) | 1744 |
| renderPurchaseList | 7809 (window assignment) | 1515, 6656 |
| renderRetailEntry | 1373 (declaration) | — |
| renderRetailTable | 1390 (declaration) | — |
| renderSaleItems | 6120 (window assignment) | 912, 4949, 5348 |
| renderSaleRep | 6992 (window assignment) | 1694 |
| renderSalesList | 9102 (window assignment) | 1150, 4345, 5226, 6455 |
| renderTxnPage | 8677 (window assignment) | — |
| repTab | 9769 (window assignment) | 1688, 2324, 6986, 8761 |
| resetSaleForm | 1095 (declaration) | — |
| restoreInvoice | 6405 (window assignment) | — |
| runMigrations | 2053 (declaration) | — |
| saleEntryEscape | 9870 (window assignment) | — |
| saleEntryOptions | 9866 (window assignment) | — |
| sanitizeFilename | 6355 (declaration) | — |
| saveEditPayment | 3884 (window assignment) | — |
| saveGsUrl | 4780 (window assignment) | — |
| saveItem | 8970 (window assignment) | 1612 |
| saveParty | 4135 (window assignment) | 1673, 3480 |
| savePayment | 8330 (window assignment) | 1352, 2399 |
| savePoutPayment | 9468 (window assignment) | — |
| savePrevBill | 2224 (window assignment) | — |
| savePrintSettings | 5331 (declaration) | — |
| savePrintSettingsUI | 5556 (window assignment) | — |
| savePurPayment | 8339 (window assignment) | 7765 |
| savePurchase | 8077 (window assignment) | 1491 |
| saveQuickItem | 2114 (window assignment) | — |
| saveQuickParty | 4082 (window assignment) | — |
| saveQuickPhone | 7085 (window assignment) | — |
| saveRetail | 1377 (declaration) | — |
| saveSaleInvoice | 9956 (window assignment) | 1032, 3389, 8315 |
| saveSettings | 9901 (window assignment) | 1949, 2632, 8953 |
| saveSettlement | 8479 (window assignment) | — |
| saveSlCols | 4246 (declaration) | — |
| saveStandalonePayment | 3364 (window assignment) | — |
| selectParty | 7059 (window assignment) | 852, 3506, 4122, 4314 |
| setPurItem | 1459 (declaration) | — |
| setPurMode | 1424 (declaration) | — |
| setSLPill | 1141 (declaration) | — |
| setSaleItem | 9948 (window assignment) | 999, 5083, 5982, 6235 |
| settleAutoFill | 8451 (window assignment) | — |
| settleRecalc | 8465 (window assignment) | — |
| showI5Pop | 5049 (declaration) | — |
| showInvoicePartyInfo | 4057 (declaration) | — |
| showItemInfoPanel | 5919 (declaration) | — |
| showLast5Rates | 4276 (declaration) | — |
| showLastRate | 864 (declaration) | — |
| showPurItemAC | 1451 (declaration) | — |
| showSaleItemAC | 5869 (window assignment) | 987, 2084 |
| siApplyRate | 5072 (window assignment) | — |
| siField | 5019 (window assignment) | — |
| siHidePopup | 5466 (window assignment) | — |
| siMoveDown | 5029 (window assignment) | — |
| siMoveUp | 5024 (window assignment) | — |
| siName | 956 (declaration) | — |
| siNum | 9924 (window assignment) | 975 |
| siPack | 9941 (window assignment) | 960 |
| siPackCnt | 9935 (window assignment) | 972 |
| siRatePopup | 6002 (window assignment) | 5430 |
| siShowRates | 5036 (window assignment) | — |
| slGoPage | 4509 (window assignment) | — |
| slNavPage | 9097 (window assignment) | 6453 |
| slSetSort | 4482 (window assignment) | — |
| spaSelectInv | 3352 (window assignment) | — |
| statusBadge | 6341 (declaration) | — |
| switchPBMode | 3115 (window assignment) | — |
| toast | 723 (declaration) | — |
| toggleCompactMode | 4810 (window assignment) | — |
| toggleDispatch | 1312 (declaration) | — |
| toggleDotMenu | 4512 (window assignment) | — |
| toggleSlCol | 4489 (window assignment) | — |
| updateQuantity | 9907 (declaration) | — |
| v15CheckPin | 8246 (window assignment) | — |
| v15PinConfirm | 8255 (window assignment) | — |
| v16DotClose | 9248 (window assignment) | — |
| v16DotToggle | 9241 (window assignment) | — |
| viewInvoice | 6565 (window assignment) | 1215, 5107, 5204 |
| viewPurchase | 8004 (window assignment) | 1546 |
| withDeletePin | 8219 (window assignment) | — |
| xlHandleDrop | 4713 (window assignment) | — |
| xlImportFile | 4702 (window assignment) | — |
| xlProcessCSV | 4722 (window assignment) | — |

## Storage keys

DB prefixes keys with shop4_. Literal keys: settings, items, parties, invoices, purchases, retail, shop4_app_version, v8_slcols, v8_compact, audit. Dynamic keys/custom fields also need runtime review.

## Pages

page-dashboard, page-new-sale, page-sales-list, page-retail-entry, page-new-purchase, page-purchase-list, page-items, page-parties, page-reports, page-settings, page-mypage

## Modals (including generated templates)

item-modal, party-modal, inv-view-modal, pur-view-modal, pay-modal, del-modal

## Inline handler candidates

| HTML line | Handler | Named function found syntactically |
| --- | --- | --- |
| 192 | nav('dashboard') | yes |
| 194 | nav('new-sale') | yes |
| 195 | nav('sales-list') | yes |
| 196 | nav('retail-entry') | yes |
| 198 | nav('new-purchase') | yes |
| 199 | nav('purchase-list') | yes |
| 201 | nav('items') | yes |
| 202 | nav('parties') | yes |
| 204 | nav('reports') | yes |
| 205 | nav('settings') | yes |
| 206 | exportData() | yes |
| 207 | document.getElementById('import-file').click() | DOM expression / generated |
| 208 | importData(this) | yes |
| 214 | nav('dashboard') | yes |
| 215 | nav('new-sale') | yes |
| 216 | nav('retail-entry') | yes |
| 217 | nav('reports') | yes |
| 218 | nav('settings') | yes |
| 227 | nav('new-sale') | yes |
| 228 | nav('retail-entry') | yes |
| 239 | cancelEdit() | yes |
| 240 | nav('sales-list') | yes |
| 247 | cancelEdit() | yes |
| 267 | partyAC('inv-party','inv-party-id',this.value) | yes |
| 293 | addSaleItem() | yes |
| 305 | addSaleItem() | yes |
| 313 | calcSaleTotal() | yes |
| 315 | calcSaleTotal() | yes |
| 320 | calcSaleTotal() | yes |
| 334 | saveSaleInvoice(false) | yes |
| 335 | saveSaleInvoice(true) | yes |
| 336 | resetSaleForm() | yes |
| 346 | nav('new-sale') | yes |
| 351 | renderSalesList() | yes |
| 352 | renderSalesList() | yes |
| 353 | renderSalesList() | yes |
| 354 | clearSLFilter() | yes |
| 357 | setSLPill('all') | yes |
| 358 | setSLPill('cash-due') | yes |
| 359 | setSLPill('credit-due') | yes |
| 360 | setSLPill('pending-dispatch') | yes |
| 361 | setSLPill('dispatched') | yes |
| 362 | setSLPill('draft') | yes |
| 363 | setSLPill('paid') | yes |
| 374 | nav('reports') | yes |
| 390 | saveRetail() | yes |
| 399 | nav('purchase-list') | yes |
| 405 | partyAC('pur-party','pur-party-id',this.value) | yes |
| 416 | setPurMode('amount') | yes |
| 417 | setPurMode('items') | yes |
| 430 | addPurItem() | yes |
| 436 | addPurItem() | yes |
| 440 | calcPurTotal() | yes |
| 447 | document.getElementById('pur-photo-input').click() | DOM expression / generated |
| 452 | handlePhoto(this) | yes |
| 455 | removePhoto() | yes |
| 458 | savePurchase() | yes |
| 464 | nav('new-purchase') | yes |
| 468 | renderPurchaseList() | yes |
| 469 | renderPurchaseList() | yes |
| 470 | renderPurchaseList() | yes |
| 471 | clearPLFilter() | yes |
| 481 | openItemModal() | yes |
| 483 | renderItems() | yes |
| 490 | openPartyModal() | yes |
| 492 | renderParties() | yes |
| 502 | repTab('sale') | yes |
| 503 | repTab('pur') | yes |
| 504 | repTab('party') | yes |
| 505 | repTab('item') | yes |
| 506 | repTab('pending') | yes |
| 507 | repTab('dispatch') | yes |
| 567 | addCustomField() | yes |
| 580 | exportData() | yes |
| 581 | document.getElementById('import-file').click() | DOM expression / generated |
| 582 | clearAllData() | yes |
| 585 | saveSettings() | yes |
| 595 | closeModal('item-modal') | yes |
| 613 | closeModal('item-modal') | yes |
| 613 | saveItem() | yes |
| 619 | closeModal('party-modal') | yes |
| 635 | closeModal('party-modal') | yes |
| 635 | saveParty() | yes |
| 645 | printInvoice() | yes |
| 646 | collectPaymentFromView() | yes |
| 647 | editInvoice() | yes |
| 648 | toggleDispatch() | yes |
| 649 | closeModal('inv-view-modal') | yes |
| 658 | closeModal('pur-view-modal') | yes |
| 665 | closeModal('pay-modal') | yes |
| 675 | closeModal('pay-modal') | yes |
| 675 | savePayment() | yes |
| 681 | closeModal('del-modal') | yes |
| 683 | closeModal('del-modal') | yes |
| 789 | nav('sales-list') | yes |
| 792 | viewInvoice('${i.id}') | yes |
| 810 | openPayModal('${i.id}') | yes |
| 818 | quickDispatch('${i.id}') | yes |
| 843 | selectParty('${inputId}','${hiddenId}','${p.id}','${esc(p.name)}','${listId}') | yes |
| 847 | quickAddParty('${inputId}','${hiddenId}','${listId}','${esc(val)}') | yes |
| 921 | siName('${it.id}',this.value) | yes |
| 925 | siPack('${it.id}',this.value) | yes |
| 938 | siPackCnt('${it.id}',this.value) | yes |
| 942 | siNum('${it.id}','qty',this.value) | yes |
| 945 | siNum('${it.id}','rate',this.value) | yes |
| 950 | removeSI('${it.id}') | yes |
| 992 | setSaleItem('${id}','${i.id}','${esc(i.name)}','${i.saleRate//0}','${i.unit//'Pcs'}') | yes |
| 995 | document.getElementById('ac-sn-${id}').style.display='none' | DOM expression / generated |
| 1179 | viewInvoice('${i.id}') | yes |
| 1188 | viewInvoice('${i.id}') | yes |
| 1189 | editInvoiceFromList('${i.id}') | yes |
| 1190 | openPayModal('${i.id}') | yes |
| 1191 | quickDispatch('${i.id}') | yes |
| 1192 | delInvoice('${i.id}') | yes |
| 1401 | delRetail('${r.id}') | yes |
| 1438 | piName('${it.id}',this.value) | yes |
| 1441 | piNum('${it.id}','qty',this.value) | yes |
| 1442 | piNum('${it.id}','rate',this.value) | yes |
| 1444 | removePI('${it.id}') | yes |
| 1455 | setPurItem('${id}','${esc(i.name)}','${i.purchaseRate//0}','${i.unit//'Pcs'}') | yes |
| 1539 | viewPurchase('${p.id}') | yes |
| 1540 | delPurchase('${p.id}') | yes |
| 1583 | openItemModal('${i.id}') | yes |
| 1584 | delItem('${i.id}') | yes |
| 1645 | openPartyModal('${p.id}') | yes |
| 1646 | delParty('${p.id}') | yes |
| 1767 | filterLedger(this.value) | yes |
| 1818 | viewInvoice('${i.id}') | yes |
| 1823 | openPayModal('${i.id}') | yes |
| 1848 | viewInvoice('${i.id}') | yes |
| 1853 | quickDispatch('${i.id}');renderDispatchRep() | yes |
| 1913 | removeCustomField('${cf.id}') | yes |
| 2090 | setSaleItem('${id}','${i.id}','${esc(i.name)}','${i.saleRate//0}','${i.unit//'Pcs'}') | yes |
| 2094 | quickCreateItem('${id}','${esc(val)}') | yes |
| 2151 | nav('sales-list') | yes |
| 2171 | partyAC('pb-party','pb-party-id',this.value) | yes |
| 2198 | savePrevBill() | yes |
| 2208 | downloadCSVTemplate() | yes |
| 2211 | importCSV(this) | yes |
| 2270 | delInvoice('${i.id}');renderPrevBillsTable() | yes |
| 2378 | viewInvoice('${i.id}') | yes |
| 2386 | openPayModal('${i.id}') | yes |
| 2530 | closeModal('quick-item-modal') | yes |
| 2547 | closeModal('quick-item-modal') | yes |
| 2547 | saveQuickItem() | yes |
| 2606 | createNewBin() | yes |
| 2607 | cloudPush() | yes |
| 2608 | cloudPull() | yes |
| 2661 | switchPBMode('party') | yes |
| 2662 | switchPBMode('single') | yes |
| 2663 | nav('sales-list') | yes |
| 2680 | switchPBMode('party') | yes |
| 2681 | switchPBMode('single') | yes |
| 2682 | switchPBMode('csv') | yes |
| 2695 | pbPartyAC(this.value) | yes |
| 2702 | pbUpdateAllPayTypes(this.value) | yes |
| 2716 | pbAddRow() | yes |
| 2727 | pbAddRow() | yes |
| 2728 | pbClearAll() | yes |
| 2768 | pbSaveAll() | yes |
| 2785 | partyAC('pb-party','pb-party-id',this.value) | yes |
| 2810 | savePrevBill() | yes |
| 2822 | downloadCSVTemplate() | yes |
| 2825 | importCSV(this) | yes |
| 2875 | pbSelectParty('${p.id}','${esc(p.name)}') | yes |
| 2879 | pbQuickAddParty('${esc(val)}') | yes |
| 2923 | pbDelBill('${i.id}','${esc(id//'')}','${esc(name)}') | yes |
| 2969 | pbUpdate('${r.id}','date',this.value) | yes |
| 2974 | pbUpdate('${r.id}','billNo',this.value) | yes |
| 2979 | pbUpdate('${r.id}','total',this.value) | yes |
| 2979 | pbCalcRow('${r.id}') | yes |
| 2984 | pbUpdate('${r.id}','paid',this.value) | yes |
| 2984 | pbCalcRow('${r.id}') | yes |
| 2993 | pbUpdate('${r.id}','payType',this.value) | yes |
| 3003 | pbUpdate('${r.id}','notes',this.value) | yes |
| 3004 | pbNotesKeydown(event,'${r.id}') | yes |
| 3008 | pbDeleteRow('${r.id}') | yes |
| 3160 | viewInvoice('${b.id}') | yes |
| 3161 | openPayModal('${b.id}') | yes |
| 3162 | pbDelBill('${b.id}','','${esc(b.partyName)}') | yes |
| 3246 | openStandalonePayModal() | yes |
| 3247 | renderPaymentLedger() | yes |
| 3248 | renderPaymentLedger() | yes |
| 3282 | viewInvoice('${p._invId}') | yes |
| 3292 | editPayment('${p._invId}',${p._payIdx}) | yes |
| 3293 | deletePayment('${p._invId}',${p._payIdx}) | yes |
| 3438 | selectParty('${inputId}','${hiddenId}','${p.id}','${esc(p.name)}','${listId}') | yes |
| 3446 | quickAddParty('${inputId}','${hiddenId}','${listId}','${esc(val)}') | yes |
| 3535 | nav('settings') | yes |
| 3660 | nav('mypage') | yes |
| 3757 | closeModal('standalone-pay-modal') | yes |
| 3761 | spaSelectInv() | yes |
| 3778 | closeModal('standalone-pay-modal') | yes |
| 3779 | saveStandalonePayment() | yes |
| 3825 | openPartyModal('${p.id}') | yes |
| 3826 | delParty('${p.id}') | yes |
| 3855 | document.getElementById('edit-pay-modal').remove() | DOM expression / generated |
| 3876 | document.getElementById('edit-pay-modal').remove() | DOM expression / generated |
| 3877 | saveEditPayment('${invId}',${payIdx}) | yes |
| 3923 | openStandalonePayModal() | yes |
| 3926 | renderPaymentLedger() | yes |
| 3930 | renderPaymentLedger() | yes |
| 3932 | clearPayFilters() | yes |
| 3959 | viewInvoice('${p._invId}') | yes |
| 3970 | editPayment('${p._invId}',${p._payIdx}) | yes |
| 3971 | deletePayment('${p._invId}',${p._payIdx}) | yes |
| 4044 | closeModal('quick-party-modal') | yes |
| 4051 | closeModal('quick-party-modal') | yes |
| 4051 | saveQuickParty() | yes |
| 4111 | selectParty('${inputId}','${hiddenId}','${p.id}','${esc(p.name)}','${listId}') | yes |
| 4115 | quickAddParty('${inputId}','${hiddenId}','${listId}','${esc(val)}') | yes |
| 4405 | slSetSort('${col}') | yes |
| 4411 | toggleDotMenu('dm-${i.id}',event) | yes |
| 4413 | viewInvoice('${i.id}');closeDotMenus() | yes |
| 4414 | editInvoiceFromList('${i.id}');closeDotMenus() | yes |
| 4415 | openPayModal('${i.id}');closeDotMenus() | yes |
| 4416 | printFromList('${i.id}');closeDotMenus() | yes |
| 4417 | quickDispatch('${i.id}');closeDotMenus() | yes |
| 4419 | delInvoiceSafe('${i.id}');closeDotMenus() | yes |
| 4430 | toggleSlCol('${k}') | yes |
| 4449 | viewInvoice('${i.id}') | yes |
| 4459 | viewInvoice('${i.id}') | yes |
| 4460 | openPayModal('${i.id}') | yes |
| 4500 | slGoPage(${p}) | yes |
| 4506 | slGoPage(+this.value) | yes |
| 4545 | nav('settings') | yes |
| 4553 | exportToCSV('invoices') | yes |
| 4554 | exportToCSV('purchases') | yes |
| 4555 | exportToCSV('parties') | yes |
| 4556 | exportToCSV('items') | yes |
| 4557 | exportToCSV('retail') | yes |
| 4571 | document.getElementById('xl-file-input').click() | DOM expression / generated |
| 4572 | event.preventDefault();this.classList.add('drag') | DOM expression / generated |
| 4573 | this.classList.remove('drag') | DOM expression / generated |
| 4574 | xlHandleDrop(event) | yes |
| 4579 | xlImportFile(this) | yes |
| 4598 | gsPush() | yes |
| 4599 | gsPull() | yes |
| 4600 | saveGsUrl() | yes |
| 4608 | copyGsCode() | yes |
| 4772 | renderExcelPage() | yes |
| 4961 | siName('${it.id}',this.value) | yes |
| 4962 | siShowRates('${it.id}') | yes |
| 4968 | siField('${it.id}','colour',this.value) | yes |
| 4971 | siPack('${it.id}',this.value) | yes |
| 4983 | siPackCnt('${it.id}',this.value) | yes |
| 4986 | siNum('${it.id}','qty',this.value) | yes |
| 4990 | siNum('${it.id}','rate',this.value) | yes |
| 4991 | siShowRates('${it.id}') | yes |
| 5002 | siMoveUp('${it.id}') | yes |
| 5003 | siMoveDown('${it.id}') | yes |
| 5006 | removeSI('${it.id}') | yes |
| 5059 | siApplyRate('${rowId}',${r.rate}) | yes |
| 5366 | siName('${it.id}',this.value) | yes |
| 5367 | siRatePopup('${it.id}') | yes |
| 5375 | siField('${it.id}','colour',this.value) | yes |
| 5378 | siPack('${it.id}',this.value) | yes |
| 5388 | siPackCnt('${it.id}',this.value) | yes |
| 5392 | siNum('${it.id}','qty',this.value) | yes |
| 5398 | siNum('${it.id}','rate',this.value) | yes |
| 5399 | siRatePopup('${it.id}') | yes |
| 5400 | siHidePopup('${it.id}') | yes |
| 5410 | siMoveUp('${it.id}') | yes |
| 5412 | siMoveDown('${it.id}') | yes |
| 5417 | removeSI('${it.id}') | yes |
| 5458 | siApplyRate('${id}',${r.rate}) | yes |
| 5512 | savePrintSettingsUI() | yes |
| 5633 | nav('settings') | yes |
| 5960 | siApplyRate('${rowId}',${lastSale.rate}) | yes |
| 6056 | siApplyRate('${id}',${r.rate}) | yes |
| 6150 | siName('${it.id}',this.value) | yes |
| 6151 | siRatePopup('${it.id}') | yes |
| 6162 | siField('${it.id}','colour',this.value) | yes |
| 6165 | siPack('${it.id}',this.value) | yes |
| 6177 | siPackCnt('${it.id}',this.value) | yes |
| 6182 | siNum('${it.id}','qty',this.value) | yes |
| 6190 | siNum('${it.id}','rate',this.value) | yes |
| 6191 | siRatePopup('${it.id}') | yes |
| 6192 | siHidePopup('${it.id}') | yes |
| 6202 | siMoveUp('${it.id}') | yes |
| 6204 | siMoveDown('${it.id}') | yes |
| 6209 | removeSI('${it.id}') | yes |
| 6371 | ${onNav}(${currentPage-1}) | DOM expression / generated |
| 6380 | ${onNav}(${p}) | DOM expression / generated |
| 6382 | ${onNav}(${currentPage+1}) | DOM expression / generated |
| 6513 | viewInvoice('${i.id}') | yes |
| 6515 | viewInvoice('${i.id}') | yes |
| 6524 | viewInvoice('${i.id}') | yes |
| 6525 | restoreInvoice('${i.id}') | yes |
| 6527 | viewInvoice('${i.id}') | yes |
| 6528 | openPayModal('${i.id}') | yes |
| 6529 | editInvoiceFromList('${i.id}') | yes |
| 6530 | quickDispatch('${i.id}') | yes |
| 6531 | cancelInvoice('${i.id}') | yes |
| 6627 | deletePaymentEntry('${invId}',${i}) | yes |
| 6684 | viewPurchase('${p.id}') | yes |
| 6693 | viewPurchase('${p.id}') | yes |
| 6694 | delPurchase('${p.id}') | yes |
| 6720 | openItemModal('${it.id}') | yes |
| 6728 | openItemModal('${it.id}') | yes |
| 6729 | delItem('${it.id}') | yes |
| 6765 | openPartyDetail('${p.id}') | yes |
| 6775 | openPartyDetail('${p.id}') | yes |
| 6776 | openPartyModal('${p.id}') | yes |
| 6777 | delParty('${p.id}') | yes |
| 6819 | nav('new-sale');closeModal('party-detail-modal');setTimeout(()=>{document.getElementById('inv-party').value='${p.name}';document.getElementById('inv-party-id').value='${p.id}';showLastRate('${p.id}'); | yes |
| 6820 | openPartyModal('${p.id}');closeModal('party-detail-modal') | yes |
| 6821 | closeModal('party-detail-modal') | yes |
| 6843 | pdShowTab('inv') | yes |
| 6844 | pdShowTab('pay') | yes |
| 6859 | closeModal('party-detail-modal');viewInvoice('${i.id}') | yes |
| 6860 | closeModal('party-detail-modal');openPayModal('${i.id}') | yes |
| 6863 | closeModal('party-detail-modal');nav('sales-list');setTimeout(()=>{document.getElementById('sl-srch').value='${p.name}';renderSalesList();},200) | yes |
| 6938 | nav('sales-list') | yes |
| 6941 | viewInvoice('${i.id}') | yes |
| 6941 | viewInvoice('${i.id}') | yes |
| 6964 | openPayModal('${i.id}') | yes |
| 6973 | quickDispatch('${i.id}') | yes |
| 6977 | nav('sales-list');setSLPill('cancelled') | yes |
| 7072 | if(event.key==='Enter')saveQuickPhone('${id}') | needs runtime check |
| 7073 | saveQuickPhone('${id}') | yes |
| 7293 | nav('new-purchase') | yes |
| 7294 | nav('purchase-list') | yes |
| 7319 | purBulkSelectParty('${p.id}','${esc(p.name)}') | yes |
| 7329 | purbPartyAC(this.value) | yes |
| 7344 | purBulkAddRow() | yes |
| 7355 | purBulkAddRow() | yes |
| 7356 | purBulkClear() | yes |
| 7395 | purBulkSaveAll() | yes |
| 7423 | purBulkSelectParty('${p.id}','${esc(p.name)}') | yes |
| 7427 | purBulkQuickAdd('${esc(val)}') | yes |
| 7474 | purBulkUpdate('${r.id}','date',this.value) | yes |
| 7478 | purBulkUpdate('${r.id}','billNo',this.value) | yes |
| 7482 | purBulkUpdate('${r.id}','total',this.value) | yes |
| 7483 | purBulkCalcRowDOM('${r.id}') | yes |
| 7488 | purBulkUpdate('${r.id}','paid',this.value) | yes |
| 7489 | purBulkCalcRowDOM('${r.id}') | yes |
| 7497 | purBulkUpdate('${r.id}','payType',this.value) | yes |
| 7507 | purBulkUpdate('${r.id}','notes',this.value) | yes |
| 7508 | purBulkNotesKey(event,'${r.id}') | yes |
| 7512 | purBulkDelRow('${r.id}') | yes |
| 7656 | viewPurchase('${b.id}') | yes |
| 7657 | openPurPayModal('${b.id}') | yes |
| 7658 | delPurchase('${b.id}');purBulkShowHistory('${partyId}','${esc(partyName)}') | yes |
| 7678 | closeModal('pur-pay-modal') | yes |
| 7711 | closeModal('pur-pay-modal') | yes |
| 7712 | savePurPayment() | yes |
| 7755 | delPurPayEntry('${purId}',${i}) | yes |
| 7837 | renderPurchaseList() | yes |
| 7862 | viewPurchase('${p.id}') | yes |
| 7874 | viewPurchase('${p.id}') | yes |
| 7875 | openPurPayModal('${p.id}') | yes |
| 7876 | delPurchase('${p.id}') | yes |
| 7924 | nav('purchase-list') | yes |
| 7957 | openPurPayModal('${p.id}') | yes |
| 7987 | viewPurchase('${p._purId}') | yes |
| 7988 | delPurPayEntry('${p._purId}',${p._idx});renderPurPayPage() | yes |
| 8024 | openPurPayModal('${p.id}') | yes |
| 8231 | v15CheckPin(this,${JSON.stringify(getDeletePin())}) | yes |
| 8233 | document.getElementById('del-pin-overlay').remove() | DOM expression / generated |
| 8234 | v15PinConfirm(${JSON.stringify(getDeletePin())}) | yes |
| 8369 | closeModal('settlement-modal') | yes |
| 8382 | settleAutoFill(this.value) | yes |
| 8408 | settleRecalc() | yes |
| 8428 | settleRecalc() | yes |
| 8441 | closeModal('settlement-modal') | yes |
| 8442 | saveSettlement('${partyId}','${partyName}') | yes |
| 8642 | renderAuditPage() | yes |
| 8643 | if(confirm('Clear audit log?')){DB.del('audit');renderAuditPage();} | needs runtime check |
| 8718 | renderTxnPage() | yes |
| 8719 | renderTxnPage() | yes |
| 8742 | viewInvoice('${t.invId}') | yes |
| 8775 | viewInvoice('${i.id}') | yes |
| 8776 | viewInvoice('${i.id}') | yes |
| 8782 | openPayModal('${i.id}') | yes |
| 8783 | openSettlementModal('${i.partyId//''}','${esc(i.partyName//'')}') | yes |
| 9167 | v16DotToggle('v16dm-${inv.id}',event) | yes |
| 9169 | viewInvoice('${inv.id}');v16DotClose() | yes |
| 9171 | editInvoiceFromList('${inv.id}');v16DotClose() | yes |
| 9172 | openPayModal('${inv.id}');v16DotClose() | yes |
| 9173 | printFromList('${inv.id}');v16DotClose() | yes |
| 9174 | quickDispatch('${inv.id}');v16DotClose() | yes |
| 9175 | cancelInvoice('${inv.id}');v16DotClose() | yes |
| 9177 | delInvoice('${inv.id}');v16DotClose() | yes |
| 9179 | restoreInvoice('${inv.id}');v16DotClose() | yes |
| 9181 | delInvoice('${inv.id}');v16DotClose() | yes |
| 9209 | viewInvoice('${inv.id}') | yes |
| 9212 | viewInvoice('${inv.id}') | yes |
| 9220 | viewInvoice('${inv.id}') | yes |
| 9221 | openPayModal('${inv.id}') | yes |
| 9267 | closeModal('pay-out-modal') | yes |
| 9278 | poutPartyAC(this.value) | yes |
| 9286 | poutAutoAllocate() | yes |
| 9338 | closeModal('pay-out-modal') | yes |
| 9339 | savePoutPayment() | yes |
| 9356 | poutSelectParty('${p.id}','${esc(p.name)}') | yes |
| 9411 | poutRecalc() | yes |
| 9415 | poutToggleFull('${b.id}',this.checked) | yes |
| 9598 | renderItemRep() | yes |
| 9615 | itemRepToggle('ir-${i}') | yes |
| 9680 | viewInvoice('${i.id}') | yes |
| 9681 | viewInvoice('${i.id}') | yes |
| 9687 | quickDispatch('${i.id}');renderDispatchRep() | yes |
| 9713 | filterLedger(this.value) | yes |
| 9739 | openPartyDetail('${p.id}') | yes |
| 9748 | openPartyDetail('${p.id}') | yes |
| 9749 | openSettlementModal('${p.id}','${esc(p.name)}') | yes |
| 9818 | openSettlementModal('','${esc(p.name)}') | yes |
| 9826 | viewInvoice('${i.id}') | yes |
| 9827 | viewInvoice('${i.id}') | yes |
| 9833 | openPayModal('${i.id}') | yes |

## Parse errors

None
