# Verification evidence

This document records the earlier Release 1 checkpoint. Current Phase A/foundation status and evidence are in [FOUNDATION_REPORT.md](FOUNDATION_REPORT.md).

The results below describe the earlier hotfix checkpoint. The subsequent
[full code review](RELEASE1_CODE_REVIEW.md) rejects the Release 2 gate: 24 distinct
safety assertions fail in each of Chromium, Firefox and WebKit. See
[new regression evidence](../test/review/REGRESSION_EVIDENCE.md) and the linked
safety reports. Earlier green tests do not verify recovery, complete backups or
historical payment compatibility.

Only the hotfix checkpoint is delivered. Later-stage work is not finalized. Tests use synthetic data and isolated browser profiles. No real shop data was used. Commands and raw outputs are committed in test-results.

| ID | Problem/root cause | Change | Files/functions | Tests / real evidence | Status |
| --- | --- | --- | --- | --- | --- |
| P0-1 | Malformed PIN attributes and free-text quote injection | Event listeners, salted hash setup, escaped data attributes; protect six deletion routes | withDeletePin, pinDigest, deletePaymentEntry, delRetail, partyAC/settlement handlers | P0-1 tests; p01.log, p01-quoted-before.log, p01-handlers-after.log | PARTIAL — tested core routes; exhaustive three-dot/menu/old-PIN settings acceptance incomplete |
| P0-2 | Closure-local helper names used by later scripts | Shared predicates and explicit window exports | isCancelled/isDeleted/isActive, pgState/renderPageBtns, getPrintSettings/auditLog | P0-2 seeded crawl; lint.log | PARTIAL — no-undef clean and page/report crawl green; exhaustive modal/menu crawl not complete |
| P0-3 | Final renderer could not see pagination state/helpers | Seven-list paging/size/sort controls; stable data sorting before slicing | listView/listPager/listHeaders, winning list renderers | P0-3 tests; p03.log; release1-full.log | PARTIAL — 1,200 reachability and controls verified; 4,200/stress/performance and every sort combination pending |
| P0-4 | Payments exceeded balance; clamping hid corruption; audit logged failed attempts | Validate before writes and recompute payment totals; reject conflicting edits | allowPayment, reconcilePayment, savePayment/savePurPayment/saveSettlement/saveEditPayment | P0-4 browser tests; payment.test.cjs (1,000 generated sequences), p04.log | PARTIAL — listed payment routes verified; complete purchase/Payment Out/legacy/soak acceptance pending |
| P0-5 | Previous-bill batches restarted at 1; typed numbers not checked | Scan maximum including cancelled records; store per-prefix counters; reject duplicate typed old bills | nextInvoiceNumber, pbSaveAll/savePrevBill, base invoice creation | P0-5 tests; numbering.test.cjs; p05-single-before/after.log | PARTIAL — batches/single typed numbers verified; duplicate repair, imports and atomic quota/tab safety pending |
| P0-6 | Safe storage layer (B6). | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P0-7 | Complete, verifiable backup and safe restore (B7). | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P0-8 | Free automatic backup + reminders. | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P1-1 | Money correctness (B8). | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P1-2 | Validation everywhere. | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P1-3 | HTML-escape all user text (B12). | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P1-4 | Real soft delete + Recycle Bin (B9). | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P1-5 | Edit integrity. | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P1-6 | Double-submit / idempotency. | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P1-7 | Dates, timezone, financial year (B13). | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P1-8 | Printing that always works. | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P1-9 | Keyboard-first speed (core requirement: fast daily billing). | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P1-10 | Consolidate the stacked patches (Release 3 only). | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P1-11 | UI polish. | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P1-12 | Multi-tab / multi-device safety. | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P1-13 | Report reconciliation. | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P1-14 | Shell command text leaked into HTML body | Remove exactly three stray lines | index.html between v15/v16 and final entry patch | P1-14 browser test; p114.log | VERIFIED |
| P2-1 | GST done properly. | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P2-2 | Inventory. | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P2-3 | Financial-year invoice series. | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P2-4 | IndexedDB storage engine behind the storage adapter. | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P2-5 | PWA/offline. | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P2-6 | Optional encrypted backup | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P2-7 | Remove third-party data egress. | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P2-8 | WhatsApp sharing. | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |
| P2-9 | Owner mobile view. | No implementation delivered at this checkpoint | — | No acceptance test run for this item | NOT VERIFIED / NOT DONE — subsequent staged work remains |

## Real command outputs

### `npm run test:baseline`

Raw log: [test-results/baseline.log](../test-results/baseline.log).

```text
  ✘   1 [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 invoice: PIN setup, wrong PIN, Enter and audit (30.1s)
  ✘   2 [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 purchase: PIN setup, wrong PIN, Enter and audit (30.1s)
  ✘   3 [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 party: PIN setup, wrong PIN, Enter and audit (30.1s)
  ✘   4 [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 item: PIN setup, wrong PIN, Enter and audit (30.1s)
  ✘   5 [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 payment: PIN setup, wrong PIN, Enter and audit (5.3s)
  ✘   6 [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 retail: PIN setup, wrong PIN, Enter and audit (5.3s)
  ✘   7 [chromium] › test/e2e/hotfix.spec.cjs:18:1 › P0-1 dialog escapes labels, traps focus, cancels with Esc (5.3s)
  ✘   8 [chromium] › test/e2e/hotfix.spec.cjs:19:1 › P0-2 all pages and report tabs render with seeded data (469ms)
  ✘   9 [chromium] › test/e2e/hotfix.spec.cjs:25:1 › P0-3 pagination reaches next and last invoice, totals cover all (5.7s)
  ✘  10 [chromium] › test/e2e/hotfix.spec.cjs:26:1 › P0-4 overpayment rejected without invoice or audit writes (403ms)
  ✓  11 [chromium] › test/e2e/hotfix.spec.cjs:27:1 › P0-4 exact payment and delete preserve totals (325ms)
  ✘  12 [chromium] › test/e2e/hotfix.spec.cjs:28:1 › P0-4 purchase overpayment rejected (312ms)
  ✘  13 [chromium] › test/e2e/hotfix.spec.cjs:29:1 › P0-5 batches and typed numbers never collide (483ms)
  ✘  14 [chromium] › test/e2e/hotfix.spec.cjs:34:1 › P1-14 no stray shell text on any page (397ms)
  ✓  15 [chromium] › test/e2e/hotfix.spec.cjs:35:1 › characterization: invoice entry, edit, cancel and restore (450ms)
  1) [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 invoice: PIN setup, wrong PIN, Enter and audit 
    test-results/browser/hotfix-P0-1-invoice-PIN-setup-wrong-PIN-Enter-and-audit-chromium/test-failed-1.png
  2) [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 purchase: PIN setup, wrong PIN, Enter and audit 
    test-results/browser/hotfix-P0-1-purchase-PIN-setup-wrong-PIN-Enter-and-audit-chromium/test-failed-1.png
  3) [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 party: PIN setup, wrong PIN, Enter and audit ─
    test-results/browser/hotfix-P0-1-party-PIN-setup-wrong-PIN-Enter-and-audit-chromium/test-failed-1.png
  4) [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 item: PIN setup, wrong PIN, Enter and audit ──
    test-results/browser/hotfix-P0-1-item-PIN-setup-wrong-PIN-Enter-and-audit-chromium/test-failed-1.png
  5) [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 payment: PIN setup, wrong PIN, Enter and audit 
    Error: expect(locator).toBeVisible() failed
    test-results/browser/hotfix-P0-1-payment-PIN-setup-wrong-PIN-Enter-and-audit-chromium/test-failed-1.png
  6) [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 retail: PIN setup, wrong PIN, Enter and audit 
    Error: expect(locator).toBeVisible() failed
    test-results/browser/hotfix-P0-1-retail-PIN-setup-wrong-PIN-Enter-and-audit-chromium/test-failed-1.png
  7) [chromium] › test/e2e/hotfix.spec.cjs:18:1 › P0-1 dialog escapes labels, traps focus, cancels with Esc 
    Error: expect(locator).toContainText(expected) failed
    test-results/browser/hotfix-P0-1-dialog-escapes-9a4ad-raps-focus-cancels-with-Esc-chromium/test-failed-1.png
  8) [chromium] › test/e2e/hotfix.spec.cjs:19:1 › P0-2 all pages and report tabs render with seeded data 
    test-results/browser/hotfix-P0-2-all-pages-and--502d0-abs-render-with-seeded-data-chromium/test-failed-1.png
  9) [chromium] › test/e2e/hotfix.spec.cjs:25:1 › P0-3 pagination reaches next and last invoice, totals cover all 
    Error: expect(locator).toBeVisible() failed
    test-results/browser/hotfix-P0-3-pagination-rea-21a08-st-invoice-totals-cover-all-chromium/test-failed-1.png
  10) [chromium] › test/e2e/hotfix.spec.cjs:26:1 › P0-4 overpayment rejected without invoice or audit writes 
    test-results/browser/hotfix-P0-4-overpayment-re-a271b-out-invoice-or-audit-writes-chromium/test-failed-1.png
  11) [chromium] › test/e2e/hotfix.spec.cjs:28:1 › P0-4 purchase overpayment rejected ──────────────
    test-results/browser/hotfix-P0-4-purchase-overpayment-rejected-chromium/test-failed-1.png
  12) [chromium] › test/e2e/hotfix.spec.cjs:29:1 › P0-5 batches and typed numbers never collide ────
    test-results/browser/hotfix-P0-5-batches-and-typed-numbers-never-collide-chromium/test-failed-1.png
  13) [chromium] › test/e2e/hotfix.spec.cjs:34:1 › P1-14 no stray shell text on any page ───────────
    test-results/browser/hotfix-P1-14-no-stray-shell-text-on-any-page-chromium/test-failed-1.png
  13 failed
    [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 invoice: PIN setup, wrong PIN, Enter and audit 
    [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 purchase: PIN setup, wrong PIN, Enter and audit 
    [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 party: PIN setup, wrong PIN, Enter and audit ──
    [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 item: PIN setup, wrong PIN, Enter and audit ───
    [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 payment: PIN setup, wrong PIN, Enter and audit 
    [chromium] › test/e2e/hotfix.spec.cjs:6:2 › P0-1 retail: PIN setup, wrong PIN, Enter and audit ─
    [chromium] › test/e2e/hotfix.spec.cjs:18:1 › P0-1 dialog escapes labels, traps focus, cancels with Esc 
    [chromium] › test/e2e/hotfix.spec.cjs:19:1 › P0-2 all pages and report tabs render with seeded data 
    [chromium] › test/e2e/hotfix.spec.cjs:25:1 › P0-3 pagination reaches next and last invoice, totals cover all 
    [chromium] › test/e2e/hotfix.spec.cjs:26:1 › P0-4 overpayment rejected without invoice or audit writes 
    [chromium] › test/e2e/hotfix.spec.cjs:28:1 › P0-4 purchase overpayment rejected ────────────────
    [chromium] › test/e2e/hotfix.spec.cjs:29:1 › P0-5 batches and typed numbers never collide ──────
    [chromium] › test/e2e/hotfix.spec.cjs:34:1 › P1-14 no stray shell text on any page ─────────────
  2 passed (2.5m)
```

### `npm test`

Raw log: [test-results/release1-full.log](../test-results/release1-full.log).

```text

> xl-billing@1.0.0 test
> node qa/verify-invoice-entry.cjs && node --test test/unit/*.test.cjs && playwright test

PASS: parcel/open-box calculation, decimals, immediate totals, invalid inputs, legacy quantities, settings preservation.
✔ P0-5 case-insensitive numbers include cancelled records and scan maximum (0.894382ms)
✔ P0-5 two batches and stale counters cannot generate duplicates (seed 20261012) (27.791917ms)
✔ P0-4 random payments and replacements preserve paid and balance (seed 20261012) (107.436151ms)
✔ all embedded scripts parse without compilation errors (8.750603ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 381.353613

  ✓  61 [webkit] › test/e2e/hotfix.spec.cjs:46:1 › P0-4 settlement and standalone reject excess payment and discount (873ms)
  ✓  62 [webkit] › test/e2e/hotfix.spec.cjs:50:1 › P0-4 edit payment cannot increase past invoice total (687ms)
  ✓  63 [webkit] › test/e2e/hotfix.spec.cjs:51:1 › characterization: file origin works offline without outgoing requests (1.1s)
  ✓  64 [webkit] › test/e2e/hotfix.spec.cjs:54:1 › visual evidence: desktop and mobile pages (515ms)
  ✓  65 [webkit] › test/e2e/hotfix.spec.cjs:59:1 › P0-5 single old bill rejects an existing typed invoice number (695ms)
  ✓  66 [webkit] › test/e2e/hotfix.spec.cjs:62:1 › P0-1 quoted party names select and settle through real click handlers (887ms)

  66 passed (53.1s)
```

### `npm run mutations`

Raw log: [test-results/mutations.log](../test-results/mutations.log).

```text
> node scripts/mutations.cjs

B1: CAUGHT; 1 failing test(s)
B2: CAUGHT; 1 failing test(s)
B3: CAUGHT; 1 failing test(s)
B4: CAUGHT; 1 failing test(s)
B5: CAUGHT; 1 failing test(s)
5/5 mutations caught
```

### `npm run lint`

Raw log: [test-results/lint.log](../test-results/lint.log).

```text
  7642:9   warning  'discount' is assigned a value but never used                          no-unused-vars
  7678:31  warning  'invNo' is defined but never used                                      no-unused-vars
  7960:29  warning  'color' is defined but never used                                      no-unused-vars
  8067:11  warning  'e' is defined but never used                                          no-unused-vars
  8156:70  warning  'i' is defined but never used                                          no-unused-vars

✖ 143 problems (0 errors, 143 warnings)

```

### `npm run htmlcheck`

Raw log: [test-results/htmlcheck.log](../test-results/htmlcheck.log).

```text

> xl-billing@1.0.0 htmlcheck
> node scripts/htmlcheck.cjs

144 HTML validation errors; 0 warnings; see test-results/html-validation.json
```

### `npm run build`

Raw log: [test-results/build.log](../test-results/build.log).

```text

> xl-billing@1.0.0 build
> node scripts/build.cjs

Built dist/index.html: self-contained static copy; no runtime dependencies.
```

### `node qa/verify-invoice-entry.cjs`

Raw log: [test-results/legacy-qa.log](../test-results/legacy-qa.log).

```text
PASS: parcel/open-box calculation, decimals, immediate totals, invalid inputs, legacy quantities, settings preservation.
```

## Boundaries of the evidence

The baseline run was the original 15-test suite: 13 failed and 2 characterized working journeys passed. Later targeted tests reproduce quoted-name and single previous-bill defects before their fixes. The final suite grew to 22 tests per engine (66 total); additional post-run focus-trap assertions are verified by the targeted run. Mutation sanity deliberately recreates failures B1–B5 in temporary HTML files, never in the shipped file.

Browser engines run here, but no physical Windows/Android/iOS device or printer was tested. HTML validation reports legacy errors and lint reports legacy warnings; these are not hidden. WebKit used browser-local shared libraries and skipped only the static system-library lookup; real browser journeys ran. No performance budget, axe audit, PDF extraction, 365-day soak, historical migration round-trip or complete XSS suite is claimed.

Every minor check appears in [MINOR_CHECKS.md](MINOR_CHECKS.md) with a result and evidence/reason. The baseline storage/export limitations have not been repaired by this hotfix.

## Fresh checkout

Command: `npm ci && npm test && npm run lint && npm run build` in a new detached Git worktree. Exit status 0. Output: `66 passed`; `0 errors, 143 warnings`; `Built dist/index.html: self-contained static copy; no runtime dependencies.` Full captured output: [fresh-checkout.log](../test-results/fresh-checkout.log). The new PIN focus-cycle assertions are included in this final run.
