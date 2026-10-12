# Final owner pre-merge verification

**Decision: MERGE BLOCKED.** The combined application passes its existing automated regressions, but the independent owner gate fails financial/import, historical-report, purchase-number compatibility and printing requirements. Green PR #8 CI does not supersede these failures. Do not merge the stack, deploy it or update a live browser profile on this evidence.

Authority: [owner comment #6126054996](https://github.com/nileshkchaubey-glitch/Xl-billing/pull/8#issuecomment-6126054996). This review-only branch is `codex/xl-final-premerge-verification`, based on the owner's pinned PR #8 head. It adds tests, test-only CI and this report; **application `index.html` is unchanged**. No main changes, merge, deployment, real profile/record/key access, paid service or mandatory backend was performed. Physical printers and native mobile capabilities are **NOT VERIFIED**.

## Exact scope and branch dependencies

| Ref | Exact reviewed SHA | Dependency |
| --- | --- | --- |
| main | `29aeb20225bccfc653b192651de608491185096c` | Production baseline, read only |
| PR #5 | `d07729e60e6901fa1255a8331dde805c22890e9c` | `codex/xl-release-1-hotfix` → main |
| PR #6 | `0e4d9168406e0a57461f4c3bbebfa122263dc919` | `codex/xl-release-1-stabilization` → PR #5 |
| PR #7 | `aa9b03c5ff1968445a1a92197302796a26a3e824` | `codex/xl-release-2-foundation` → PR #6 |
| PR #8 | `f5cc2e3319179664d1cb6227dc28e7470428e58d` | `codex/xl-recovery-date-followup` → PR #7 |
| Local independent verification runner | `9fa289c9fc017af669b0d0d780a3edc7bfd4f589` | Review branch; same application bytes as PR #8 |

The exact final report-branch checkout is recorded by `tested_commit` in the final CI owner artifacts and the review PR's check run. CI explicitly checks out the PR **head SHA**, not a synthetic merge commit. Its final immutable SHA/run link is also recorded in the review PR description after execution. Report/evidence commits do not change the runtime or verification assertions.

Application SHA-256: `37cb3c09b5d165768666d3ccefae9478b10f08a7dc20f1dcc219cad91e596933`. The build is a byte-identical copy. The combined main→PR #8 diff has **163 changed files and 59 commits**. Every parent is an ancestor of its child; no stack commit was dropped. `git merge-tree --write-tree main PR8` succeeds with tree `759172bb19b1508fcec7b0616614b3ef6cbcf45d` and no conflict. This is a dry tree calculation, not a merge or main update.

[CHAIN.json](../test/premerge/CHAIN.json) lists all changed paths, exact refs, ancestry and source hashes. The combined changes introduce Node/Vite/Playwright development tooling and a read-only test workflow. They retain earlier generated logs, JSON inventories and 38 screenshots; these are historical artifacts, not proof of the present build. This review adds compact source-bound JSON, not generated image/PDF bundles. CI carries fresh images and PDFs as artifacts.

The runtime has no external script dependency, mandatory backend, Supabase or required environment credential. Existing optional Google Sheets/JSONBin integration is inherited and owner-configured. Tests block external requests; no live service/account journey is certified. Startup preservation was exercised with synthetic legacy records at the same HTTP, local HTTPS and file URL. A changed origin/path on a device is not an automatic data transfer.

**Merge ordering matters:** do not merge PR #5 alone into main. Its earlier audit identified unsafe intermediate behavior. If a corrected stack is eventually approved, assemble and review the complete stack before a single production transition. The owner states GitHub Pages deploys when main changes; treat any eventual main merge as a production deployment, even though the added CI workflow itself never deploys. Hosting settings were not changed or independently exercised.

## Commands and observed results

All profiles, PINs, credentials, receipts, files and TLS keys are synthetic. HTTP/HTTPS servers use loopback and disposable browser contexts; file upgrades use one temporary file path. The TLS certificate is generated for the test and trusted only in its disposable context. Same-origin upgrade assertions require the candidate's storage core to initialize and compare exact business/preference strings before/after.

```sh
git fetch origin
git merge-base --is-ancestor <parent-sha> <child-sha>
git merge-tree --write-tree 29aeb20225bccfc653b192651de608491185096c f5cc2e3319179664d1cb6227dc28e7470428e58d
XL_REPORT=/tmp/xl-premerge-regression.json npm test
XL_REVIEW_BROWSER=chromium XL_REVIEW_REPORT=/tmp/xl-premerge-safety-chromium.json npm run test:review
XL_REVIEW_BROWSER=firefox XL_REVIEW_REPORT=/tmp/xl-premerge-safety-firefox.json npm run test:review
XL_REVIEW_BROWSER=webkit XL_REVIEW_REPORT=/tmp/xl-premerge-safety-webkit.json npm run test:review
XL_PREMERGE_BROWSER=chromium XL_PREMERGE_REPORT=/tmp/xl-premerge-owner-final-chromium.json npm run test:premerge
XL_PREMERGE_BROWSER=firefox XL_PREMERGE_REPORT=/tmp/xl-premerge-owner-final-firefox.json npm run test:premerge
XL_PREMERGE_BROWSER=webkit XL_PREMERGE_REPORT=/tmp/xl-premerge-owner-final-webkit.json npm run test:premerge
npm run lint
npm run build
cmp index.html dist/index.html
```

The managed Linux workspace uses the existing temporary browser-library fallback described in ENVIRONMENT.md. Standard CI installs dependencies using `playwright install --with-deps`. It also runs the independent owner gate after the existing regression, lint and build steps; it retains failed gate reports as artifacts. Nonzero owner-gate exit is intentional **evidence of failed conformance**, never an expected pass.

| Check | Actual result | Evidence |
| --- | --- | --- |
| Parcel/open-box VM | PASS | `npm test` first step; preserved assertions |
| Node/unit/property/storage/backup/recovery | **63 passed, 0 failed**; all original 44 retained | [SUMMARY.json](../test/premerge/SUMMARY.json), CI logs |
| Existing complete E2E | **442 passed, 2 intentional screenshot skips**, 0 failures | 441 functional cases across Chromium/Firefox/WebKit, plus Chromium screenshot capture; no functional skips |
| Complete old safety runner | **69 PASS, 12 FAIL**, 0 harness errors | 23 PASS/4 FAIL per engine; [safety reports](../test/premerge/safety-chromium.json) and counterparts |
| Independent owner gate | **92 PASS, 37 FAIL**, 0 harness errors | 43 cases per engine: Chromium 30/13; Firefox 31/12; WebKit 31/12 |
| Targeted original-main comparison | **2 PASS, 7 FAIL**, 0 harness errors | [baseline-main.json](../test/premerge/baseline-main.json); supplier-number creation and legacy-item report pass on baseline |
| Lint | **0 errors, 143 existing warnings** | Exact output summary in SUMMARY.json and CI |
| Build | PASS, standalone file equals source SHA above | `cmp`, SUMMARY.json |
| PR #8 pinned CI | **Success**, 63 Node/442 browser passes, 2 capture skips, lint/build success | [run 38258451518](https://github.com/nileshkchaubey-glitch/Xl-billing/actions/runs/38258451518) |
| Final review CI | Exact-head existing steps and added owner gate | Review PR Checks / immutable run link in its description; do not substitute the green pinned run for this broader gate |

The old full safety runner initially needed harness corrections: its all-groups fixture lacked the current PIN for restore, and two view fixture writes bypassed the implemented transaction boundary. The final harness supplies synthetic PIN credentials and uses scoped setup writes. Assertions remain unchanged. Those initial harness errors are not counted as product failures. Master-form tests wait for the application's scheduled initial focus before typing; saved-value assertions remain intact.

## Critical workflow matrix

“PASS” covers the stated assertion, not arbitrary real customer histories or physical devices. JSON IDs below resolve directly in [Chromium](../test/premerge/owner-chromium.json), [Firefox](../test/premerge/owner-firefox.json) and [WebKit](../test/premerge/owner-webkit.json) owner reports.

| Workflow | Expected → observed | Status / evidence |
| --- | --- | --- |
| New Sale, desktop/390px | One INV-1003; total/due 100, paid 0, counter 1004, create audit → exact values | PASS `real-sale-*` |
| Packs/quantity and Tab entry | 0.1 units × 3 packs = 0.3; rate 20 → total/due 6 | PASS `real-packs-*`; parcel VM adds whole/invalid/open-box/legacy cases |
| Retail and report tabs, desktop/390px | Added 12.34; total sales 262.34; invoice-only customer due 160 → exact values | PASS `retail-reports-*` |
| Item/party creation, desktop | Rates 12.50/7.25 and stored party openingBal 25 → preserved | PASS `real-master-creation`; does not certify opening-balance ledger semantics |
| New Purchase and UPI receipt | 125.50 = paid 35.50 + due 90; history contains opening/payment UPI amounts | PASS `real-purchase-payment` |
| Payment Out | 20 opening cash + 12.34 UPI = paid 32.34; due 467.66 | PASS `real-payment-out` |
| Previous Bills | Paid 20/due 80; duplicate is refused unchanged; approved PIN deletes the selected bill | PASS `real-previous-bills` |
| Historical opening receipt and discounts | Opening 20 + cash 10 + discount 10 = settled 40/due 60; supplier 20 + 10 + 470 = 500 | PASS `opening-receipt-discounts` |
| Partial historical payment mismatch | Paid 30/history 20 → refused payment, exact original bytes retained | PASS `partial-history-rejected` |
| Actual invoice edit and receipt reversal | Total 100→120 with 20 receipt retained; current-PIN reversal leaves paid 0/due 120 | PASS `edit-reversal-pin`; reversal is receipt deletion, not an automatic cash refund |
| PIN setup/change/confirmation | Setup does not delete; old PIN fails after change; Enter confirms current PIN | PASS `edit-reversal-pin`; existing suite covers Escape, focus trap, wrong PIN and stale selection |
| Cancellation/restore | Cash 20 retained on cancellation; restored invoice has paid 20/due 80 | PASS `cancel-restore-accounting`; cross-report policy remains unresolved |
| Invoice quota: journal/invoice/settings/audit/revision | Exact original bytes/counter, visible error, no success, retry produces one number | PASS existing `recovery-followup.spec.cjs` real Save cases in final E2E |
| Cleanup failures/read denial | Verified commit is retained; reload required; no successful-rollback/retained-journal fabrication | PASS `invoice-cleanup-*` and existing rollback-cleanup denial cases |
| Corrupt/denied reads, abrupt interruption, corrupt journal, stale tab | Never reinterpret unreadable records as empty; recover checked evidence or block | PASS existing Node/storage/recovery/safety gates |
| Older tab writes before Save | Stale Save blocked; exact externally written state retained | PASS `older-tab-before-save` |
| Older writer between check and setItem | Synthetic extra receipt 5 survives → it is overwritten; Save succeeds | **FAIL**, unsupported isolation limit `older-writer-read-write-race` |
| Locked recovery, all normal scripts absent | Saved raw file reselected; checksum/state, full candidate validation, current PIN, preview and owner choice precede mutation | PASS existing 117 three-engine recovery cases; invalid/stale proofs remain unchanged |
| Valid private/legacy restore and corruption | Valid ordinary historical fixtures restore; bad checksum/schema/history and failed writes preserve recoverability | PASS existing backup/recovery cases; **supplier-number exception below** |
| Complete portable backup | Audit/settings, unknown compatible keys, preferences and synthetic credentials retain exact bytes/checksum | PASS `private-backup-complete` plus Node preference/legacy tests |
| Permission revocation and manual fallback | No background permission request, visible failure/reminder, billing bytes unchanged | PASS synthetic folder/permission ports; native chooser NOT VERIFIED |
| Baseline main→candidate at HTTP/HTTPS/file | Candidate core initialized; same-origin legacy records/preferences unchanged | PASS `baseline-upgrade-*`, all engines |
| Dates/FY/numbering | IST 00:30/23:30, October endpoints, March/April and December/January, three device zones; UTC events and saved series invariant | PASS final 60 business-date browser and 4 Node tests; no new series reset |
| Sale search/paging/ordering | Existing suite reaches last of 1,200 rows and preserves filtered totals | PASS stated cases; **not all-list ordering certification** |
| Purchase sort / audit user search / party transaction tab | P-1 first / 20 matching rows / visible content → P-2 first / 0 rows despite pager 25 / hidden tab | FAIL R1-11/12/13, safety reports |
| Mobile access to required destinations | Purchases/previous bills/masters/payment ledger reachable → no visible navigation in tested mobile routes | FAIL `mobile-workflow-reachability-390`; no scripted nav counted as mobile acceptance |
| Distinct suppliers each use P-1 | Baseline-supported creation and complete restore remain usable → creation and backup decode refused | **FAIL**, introduced compatibility blocker |
| Invalid CSV paid text | Reject explicit `not-a-number` without mutation → invoice imported with paid 0/due 100 | **FAIL** `csv-invalid-paid` |
| Own invoice CSV round trip | Subtotal 100 − discount 10 = total 90 → imported subtotal 90 − 10 = 80, stored total remains 90 | **FAIL** `csv-invoice-financial-round-trip` |
| Quoted/multiline CSV | Two exact names retained → quotes removed, multiline name split into two items; total three | **FAIL** `csv-round-trip` |
| CSV formula safety | Export literal `=1+1` → unneutralized formula prefix emitted | **FAIL** `csv-formula-neutralization`; physical spreadsheet execution NOT VERIFIED |
| Cash-in transaction filter | Actual receipts 40, discount excluded → reports 50, payment ledger reports 40 | **FAIL** `transaction-discount-cash` |
| Legacy line `amount:6` | Supported saved amount contributes 6 without rewriting → item report shows 0, bytes retained | **FAIL** `legacy-item-report` |
| A4 content/PDF | 40 lines and totals included → all 40/TOTAL/BALANCE DUE extracted | PASS software content/PDF; physical output NOT VERIFIED |
| A5 content/pagination | Complete invoice, two copies on one A4 page → 40-line content clips after 12 complete lines; PDF has 13 partial/distinct labels and no totals; short two-up PDF has two pages | **FAIL** `print-A5-*`; PDF pagination measured in Chromium only |
| Scale 500/2,000/5,000 | Commit or visible byte-preserving refusal → 500/2,000 commit; 5,000 refused at journal staging in all engines | PASS data safety `scale-*`, **capacity limitation**, not a production performance SLA |
| Real data, actual phone OS/folder chooser/printer/live sync | Owner hardware/profile verification | **NOT TESTED / NOT VERIFIED**, owner only |

## Blocking defects and required resolution

| ID / classification / severity | Inherited or introduced; evidence | Required resolution before approval |
| --- | --- | --- |
| PM-01 **BLOCKER / High** | **Introduced PR #7** (`7c2eee0`, `validateXLTransaction`): purchase `billNo` deduplication is global. Main accepts a second supplier's P-1; candidate refuses and its checked private backup cannot decode two supplier-linked P-1 records. Originals remain intact, but compatible recovery/workflow is unavailable. | Define supplier/FY identity policy with the owner; validate the appropriate composite identity across create, import, adoption and restore. Never rename historical vendor numbers or bypass validation to pass. Test legacy duplicate vendor numbers with distinct suppliers and ambiguous duplicates within one supplier. |
| PM-02 **BLOCKER / High** | Inherited `xlProcessCSV`: invalid explicit paid text silently becomes 0; existing accounting validation sees only the already-coerced numeric value. | Strict, finite field parsing and full-batch preflight before any write. Preserve rejected input and original records. Cover both CSV entry points, mixed valid/invalid rows and imported relationships. |
| PM-03 **BLOCKER / High** | Inherited CSV export/parser: quote/newline corruption and unneutralized formulas. Two own-exported item names become three altered items. | Implement a lossless supported CSV codec and a documented safe spreadsheet-cell policy. Validate round trips, escaped quotes, CR/LF, formulas and row structure. JSON private backup remains the recovery format. |
| PM-04 **BLOCKER / High** | Inherited invoice CSV import sets `subtotal=total`, discarding the own export's subtotal. 100/10/90 becomes 90/10/90. CSV also lacks full items/payment history/ID relationships. | Preserve/validate declared financial fields and compatible import schema; do not fabricate subtotals or party associations. Never present CSV as a complete rollback backup. |
| PM-05 **BLOCKER / High** | Inherited transaction calculation, **exposed by PR #5's missing-predicate/navigation repairs**: mode Discount is pushed as pay-in. Candidate cash filter 50 versus receipt ledger 40. Original main's renderer throws `isCancelled is not defined`, so dynamic baseline cash-filter behavior was not certified. | Separate cash receipts from noncash discounts/credits and accrual rows; reconcile independent report totals and cancellation/refund policy without erasing retained receipts. |
| PM-06 **BLOCKER / High** | Inherited `renderItemRep` assumes `amt`; **new compatibility exposure after PR #6 suppresses normalization**. Main's startup normalizes the alias and reports 6; candidate preserves `amount:6` but reports 0. | Add consistent read-time compatibility across financial reports/printing, without rewriting historical fields. Reconcile line amounts and active invoice totals with synthetic aliases. |
| PM-07 **BLOCKER / High** | Inherited `printInvoiceA5`: fixed height/hidden overflow removes billed lines and totals; short two-up Chromium PDF breaks onto two pages. | Prevent silent truncation: verified pagination or a visible refusal/fallback before printing. Validate long bills, totals and duplicate-copy page size. Native printer checks remain additional. |

These are genuine conformance failures, not requests to implement unrelated Release 2 features. No financial or schema workaround was applied during verification. The review branch intentionally carries a failing owner CI gate.

## Other unresolved risks and R1-11–R1-16 disposition

| Risk / classification / severity | Evidence and scope | Recommended resolution |
| --- | --- | --- |
| R1-11 **NON-BLOCKING DEFERRED / Medium** | Purchase ordering uses invoice field names; first P-2, zero sortable headers. Transaction sort field mismatch remains source-reviewed; not every sort option is independently certified. | Explicit per-list field maps and assertions for actual ordering. |
| R1-12 **NON-BLOCKING DEFERRED / Medium** | Audit user search: pager 25, visible rows 0; rerender recreates focused control. Stored audit remains intact. | One filter before paging; preserve focus and query. |
| R1-13 **NON-BLOCKING DEFERRED / Medium** | Party Transactions tab remains hidden after actual click. Invoice/payment tabs are separate. | Complete the tab controller and keyboard behavior. |
| R1-14 **OWNER ACCEPTANCE REQUIRED / High** | Cancelled invoice retains actual receipt; payment ledger includes it, active-invoice transaction/dashboard slices exclude it. “Net” mixes sales and payments. The old safety assertion expecting removal is a policy conflict, **not** permission to erase cash. PM-05 is a separate confirmed cash classification blocker. | Agree and clearly label cash/accrual/cancellation/refund semantics, then reconcile reports. |
| R1-15 **BLOCKER / High**, partly resolved | Duplicate/new overpaid/invalid-date CSV is safely refused; bounded counters pass. Remaining malformed-field coercion, own subtotal loss and vendor-number scope are PM-01/02/04. Bulk purchase generated vendor numbers restart per batch; validation can refuse a later batch safely. | Resolve parser and identity gates; characterize repeated bulk batches without changing sale-series rules. |
| R1-16 **BLOCKER / High**, partly resolved | IST/UTC boundaries now pass. CSV quoting/formulas and historical item reporting remain blockers. Linked party/item hard deletion and optional external sync have separate limits. | Resolve PM-03/06; define linked-master deletion and sync acceptance policies. |
| Mobile destinations **OWNER ACCEPTANCE REQUIRED / High** | Sidebar hidden at 390px, five mobile routes; required other destinations not reachable in the tested visible navigation graph. Reachable sale/retail/report controls work. | Provide tested navigation or explicitly restrict supported workflows/device use. No “mobile complete” claim. |
| Party opening balances **OWNER ACCEPTANCE REQUIRED / High** | Stored openingBal 25 survives; displayed customer outstanding remains invoice-only 160 instead of 185 if this is an opening receivable. Negative/positive opening values remain portable. | Define sign and ledger meaning; label informational fields or include them consistently. Never infer/overwrite owner balances. |
| Older copies **OWNER ACCEPTANCE REQUIRED / High** | Before-save drift detected. Deterministic noncooperating write between read/set loses synthetic receipt 5. Web Locks cannot exclude old writers, and localStorage has no compare-and-swap/multi-key atomicity. | Close every older copy, use one version/origin and keep independent backups. Do not claim isolation or durability outside the cooperative contract. |
| Capacity/quota **OWNER ACCEPTANCE REQUIRED / High** | 5,000 synthetic invoices occupy a ~2.74 MB serialized snapshot; checked journal cannot stage, but all business bytes/counters remain unchanged. 500/2,000 commit; measured Save flows ~1.2–3.3 seconds under concurrent managed tests. | Owner must test representative size on the actual device after fixes. Plan a reviewed free/offline storage design for larger profiles; never delete records to free quota. Count/size is not a guaranteed capacity. |
| Backups/PIN/physical durability **OWNER ACCEPTANCE REQUIRED / High** | Private files contain settings, PIN hashes and optional credentials; SHA-256 detects corruption, not authenticity. Locked mutation refuses unreadable/default/missing credentials. File proof is possession, not physical durability. Selection limit 20 MiB. | Keep files private, independently retain older copies and verify saved files. No default PIN bypass or claims of eviction/power-loss survival. |
| Hard deletion/audit completeness **OWNER ACCEPTANCE REQUIRED / Medium–High** | Selected deletion is PIN guarded and permanent. Linked masters can disappear while invoices persist. Source audit wrappers log specified invoice/payment/delete/PIN/sync actions, not an authenticated comprehensive event for every master/purchase creation. | Backup first; define relation retention and audit scope. Recycle Bin, credit/refund workflow and authenticated operator identity are not implemented by this review. |
| Optional sync/native hardware **OWNER ACCEPTANCE REQUIRED / High** | No live Sheets/JSONBin account, actual native directory picker, mobile OS/storage/keyboard, physical printer or power-loss test was used. | Owner/device checks below; optional sync must remain disabled until separately accepted. |
| Architecture/tooling **NON-BLOCKING DEFERRED / Medium** | Monolithic override chains, 143 warnings, legacy HTML diagnostics and inherited generated artifacts remain. No external runtime script or mandatory service was introduced. | Consolidate code and archive bulky evidence in separately reviewed work. Build success is not proof of all HTML/accessibility semantics. |

## Owner migration and rollback procedure — instructions only

**Do not perform a live update while this decision is MERGE BLOCKED.** The steps below are prerequisites for a future corrected/approved release, not authorization to change main or customer records now.

1. Close all older app tabs/windows and copies on devices using the same profile/origin. Keep the exact current billing URL/browser profile. Do not clear site data, renumber invoices, manually delete journals or “reset” storage to resolve a warning.
2. Save the current application file/version and export an independent backup **before** any eventual main merge. Main's legacy v5 Export Backup is incomplete for audit/preferences/unknown keys and has no checksum; a saved legacy JSON alone is not a complete rollback archive. Obtain a complete read-only capture of billing `shop4_*`, known preferences and any recovery coordination bytes on the owner's device. Use a trusted desktop/local browser profile export when needed; mobile-only inability to make/verify a complete capture blocks the live update.
3. Verify the saved file by re-reading it, checking its SHA-256 and key/record completeness, and comparing the relevant raw strings locally. Retain at least two private copies outside browser storage. A download click or checksum without complete contents is insufficient. Never upload real records/keys to this workspace, GitHub or CI. An archived raw format is forensic evidence and must not be blindly fed into ordinary import.
4. After blockers are fixed, validate a copy on an isolated **owner-local** test profile using the compatible app, with supported format/accounting preflight and an explicit preview. Verify settings, audit, unknown keys, preferences, PIN behavior and supplier-scoped histories. Compare originals without inventing earlier snapshots. No real data was used by Codex to perform this step.
5. Owner approval must cover the complete assembled stack and hosting consequence. A main merge may automatically publish GitHub Pages. Do not deploy intermediate PR #5 or assume that merging a draft is only documentation work. Coordinate a maintenance pause and preserve the pre-update files before production changes.
6. On the owner-approved update, reload the same origin/profile and inspect invoice counts, last/reserved numbers, saved FY/prefix, receipts/discounts/balances, representative ledgers and backup preview. Startup must not rewrite historical strings. Configure a nondefault PIN explicitly while the profile is healthy if needed; PIN setup must not delete or restore automatically. Do not resume entries if validation or quota refuses them.
7. If initialization/write recovery fails: preserve the profile, download private raw recovery when reads are available, reselect the saved file, review validated adoption/restore, supply the **current** PIN and separately confirm. Reload only after verified completion. Missing/default/corrupt credentials, inconsistent histories, foreign journals or oversized input require review, not a bypass. A pending message does not prove rollback or journal presence; a verified commit needing cleanup must not be repeated.
8. **Do not blindly downgrade to original main.** Its historical migrations/read behavior and legacy import cannot safely consume every new journal/private format. First capture the failed state, then choose a reviewed compatible recovery build and validate the independent pre-update backup. Restore only through its checked workflow; owner alone controls any code rollback/main/Pages changes. The review provides no automatic production rollback or guarantee that old code can safely replay new records.

For a read-only raw capture on an owner's supported secure browser, the following console example downloads data only; it has **no storage writes**. It is an archive, not a validated restore feature. Do not run it in the cloud with real records.

```js
(async () => {
  const relevant = key => key.startsWith('shop4_') || key.startsWith('xl_storage_') ||
    ['v8_slcols', 'v8_compact', 'xl_backup_config', 'xl_backup_state'].includes(key);
  const payload = {
    origin: location.origin,
    capturedAtUTC: new Date().toISOString(),
    records: Object.fromEntries(Object.keys(localStorage).filter(relevant).sort()
      .map(key => [key, localStorage.getItem(key)]))
  };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const checksum = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  const file = {format: 'xl-owner-raw-origin', version: 1, payload, checksum};
  const url = URL.createObjectURL(new Blob([JSON.stringify(file)], {type: 'application/json'}));
  const link = document.createElement('a');
  link.href = url; link.download = 'xl-owner-private-origin-' + Date.now() + '.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  console.log('Capture requested. Verify the saved file privately. SHA-256:', checksum);
})();
```

Recompute SHA-256 of `JSON.stringify(file.payload)` after parsing the **saved** file and compare with `file.checksum`; check retained key coverage and raw record strings. This does not certify accounting, prove independent physical durability or make an unsupported profile restorable. If denied reads/capture/verification fail, keep the profile and do not update it.

## Owner manual acceptance checklist — NOT performed by CI

Use a separate synthetic rehearsal profile on the owner's actual hardware first; do not create/delete test invoices in live customer data.

- Confirm every required destination is reachable on the actual phone and desktop; operate New Sale/New Purchase/Previous Bills, master creation, receipts, settlement and reports with touch and the native keyboard. Test slow/fast focus changes, Tab/Enter/Escape and browser reload persistence.
- Verify the independent pre-update archive and a copy's supported restore locally, including actual historical supplier numbering policy and ambiguous cases. Keep current PIN known and nondefault; test setup/change/cancel/confirmation only against synthetic records first.
- Validate real profile compatibility privately on-device after software blockers are resolved. Compare counts, last numbers/FY, balances/discounts, reports and audit; do not rely on CI's synthetic fixture coverage as certification of all customer history.
- Test device quota/headroom with representative **synthetic** size and photo/notes payloads. A refused operation must retain bytes/counters and show an accurate error; close old copies before any test/update.
- Check manual download saved location and access after closing/reopening the browser. Exercise the actual directory picker, reconnect/revoked permission and manual fallback where implemented; confirm backups do not run while closed. Native mobile folder support is NOT VERIFIED.
- Print synthetic short and long invoices on the actual configured printer using verified software paths after print blockers are fixed. Check every line, amounts/totals, copies, page count, paper size, margins, scaling and saved PDF. Physical printers/native print dialogs are NOT VERIFIED. Do not accept the known-clipping A5 output as correct.
- Leave optional live synchronization off until its account/auth/remote failure and merge policy is separately verified by the owner. Private backups contain credentials and must not be shared.

**No approval is requested for merging now.** Resolve the listed blockers in separately reviewed fixes, rerun the same independent gate and final exact-head CI, then obtain the owner's explicit approval and outstanding device/profile acceptance before any main/hosting action.
