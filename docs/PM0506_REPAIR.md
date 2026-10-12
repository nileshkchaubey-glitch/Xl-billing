# PM-05 and PM-06 repair evidence

These repairs were developed in the isolated `codex/xl-pm-reports` worktree based on PR #9 at `5d3fb7991586d7acef84d49cdd26a003b290d912`. No production profile, real business records, main branch, remote deployment, or real external service was accessed. Every billing fixture is synthetic. The final integrated branch requires its own final verification; this report records the focused subtask evidence.

## Completed repairs

| Finding | Changed behavior | Affected functions |
| --- | --- | --- |
| PM-05, High | Actual receipt/payment rows are separate from invoice/purchase/retail accrual rows. Discount and Credit/adjustment settlements do not increase cash in/out. Unknown explicit modes are visible as unclassified rather than assumed cash. Cancelled invoices retain their actual receipts in cash reporting. | `paymentReportKind`, `getAllPayments`, `renderPaymentLedger`, `renderTxnPage`, `renderDashboard` |
| PM-05 label regression, High | Aggregate `paid` fields are labelled Settled in reachable sales summaries, invoice printing, and reports. These fields may include opening and noncash settlements and therefore are not labelled cash received. | Sales/report renderers, printable invoice |
| PM-06, High | Reports, party item drilldown, invoice/purchase views, and amount display consumers use the same read-time legacy alias. `amt` remains canonical, including zero; `amount` is used only when `amt` is absent/null. Numeric-string legacy line amounts remain readable. | `lineRecordedAmount`, `renderItemRep`, line display consumers |

`reportMoneySum` sums report amounts in paise. None of these read-time functions writes a normalization, changes saved financial totals, renumbers an invoice, changes a payment history, or changes a backup format. Commercial invoice discounts remain in the saved invoice calculation; settlement discounts remain distinct from actual cash. Supplier `discounts` histories remain separate from supplier `paid` histories, as required by the existing format.

The cash classification includes the application's Cash, UPI, NEFT/RTGS, Cheque and Card options and explicit NEFT, RTGS, IMPS, Bank Transfer and Online receipt modes. Missing modes retain the application's existing Cash default. Unknown explicit modes are displayed separately and require review. A cheque entry is a recorded receipt, not proof of bank clearance. No refund is inferred from cancellation.

Undated historical `openingPaid`, or a paid aggregate with no payment history, is reported as an undated opening settlement. It is not fabricated into a dated cash receipt. Monthly receipt totals use receipt dates, including retained receipts from cancelled invoices. Active invoice sales and invoice due exclude cancelled invoices. Retail sale totals remain separate from dated invoice cash receipts.

## Additional owner-authorized opening balance policy

The owner clarified: **“Treat positive values as receivable and negative values as credit.”** This sign policy applies to every party type. A positive supplier-master opening is not silently inverted to a purchase payable. Purchase bill payables remain a separate component; no automatic supplier netting is inferred.

Party detail, party ledger, dashboard, and outstanding reports show invoice due and signed opening receivable/credit components. Signed net amounts remain signed, including a credit larger than invoice due. Outstanding aging buckets contain invoice balances only; the opening component is shown separately. Master opening associations use party IDs, not a matching party name. Unlinked invoice histories remain their own groups.

The invoice settlement modal shows the opening and net receivable components. It explicitly states that opening balances are unchanged and opening credits are not automatically consumed. Settlement continues to allocate only against actual invoice balances. No supported opening-balance payment/credit-allocation record format currently exists, so this work does not invent one or silently rewrite `openingBal`.

The first opening test evidence captured a provisional customer-only interpretation. The owner question and sign answer apply to all parties; the provisional customer-only test interpretation was corrected. That provisional evidence is retained in `opening-policy-before-chromium.json`; the corrected all-party acceptance evidence is `opening-policy-all-roles-before-chromium.json` and the final files listed below. The correction changes policy expectations transparently, rather than marking an old failing result as verified.

## Test-first evidence

| Stage | Result | Evidence |
| --- | --- | --- |
| Unchanged PR #9, original owner assertions | 1 PASS, 2 FAIL, 0 harness errors | `test/pm-reports/owner-before-chromium.json`: cash filter 50 versus real receipt ledger 40; legacy saved amount 6 reported 0; cancellation preserves cash |
| Unchanged PR #9, additional independent probes | 0 PASS, 4 FAIL, 0 harness errors | `test/pm-reports/before-chromium.json`: cancelled receipts missing from cash filter; Credit/unknown entries wrongly counted as cash; undated opening totals absent; item amount alias omitted |
| After PM-05, before PM-06 | 3 PASS, 1 FAIL, 0 harness errors | `test/pm-reports/after-pm05-chromium.json`: legacy item defect remains a failure |
| After PM-06 | 4 PASS, 0 FAIL, 0 harness errors | `test/pm-reports/after-pm06-chromium.json` |
| Before signed opening policy and Settled label repair, corrected acceptance | 3 PASS, 6 FAIL, 0 harness errors | `test/pm-reports/opening-policy-all-roles-before-chromium.json`, source matching `96a2188` |
| Final focused reporting probes, Chromium / Firefox / WebKit | 9 PASS per engine, 0 FAIL, 0 harness errors | `test/pm-reports/after-final-{chromium,firefox,webkit}.json` |
| Final original owner assertions, Chromium / Firefox / WebKit | 4 PASS per engine, 0 FAIL, 0 harness errors | `test/pm-reports/owner-after-final-{chromium,firefox,webkit}.json` |

The final 39 focused checks ran on exact subtask commit `588955a823d2e14b19b35a21af0b757ce0e1b3e8`. Its `index.html` SHA-256 is `319b59cee04ede7adf3d04cce2470f6e2e79064e3ec6f36dd913858c0a404c7b`. Every final JSON includes the tested commit, application hash, runner hash, engine, and observed values. The final reporting probes additionally cover canonical `amt:0` with `amount:6`, numeric-string aliases, read-only byte preservation, paise summation, +25/-25/-200 opening values, a positive supplier opening, unlinked matching names, retained cancelled receipts, and actual sales/print labels.

Original `transaction-discount-cash`, `legacy-item-report`, `cancel-restore-accounting`, and `party-opening-ledger` assertions were preserved. The original opening assertion now reports 185: opening receivable 25 plus two invoices due 80 each. The report runner freezes the disposable browser clock before initialization to October 12, 2026; business-month assertions therefore remain reproducible outside October.

Reproduce the additional probes with `XL_PM_REPORT_BROWSER=chromium|firefox|webkit node scripts/verify-pm-reports.cjs`. The original assertions use `XL_PREMERGE_ONLY=transaction-discount-cash,legacy-item-report,cancel-restore-accounting,party-opening-ledger node scripts/verify-premerge.cjs`. Local browser execution used the existing synthetic browser-library directory with `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` and `LD_LIBRARY_PATH=/tmp/xl-browser-libs/root/usr/lib/x86_64-linux-gnu`; actual browser launch and test failures were not suppressed.

The static build passed and remains a self-contained `index.html` copy without runtime dependencies. Lint passed with zero errors and the existing 143 warnings. No new dependency, plugin, skill, runtime service, paid feature, or backend was installed for this subtask. Existing Node v24.19.0 and Playwright 1.64.0 dependencies were sufficient. The isolated invoice-entry VM used by the root integration requires the actual shared `lineRecordedAmount` helper after replacing its duplicated alias expression; loading the real helper preserves its existing assertions and avoids a fabricated mock.

## Remaining limitations and unimplemented work

- This is focused verification, not a merge approval. Full integrated Node/browser/CI verification and the root's remaining-risk review must pass on the final branch head.
- Opening-balance collection, credit allocation, supplier payable netting, and explicit refund records are unimplemented. Their component values and limitation are visible; historical bytes are preserved.
- A conflicting dual line alias retains established canonical `amt` precedence. This is a read-time compatibility rule, not a historical repair or proof that the alternate legacy field is correct. Unconfirmed `quantity` aliases are not invented; the existing final billing quantity field remains `qty`.
- Unknown explicit payment modes remain outside certified cash totals until reviewed. No receipt date, refund, bank clearance, or authenticated operator identity is invented.
- Unsupported older clients, physical printing, real device capacity, actual customer archives, and live optional sync services are not verified by these isolated report checks.
