# Plan A — immutable source and storage-writer inventory

Date: 2026-10-14. Status: **A1a source/documentation characterization approved and in progress**. This inventory implements no runtime, adapter, migration, provider quarantine or diagnostic UI. A1b and later feature work, merge and deployment remain approval-pending.

## Immutable production-source contract

| Property | Required baseline |
| --- | --- |
| Repository / baseline main commit | `nileshkchaubey-glitch/Xl-billing` / `3855c6ab21de64fdc9e28116fcd0f770304eef66` |
| Production file | [Pinned `index.html`](https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html) |
| Exact SHA-256 | `d5fbcd1a47a5bf6e8d2ec735b561f46108e3c905878ba301acd322040b52b70a` |
| Git blob SHA-1 | `7396d51fa05c93382966cf49dad6b16472e6255c` |
| Bytes / lines | `554923` / `10290` |
| Candidate branch | `codex/xl-plan-a-a1a` |

A1a must preserve every byte of `index.html`; equal behavior after an edit would not satisfy this contract. The six existing QA scripts must also retain their baseline bytes. Check the source contract before and after characterization and bind each evidence report to the actual candidate commit and runner/fixture hashes. A mismatch is a failed preservation gate, not permission to regenerate the baseline. The machine-readable file hashes are in [baseline-source.json](../qa/plan-a/baseline-source.json); actual candidate observations are in [PLAN_A_A1A_VERIFICATION.md](PLAN_A_A1A_VERIFICATION.md).

The immutable fifteen-file A1a preservation guard intentionally rejects later runtime changes. A separately approved future runtime PR must explicitly revise its baseline/scope contract and supply the replacement feature gates appropriate to that approved change. Do not silently edit the manifest to bless changed production bytes, disable failing checks or reuse A1a characterization as feature acceptance. Current A1a CI pins Node `22.23.3`; actual local/CI versions and outcomes belong in the verification report.

All source-line links in this inventory resolve to the immutable baseline above. New development files do not change these line numbers. The original complete backlog, risk reconciliation and acceptance requirements are in [implementation](PLAN_A_IMPLEMENTATION.md), [risk traceability](PLAN_A_RISK_TRACEABILITY.md) and [test matrix](PLAN_A_TEST_MATRIX.md).

## How to read the evidence

**SOURCE-CONFIRMED** means the definition, call or ordering is present in the pinned source. It does not establish that a full browser visit reaches it, that every referenced global exists, that storage accepts the write, or that accounting is correct. **OBSERVED VM RESULT** requires an actual command/result in the verification report. **HISTORICAL REPRODUCTION** belongs to the linked older audit/closed-unmerged PR #10 and is not a current-main rerun. **PENDING / NOT VERIFIED** means the required feature or runtime/device check has not been established.

The six current scripts are [qa/verify-backup-import.cjs](https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/qa/verify-backup-import.cjs), [qa/verify-complete-backup.cjs](https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/qa/verify-complete-backup.cjs), [qa/verify-invoice-entry.cjs](https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/qa/verify-invoice-entry.cjs), [qa/verify-pagination.cjs](https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/qa/verify-pagination.cjs), [qa/verify-payment-ledger-pagination.cjs](https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/qa/verify-payment-ledger-pagination.cjs) and [qa/verify-invoice-payment-safety.cjs](https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/qa/verify-invoice-payment-safety.cjs). Planning-review passes used synthetic Maps/objects, mocked DOMs and selected Node VM snippets. The old [PR #10 blocker report](https://github.com/nileshkchaubey-glitch/Xl-billing/blob/9191b2ea5c7570f2bc3ec245dca2c48fb19aebba/docs/BLOCKER_REPAIR_VERIFICATION.md#L102) and its totals of 110 Node and 508 browser results belong to a divergent, unmerged stack; they are not current script coverage. A1a adds characterization only and must keep unsafe/unverified outcomes visible.

## Storage reads and membership

The namespace function is [901][L901]: `shop4_` + logical key. The raw adapter at [902][L902] parses reads in `try/catch`, returning `null` on any read/parse failure. Getters at [907][L907]–[920][L920] then provide empty collections or default settings. Thus an ordinary getter cannot distinguish absent data from denied storage, malformed JSON, JSON `null` or a wrong shape. Diagnostic code must not reuse this fallback as evidence of a safe empty profile.

Business collections are `shop4_items`, `shop4_parties`, `shop4_invoices`, `shop4_purchases` and `shop4_retail`; settings and audit are `shop4_settings` and `shop4_audit`. Version and recovery state include `shop4_app_version` and `shop4_import_pending`. Direct preferences are `v8_slcols` and `v8_compact`. Preserve unknown stored keys and exact presence/raw values in synthetic snapshots; their existence is not authorization to remove or normalize them.

The current V1 key policy at [697][L697]–[698][L698] accepts keys of at most 160 characters matching `shop4_[A-Za-z0-9_-]+`, except `shop4_import_pending`, plus the two preferences. Collection at [706][L706] refuses a pending marker. Validation at [715][L715] checks supported key membership, basic shapes and row IDs; it does not validate complete accounting or require every business section to be present. `occupied()` at [740][L740] exempts `shop4_app_version` while treating accepted data/preferences and the pending marker as occupied. This is the current contract, not the incompatible key policy from an old draft. Future journal namespace/export rules need separate design approval.

## Winning and replaced chains

The arrows below show outermost caller → captured predecessor → underlying operation in source order. A retained captured predecessor executes only where the final wrapper actually calls it. Capturing a name alone does not make its replaced implementation an active route. These are source traces, not full-browser availability or safety passes.

| Operation | Winning chain, exact writes and predecessor classification |
| --- | --- |
| Invoice create/edit | [10273][L10273] entry validation → [8619][L8619] audit wrapper → [3638][L3638] party/item validation → [1242][L1242] base. Base writes invoices at [1290][L1290]/[1307][L1307], then new-invoice counter/settings at [1308][L1308]; audit is called at [8631][L8631] and written at [8512][L8512]. Success/print at [1292][L1292]/[1309][L1309] precede wrapper audit. All three predecessors are retained by delegation. |
| Normal invoice receipt | [8638][L8638] audit wrapper → [2636][L2636] replacement → invoices [2657][L2657] → audit call [8648][L8648] / write [8512][L8512]. Base `savePayment` at [1573][L1573] (write [1583][L1583]) is replaced; the replacement does not delegate to it. |
| Standalone/edit/delete receipt | Standalone [3607][L3607] → invoices [3628][L3628]. Final edit UI [4091][L4091] → save [4133][L4133] → invoices [4148][L4148]; earlier prompt-edit [3547][L3547] / write [3563][L3563] is replaced. Current delete routes [3569][L3569] → [3577][L3577] and [6934][L6934] → [6941][L6941] remain separate. No normal-receipt audit wrapper applies automatically to these routes. |
| Settlement | [8797][L8797] → invoices [8835][L8835] → audit call [8836][L8836] / write [8512][L8512]. Discount target at [8826][L8826] uses ID-or-name matching without current review binding. |
| Purchase creation | Final [8381][L8381] → purchases [8412][L8412]. Base [1712][L1712] / [1732][L1732] is replaced. The final function captures the earlier name at [8380][L8380] but does not call it. |
| Purchase receipt/delete | Audit wrapper [8653][L8653] → [8069][L8069] → purchases [8085][L8085] → audit call [8662][L8662] / write [8512][L8512]. Separate receipt deletion writes purchases at [8105][L8105]. |
| Payment Out | [9787][L9787] → purchases [9821][L9821]. Conditional audit [9824][L9824]/[9825][L9825] cannot find closure-local V15 `auditLog`; a fabricated global would hide this source limitation. Cached bills and ID-or-name loading remain. |
| Settings | [10218][L10218] → [9271][L9271] → [2875][L2875] → [2170][L2170]. Sequential writes are [2185][L2185]/[2882][L2882]/[9277][L9277]/[10221][L10221]; the first success is at [2191][L2191]. The PIN write [9277][L9277] is conditional on its input. All captured layers delegate; removing a field can change credential-preservation behavior. |
| Party/item master save | Final party [4427][L4427] → parties [4444][L4444] replaces base [1894][L1894] / [1901][L1901] and area version [3729][L3729] / [3747][L3747]; captured names are unused. Item wrapper [9288][L9288] delegates to retained base [1833][L1833] → items [1840][L1840]. Quick-add/CSV/GS writers remain separate. |
| Invoice/purchase/party/item destruction | Final functions [8568][L8568]/[8583][L8583]/[8595][L8595]/[8605][L8605] audit before business deletion at [8572][L8572]/[8587][L8587]/[8599][L8599]/[8609][L8609]. PIN overlay is removed before callback at [8547][L8547]. `delInvoiceSafe` [8577][L8577] delegates to final invoice deletion, replacing its own write [4818][L4818]. Base invoice [1422][L1422] / [1424][L1424], purchase [1786][L1786], party [1903][L1903] and item [1842][L1842] are replaced. Previous-bill/receipt/retail/clear routes remain distinct. |
| Dispatch/cancel/restore | Final quick dispatch [7399][L7399] → invoices [7405][L7405] replaces [1427][L1427] / [1430][L1430]. Toggle write [1538][L1538], cancel [6696][L6696] and restore [6710][L6710] remain separate. |
| Apps Script | Final `gsPush` [9173][L9173] replaces [5077][L5077], posts full settings/records and calls audit at [9194][L9194]. Final `gsPull` [9204][L9204] replaces read-only stub [5092][L5092], merges items/parties at [9227][L9227]/[9238][L9238] and calls audit [9243][L9243]. A2 JSONBin-only quarantine would leave these capabilities active. |
| Direct preferences | Final column toggle [4781][L4781] → retained `saveSlCols` [4538][L4538]; compact preference writes at [5105][L5105]. These bypass `DB.set`. |

## Complete storage mutation-site categories

This table preserves all direct `localStorage`, `DB.set`/`DB.del` and storage-port restore sites in the reviewed inventory. Replaced sites remain listed so instrumentation does not mistake a token count for winning-route coverage. Indirect audit callers share the append site [8512][L8512]; Apps Script Push/Pull and business wrappers above are included as callers. No application `localStorage.clear()` was found. Displayed tutorial examples at [3821][L3821]/[3822][L3822] and the formatted save example at [3811][L3811] are text inside UI templates, not application mutation sites.

| Category | Exact sites and classification |
| --- | --- |
| Raw adapter | setItem [904][L904]; removeItem [905][L905]; delegates to prefixed localStorage. |
| Invoice save | edit/new invoices [1290][L1290]/[1307][L1307]; new-invoice settings/counter [1308][L1308]; retained base chain above. |
| Dispatch/cancel/restore | replaced quick dispatch [1430][L1430]; toggle [1538][L1538]; cancel [6696][L6696]; restore [6710][L6710]; final quick dispatch [7405][L7405]. |
| Invoice/old-bill deletion | replaced base [1424][L1424]; previous bill [3175][L3175]; replaced safe-delete [4818][L4818]; final invoice [8572][L8572]. |
| Previous bills / CSV | single bill [2485][L2485]; legacy CSV [2549][L2549]; bulk bills [3346][L3346]; Excel CSV invoices [5046][L5046]. Separate globals/routes are not full recovery formats. |
| Invoice receipts | replaced base [1583][L1583]; normal [2657][L2657]; replaced prompt-edit [3563][L3563]; deletePayment [3577][L3577]; standalone [3628][L3628]; final edit [4148][L4148]; deletePaymentEntry [6941][L6941]; settlement [8835][L8835]. |
| Retail | retained save [1605][L1605]; separate delete [1628][L1628]. |
| Purchases | replaced save [1732][L1732]; replaced delete [1786][L1786]; bulk [7921][L7921]; receipt [8085][L8085]; receipt delete [8105][L8105]; final save [8412][L8412]; final delete [8587][L8587]; Payment Out [9821][L9821]. |
| Items | retained save [1840][L1840]; replaced delete [1842][L1842]; quick-add [2363][L2363]; CSV [5053][L5053]; final delete [8609][L8609]; GS merge [9227][L9227]. |
| Parties | retained quick-add [1070][L1070]; replaced base save/delete [1901][L1901]/[1903][L1903]; previous-bill quick-add [3145][L3145]; replaced area save [3747][L3747]; quick-add [4384][L4384]; final save [4444][L4444]; CSV [5060][L5060]; quick-phone [7390][L7390]; purchase quick-add [7765][L7765]; final delete [8599][L8599]; GS merge [9238][L9238]. |
| Settings | custom-field add/remove [2145][L2145]/[2153][L2153]; final save-chain [2185][L2185]/[2882][L2882]/[9277][L9277]/[10221][L10221]; GS URL [5074][L5074]; print settings [5626][L5626]. |
| Audit / clear | audit append/cap of 500 entries [8512][L8512]; inline Clear Audit [8961][L8961]; Clear All [2240][L2240] deletes six keys individually, leaving audit/preferences/version/unknown keys. |
| Startup migrations | V5 invoices [2309][L2309], direct app_version [2312][L2312]; V13 invoices [7455][L7455]; V14 purchases [7512][L7512]; V15 invoices/purchases [9336][L9336]/[9345][L9345]. |
| JSONBin Pull | Six independent overwrites [2701][L2701]/[2702][L2702]/[2703][L2703]/[2704][L2704]/[2705][L2705]/[2706][L2706]. Push [2668][L2668] and Create Bin [2716][L2716] are separate outbound operations; all three need explicit A2 consent. |
| GS Pull | items [9227][L9227]; parties [9238][L9238]; indirect audit [9243][L9243] → [8512][L8512]. GS Push indirect audit [9194][L9194] → [8512][L8512]. |
| V1 restore | marker [778][L778]; apply [782][L782]; remove marker [788][L788]; rollback remove/set [797][L797]; rollback cleanup [802][L802]. Storage is an injected port in VM QA and actual localStorage through import UI. |
| V4 restore | marker [860][L860]; apply [864][L864]; remove marker [868][L868]; rollback removal [874][L874]; cleanup [877][L877]. |
| Direct preferences | `v8_slcols` [4538][L4538] through final toggle [4781][L4781]; `v8_compact` [5105][L5105]. |

## Immediate initialization and closure limits

Ordinary source initializes V5 by calling `runMigrations()` at [2886][L2886], V13 at [7436][L7436], V14 at [7501][L7501] and V15 at [9328][L9328] before a late diagnostic panel could prevent their writes. V5 checks `shop4_import_pending`; the later migrations do not share that early guard. The pending-import notice at [886][L886] is a DOMContentLoaded callback, and normal load/navigation/keyboard handlers at [2258][L2258] remain separate. These facts block a claim that ordinary app launch is read-only.

`getPrintSettings` [5600][L5600], `isCancelled` [6623][L6623] and `auditLog` [8497][L8497] are local to different enclosing patch scopes. Final global functions can retain access to their own closure; a different patch's later function does not gain access just because the name appears in the same HTML file. A full-runtime test must preserve source order and actual lexical scope. Current snippet mocks and A1a static inventory do not resolve or certify these runtime limitations.

The future [diagnostic contract](PLAN_A_DIAGNOSTIC_CONTRACT.md) therefore requires a separately reviewed launch boundary that never runs ordinary initialization. All historical-financial, read/write-failure, accounting, browser, native-file, hardware and owner-copy gates stay in the test matrix with their actual evidence status.

[L697]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L697
[L698]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L698
[L706]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L706
[L715]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L715
[L740]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L740
[L778]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L778
[L782]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L782
[L788]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L788
[L797]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L797
[L802]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L802
[L860]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L860
[L864]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L864
[L868]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L868
[L874]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L874
[L877]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L877
[L886]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L886
[L901]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L901
[L902]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L902
[L904]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L904
[L905]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L905
[L907]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L907
[L920]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L920
[L1070]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1070
[L1242]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1242
[L1290]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1290
[L1292]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1292
[L1307]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1307
[L1308]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1308
[L1309]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1309
[L1422]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1422
[L1424]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1424
[L1427]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1427
[L1430]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1430
[L1538]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1538
[L1573]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1573
[L1583]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1583
[L1605]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1605
[L1628]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1628
[L1712]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1712
[L1732]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1732
[L1786]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1786
[L1833]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1833
[L1840]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1840
[L1842]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1842
[L1894]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1894
[L1901]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1901
[L1903]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1903
[L2145]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2145
[L2153]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2153
[L2170]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2170
[L2185]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2185
[L2191]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2191
[L2240]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2240
[L2258]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2258
[L2309]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2309
[L2312]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2312
[L2363]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2363
[L2485]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2485
[L2549]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2549
[L2636]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2636
[L2657]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2657
[L2668]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2668
[L2701]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2701
[L2702]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2702
[L2703]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2703
[L2704]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2704
[L2705]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2705
[L2706]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2706
[L2716]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2716
[L2875]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2875
[L2882]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2882
[L2886]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2886
[L3145]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3145
[L3175]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3175
[L3346]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3346
[L3547]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3547
[L3563]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3563
[L3569]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3569
[L3577]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3577
[L3607]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3607
[L3628]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3628
[L3638]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3638
[L3729]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3729
[L3747]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3747
[L3811]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3811
[L3821]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3821
[L3822]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3822
[L4091]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L4091
[L4133]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L4133
[L4148]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L4148
[L4384]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L4384
[L4427]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L4427
[L4444]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L4444
[L4538]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L4538
[L4781]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L4781
[L4818]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L4818
[L5046]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L5046
[L5053]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L5053
[L5060]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L5060
[L5074]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L5074
[L5077]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L5077
[L5092]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L5092
[L5105]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L5105
[L5600]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L5600
[L5626]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L5626
[L6623]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L6623
[L6696]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L6696
[L6710]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L6710
[L6934]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L6934
[L6941]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L6941
[L7390]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L7390
[L7399]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L7399
[L7405]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L7405
[L7436]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L7436
[L7455]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L7455
[L7501]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L7501
[L7512]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L7512
[L7765]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L7765
[L7921]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L7921
[L8069]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8069
[L8085]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8085
[L8105]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8105
[L8380]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8380
[L8381]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8381
[L8412]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8412
[L8497]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8497
[L8512]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8512
[L8547]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8547
[L8568]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8568
[L8572]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8572
[L8577]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8577
[L8583]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8583
[L8587]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8587
[L8595]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8595
[L8599]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8599
[L8605]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8605
[L8609]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8609
[L8619]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8619
[L8631]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8631
[L8638]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8638
[L8648]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8648
[L8653]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8653
[L8662]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8662
[L8797]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8797
[L8826]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8826
[L8835]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8835
[L8836]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8836
[L8961]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8961
[L9173]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9173
[L9194]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9194
[L9204]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9204
[L9227]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9227
[L9238]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9238
[L9243]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9243
[L9271]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9271
[L9277]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9277
[L9288]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9288
[L9328]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9328
[L9336]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9336
[L9345]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9345
[L9787]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9787
[L9821]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9821
[L9824]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9824
[L9825]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9825
[L10218]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L10218
[L10221]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L10221
[L10273]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L10273
