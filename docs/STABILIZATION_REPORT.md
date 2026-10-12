# Phase A stabilization report

Phase A continues from PR #5 at d07729e on `codex/xl-release-1-stabilization`. The user authorized fixing the audit's blockers, so the old audit stop is superseded by this phase's results. The original audit and its failing evidence remain unchanged.

## Completed fixes

- R1-01/R1-09: a legitimate paid aggregate with absent/empty history is an undated opening amount. On an explicit payment action it is preserved in optional `openingPaid` metadata, including explicit zero for modern histories. No dated receipt is fabricated. `paid = openingPaid + sum(payments.amt)` at paise precision. A nonempty conflicting history is rejected without changes.
- Historical purchase `discount`/`discounts` fields remain intact. They reduce the payable balance separately from paid amounts. `balance = round2(total - paid - separateDiscount)`. Invoice commercial discounts already included in total are not deducted twice.
- R1-02: fractional-paise, negative/nonfinite and unsafe money inputs are rejected before mutation. Validation, storage and allocation totals use the same accepted paise values. Original fractional legacy totals are retained; cent-level comparisons follow their displayed rounded value.
- R1-03: all four automatic storage migrations are removed. Missing balance/status/payment type and legacy item `amount` aliases are handled at read/display points, without writing collections or version markers. Viewing/reloading preserves original bytes.
- R1-04: missing keys are distinct from corrupt JSON, JSON null, denied reads and wrong shapes. Unreadable storage blocks writes with a persistent alert and preserves raw bytes.
- R1-07/R1-08: old-bill deletion, invoice/purchase/party/item/retail/payment deletion, clear-all, clear-audit and persisted custom-field removal use the PIN guard. Confirmation checks unchanged selected content and current credentials. Stale payment indexes cannot target a different receipt. Errors keep the dialog visible.
- R1-10: HTML text/attributes are encoded across existing template paths; unsafe URL schemes, executable identifiers/references and numeric source literals are rejected. Search text is escaped and print CSS font size is numeric and bounded. Print payload checks inspect generated HTML. This retains the existing standalone structure and workflows.

## Actual verification

Before Phase A runtime changes, the stabilization audit failed all 12 probes with zero harness errors. It now passes all 12 in each of Chromium, Firefox and WebKit (36 passes). Source-bound JSON reports: test/review/stabilization-before-chromium.json and stabilization-after-{chromium,firefox,webkit}.json.

The expanded functional run passes 114 browser cases across all three engines, ten Node unit/property cases and the preserved parcel VM check. The strengthened search/print payload checks additionally pass six cases across the engines; both fail against pre-fix source e49b3c8. Legacy startup/read cases show seven failures before and seven passes afterward; PIN/stale supplier cases show three failures before and three passes afterward. A last-receipt deletion regression was found and fixed with a new unit case.

Lint: zero errors, 142 legacy warnings. Build is byte-identical to the self-contained source. SHA-256: `880034b3bfdd6833ea35f1c175fc57584952d7ef550203cb84ec0dfd1ea07934`.

Fresh isolated file-based contexts confirmed secure context, usable exclusive browser locks and IndexedDB in all three engines. Folder picking is available in Chromium and absent in Firefox/WebKit; future automatic backups need a manual/reminder fallback.

## Limits and next phase

P0-6/P0-7/P0-8 are not implemented or verified here. Quota failures can still leave multi-key writes incomplete; current backup/restore remains unsafe. These tests do not gate completed Phase A and will be addressed on the separate foundation branch. No unsupported localStorage atomicity is claimed. Physical devices/printers, physical crash durability, full performance budgets and the audit's deferred medium view/report issues are not verified.

Work status is split into WORK_COMPLETED.md, WORK_BLOCKED.md and WORK_UNIMPLEMENTED.md. All fixtures/profiles were synthetic. Main, PR #5, hosting and actual customer/billing data were not modified or accessed.
