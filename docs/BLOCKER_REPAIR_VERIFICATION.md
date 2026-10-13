# Owner-authorized blocker repair verification

**Merge decision: BLOCKED under the strict owner acceptance gate.** PM-01 through PM-07 and the additional confirmed defects have been repaired; the unsupported noncooperating older-writer race remains a real failing assertion. This report supports owner review of the documented cooperative-client contract, not an unconditional merge recommendation. The owner alone decides whether that limitation and the outstanding device/profile checks are acceptable. Nothing was merged, deployed or written to main.

Authority: [PR #8 final verification instructions](https://github.com/nileshkchaubey-glitch/Xl-billing/pull/8#issuecomment-6126054996), [PR #9 repair assignment](https://github.com/nileshkchaubey-glitch/Xl-billing/pull/9#issuecomment-6128013121), and [trusted tooling authorization](https://github.com/nileshkchaubey-glitch/Xl-billing/pull/9#issuecomment-6128158502). The owner separately defined opening balances: **positive is receivable, negative is credit**, for every party type. No supplier sign inversion or automatic opening-credit settlement is inferred.

## Exact candidate and retained baseline

- Draft [PR #10](https://github.com/nileshkchaubey-glitch/Xl-billing/pull/10): `codex/xl-owner-blocker-repairs`, targeting PR #9's `codex/xl-final-premerge-verification` branch.
- Repair base: `5d3fb7991586d7acef84d49cdd26a003b290d912`. Original runtime SHA-256: `37cb3c09b5d165768666d3ccefae9478b10f08a7dc20f1dcc219cad91e596933`.
- Final repaired runtime: `0b59624aa83af362c884c0bc32d214b10d7df5bd203e55cab55507861601c0df`. The last runtime change is commit `817b7224675870711faf88f8e3b795a84af6229a`; subsequent verification/report commits preserve those application bytes.
- Final immutable report-branch SHA, Actions run, job results and artifact digest are recorded in PR #10's verification ledger after its report commit runs CI. CI explicitly checks out the PR head, not a synthetic merge commit. Each downloaded final report must match that head in `tested_commit` and the runtime hash above. An older passing job is not a substitute.

| Protected ref | Unchanged SHA |
| --- | --- |
| main | `29aeb20225bccfc653b192651de608491185096c` |
| PR #5 | `d07729e60e6901fa1255a8331dde805c22890e9c` |
| PR #6 | `0e4d9168406e0a57461f4c3bbebfa122263dc919` |
| PR #7 | `aa9b03c5ff1968445a1a92197302796a26a3e824` |
| PR #8 | `f5cc2e3319179664d1cb6227dc28e7470428e58d` |
| PR #9 | `5d3fb7991586d7acef84d49cdd26a003b290d912` |

Every parent remains an ancestor of its child and of this repair; PRs #5 through #10 remain open, Draft and unmerged. Parent history and the original failed reports are retained. [FINAL_PREMERGE_VERIFICATION.md](FINAL_PREMERGE_VERIFICATION.md) is the historical PR #9 review, not a current application-status claim. The original 108-file artifact review remains in [RELEASE1_FILE_REVIEW.md](RELEASE1_FILE_REVIEW.md). New evidence uses source-bound JSON; fresh screenshots/PDFs and generated command output stay in disposable paths or CI artifacts. The inherited 38 tracked screenshots were restored after testing, not committed as new changes.

The app remains a single offline-capable HTML file with no external runtime script, mandatory backend, Supabase, paid service or required credential. Existing optional owner-configured sync is not a certified live service. Every record, PIN, file, key, receipt and profile in these tests is synthetic. External browser requests are blocked; tests use loopback HTTP/HTTPS, disposable file paths and contexts. No deployed site, customer archive, real browser profile, folder or private owner credential was accessed.

## Completed repairs and actual before/after evidence

| Requirement / affected functions | Confirmed before | Repaired behavior and evidence |
| --- | --- | --- |
| PM-01: `validateXLTransaction` purchase identity | Global P-1 duplicate check refused distinct suppliers and complete private recovery; two unchanged owner probes failed | Scope by saved supplier ID and saved-date Apr–Mar FY; preserve exact references. Distinct IDs and different years work; same-supplier/year and missing-identity ambiguity refuse before mutation. 17 Node cases and 15 real normal/locked recovery cases; [PM01_REPAIR](PM01_REPAIR.md), [browser recovery](PM01_BROWSER_RECOVERY.md). |
| PM-02: `xlProcessCSV`, `importCSV` | Invalid declared paid text became 0; a mixed valid/NaN file appended both rows through both real file inputs | Strict complete decimal/calendar/schema parsing and full-file candidate validation; invalid files leave original bytes unchanged. 27 Node cases including 120 generated codec trials, 51 three-engine file-input cases. |
| PM-03: `createXLCSV`, `exportToCSV` | Quote/CRLF records changed/split; formula prefixes were unneutralized | RFC quoting and reversible `XL-CSV-1` literal-text cell encoding; genuine apostrophes and exact row values survive supported exports/imports. Original seven CSV owner probes pass; physical spreadsheet execution is not certified. |
| PM-04: invoice CSV arithmetic/source history | Subtotal 100, discount 10, total 90 became inconsistent 90/10/90 | Versioned full `recordJSON` preserves IDs/items/history/unknown fields and cross-checks readable columns. Legacy summaries require explainable subtotal/tax/paid arithmetic, remain visibly incomplete, and never fabricate event history or party IDs. [PM020304_REPAIR](PM020304_REPAIR.md). |
| PM-05: transaction/payment/dashboard/party reports | Cash filter 50 versus actual receipt ledger 40; cancelled receipts omitted; unknown and noncash modes counted as cash | Cash 40 reconciles independently, Discount/Credit stay noncash, unknown modes stay unclassified, cancelled legitimate cash survives, cancelled accrual/due is excluded. Cash net is not profit; paid aggregates are labelled Settled. Undated opening settlement stays undated. |
| Signed `openingBal` reports and settlement preview | Original party-opening-ledger 185 could not pass without an authorized policy | Owner-defined signed component applies to all party types and linked IDs. Invoice due 80 plus credit -200 remains net -120. Supplier purchase payable is separate; no automatic opening receipt/netting/allocation. Nine reporting probes per engine plus original opening assertion. |
| PM-06: `lineRecordedAmount`, item/drill/print readers | Legacy `amount:6` reported 0 after startup normalization was suppressed | Read-time `amt ?? amount` compatibility, canonical `amt:0` precedence, numeric/string fixtures; historical bytes remain unchanged. [PM0506_REPAIR](PM0506_REPAIR.md). |
| PM-07: `printInvoiceA5`, A4 output | Short two-up occupied two pages; 40-line A5 clipped to 12 complete lines with missing totals; unbroken text lost PDF endpoints | Measure actual width/height; short two-up one A4 page; oversized invoices visibly use complete paginated A4; denied measurement/popup visibly refuse. Wrapped 80-line and adversarial unbroken fields retain endpoints/totals. Native PDF page/text/coordinates checked in Chromium; all three engines check layout/content. [PM07_REPAIR](PM07_REPAIR.md). |
| Mobile reachability | Required purchase/history/master/payment destinations had no visible mobile navigation | Real Home touch/keyboard shortcuts reach 14 workflows plus Payment In/Out; 320px/390px bounds and real receipt saves checked, five probes per engine. [MOBILE_REPAIR](MOBILE_REPAIR.md). |
| Sales edit collision | Existing INV-1002 could be edited to INV-1001 | New/changed collisions refuse; unchanged legacy records remain readable. Three added Node tests; no counter, prefix, invoice series or FY rule change. |
| Locked same-file retry | First new browser recovery run: 13 PASS, two real Chromium/WebKit restore retry failures | Clear DOM file-input selection after processing the captured File, allowing explicit revalidation; export possession, checksum, current PIN, preview and confirmation remain mandatory. Subsequent 15 recovery cases pass. |
| `saveSettlement`, `savePoutPayment` identity / stale review | Ten real UI probes failed: same-name other parties received discounts/payments; reassigned/changed/replaced reviews could apply | Immutable reviewed IDs/raw record values and modal token; validate current accounting/association/active state before mutation. Typing invalidates supplier ID/review. Ten cases per engine pass, including normal receipt/discount amounts. [PAYMENT_IDENTITY_REPAIR](PAYMENT_IDENTITY_REPAIR.md). |
| Confirmed stored-text XSS | Packing summary/fallback and vendor bill references executed synthetic payloads; party phone executed a payload | Escape tested packing, purchase-payment and phone expressions. Actual invoice view, A4/A5, supplier modals, Payment Out and party table remain literal with original bytes preserved. [payment text](PAYMENT_TEXT_SECURITY_REPAIR.md), [party action](PARTY_ACTION_REPAIR.md). This is tested-surface coverage, not universal legacy XSS certification. |
| `openPayOutModal` initial focus | The unchanged combined Chromium Payment Out probe saved no receipt: an 80ms callback moved Amount focus to Supplier, appended 12.34 to its name and invalidated the reviewed ID | Deterministic held-timer input test reproduces the failure; focus now occurs synchronously before user entry. Existing owner Save sequence and 32.34/467.66 assertion are unchanged. [PAYMENT_FOCUS_REPAIR](PAYMENT_FOCUS_REPAIR.md). |
| `renderParties` action timing | 80ms Settle insertion moved Detail between pointer down/up, sometimes opening Edit; focused before Firefox: 1 PASS/3 FAIL | Insert existing eligible actions synchronously. All four unchanged new assertions pass per engine; no accounting/party identity change. Opening-only balances do not invent invoice settlement targets. |
| R1-11/12/13 views | Original purchase sort, audit search and party Transactions tab failed | Existing selectors/assertions retained; sort reads vendor bill number, one audit filter precedes pagination, party tab controller includes Transactions. Full safety gate passes. |

All original owner cases remain active; none was removed, skipped, xfailed or inverted for green CI. The original 63 Node tests, including the earlier 44, are retained; added cases total 110. New tests precede their fixes in small reviewable commits. Original financial failure evidence remains inspectable in `test/premerge/`, `test/repairs/`, `test/pm-reports/`, `test/pm07/`, `test/payment-identity/`, `test/payment-security/` and `test/party-actions/`.

Two transparent harness/domain corrections are recorded in [REPAIR_TEST_POLICY.md](REPAIR_TEST_POLICY.md): the isolated parcel VM loads the actual newly shared amount reader; the old cancellation assertion now requires the legitimate cash 20 to remain and active invoice due to exclude cancellation. Its old zero-cash failure remains archived. Original owner opening value 185 is unchanged; bounded waits observe the real visible populated modal. The unchanged original Payment Out probe also exposed delayed focus stealing: its failed Chromium record and actual deterministic reproduction are retained, and the application focus callback is repaired rather than waiting it out in the owner test. Negative CSV refusal tests now require actual `CSV rejected:` errors, so a missing module cannot masquerade as safe refusal. A lost-party-click timeout was diagnosed and fixed in the application; it was not dismissed as harness noise. Original failed attempts and scoped before/after reports are not retrospectively changed to PASS.

## Verification ledger and reproduction

The final local, source-bound results are in [test/repairs/final/SUMMARY.json](../test/repairs/final/SUMMARY.json). Full component reports preserve each expected/observed result, engine, runner hash and application hash. The latest full local regression and prior CI source `6832ff9a…` passed 110 Node/508 browser entries before the final minimal party rendering repair. Those results alone do not certify runtime `0b59624a…`; the final head's complete regression is rerun in CI. PR #10 records its completed immutable run, actual counts, final head, artifact link and verified ZIP digest.

| Gate | Observed final-source result / qualification |
| --- | --- |
| Parcel/open-box VM | PASS; original financial/input/settings assertions |
| Node/unit/property/storage/backup/recovery | 110 PASS, zero failures/skips; original 63 retained |
| Complete browser regression | Latest complete local run on precursor source `6832ff9a…`: 508 PASS plus two intentional other-engine screenshot-capture skips; 507 functional cases (169 per engine), no functional skip/failure. The final-source complete run and actual counts are certified only by the completed exact-head CI ledger in PR #10. |
| Full stabilization/foundation/view safety probes | 81 PASS: 27 per engine, zero failures/harness errors |
| Original and expanded owner gate | 147 PASS / three FAIL: 49/1 per engine in 150 cases; only `older-writer-read-write-race` remains FAIL |
| Focused reporting | 27 PASS: nine per engine, zero failures/harness errors |
| Payment identity/stale review | 30 PASS: ten per engine, zero failures/harness errors |
| Party action / stored phone / Payment Out initial focus | 15 PASS: five per engine, zero failures/harness errors |
| Mobile touch/keyboard and real payments | 15 PASS: five per engine, zero failures/harness errors |
| Lint / standalone build | Zero lint errors, 143 inherited warnings; byte-identical `dist/index.html` |
| CI release stabilization / foundation jobs | Both must succeed; completed final-head job results are recorded in PR #10. Narrower success never overrides failed owner acceptance. |
| CI complete tests job | The final-head regression/lint/build results must be verified separately. The strict owner step remains nonzero for the older-writer failure; final observed counts and any additional failure appear in PR #10's completed ledger. Overall CI is not claimed green. |

The standalone gates overlap some workflows; their counts are not additive proof of unique business behaviors. The two capture skips are the existing Firefox/WebKit instances of a Chromium-only screenshot test. HTML diagnostics, physical hardware and live optional-service checks are not green acceptance claims.

```sh
node qa/verify-invoice-entry.cjs
node --test test/unit/*.test.cjs test/foundation/*.test.cjs
XL_REPORT=/tmp/xl-final-regression.json npm test
npm run lint
npm run build
cmp index.html dist/index.html
xl_verification_result=0
for xl_engine in chromium firefox webkit; do
  XL_REVIEW_BROWSER="$xl_engine" node scripts/review-release1.cjs || xl_verification_result=1
  XL_PREMERGE_BROWSER="$xl_engine" node scripts/verify-premerge.cjs || xl_verification_result=1
  XL_PM_REPORT_BROWSER="$xl_engine" node scripts/verify-pm-reports.cjs || xl_verification_result=1
  XL_PAYMENT_IDENTITY_BROWSER="$xl_engine" node scripts/verify-payment-identity.cjs || xl_verification_result=1
  XL_PARTY_CLICK_BROWSER="$xl_engine" node scripts/verify-party-click.cjs || xl_verification_result=1
  XL_MOBILE_BROWSER="$xl_engine" node scripts/verify-mobile.cjs || xl_verification_result=1
done
exit "$xl_verification_result"
```

The owner runner intentionally returns 1 for a real failed assertion. CI aggregates nonzero results across all engines and retains every report; completion of a shell loop is not a passing gate. Run full Playwright regression once at a time because its synthetic server uses port 4180. Standalone gates use their own ephemeral loopback ports. Managed local launches use the documented temporary browser libraries; CI installs official locked Playwright browsers/system dependencies.

## Storage, recovery and scope protection

The implemented journal strategy is recoverable, **not an atomic multi-key transaction**. It stages checked before/after strings, detects stale cooperative clients, validates committed bytes and restores verified originals when possible. Failed rollback/uncertain cleanup keeps a recovery-pending state and blocks further writes. Original real New Invoice Save tests cover journal/invoice/settings/audit/revision failures: no success toast or counter change after verified rollback, no duplicate reservation, and truthful messages distinguish committed-reload-required or pending recovery. Interrupted transactions, foreign/corrupt journals, denied/corrupt reads, corrupt backup/checksum/history and failed restore preserve checked recovery material or fail closed.

Locked recovery works when normal `nav`, `saveSaleInvoice` and `importData` never initialize. The owner must download and reselect the raw recovery file; full schema/accounting checks, truthful evidence-backed preview, nondefault current PIN and explicit confirmation precede adoption/restore. No fabricated old snapshot, inferred identity, history rewrite or validation bypass is used. Unsupported or conflicting histories, and missing identity needed to disambiguate colliding references, remain refused unchanged. Supported legacy opening paid aggregates without event history remain preserved. The additional supplier fixtures exercise actual committed restore/adoption and reload, not only successful decode. Existing private/v5 legacy backup formats, Delete PIN behavior and business numbering rules remain protected by the full suites.

Asia/Kolkata dates remain tested at October 1–31, IST 00:30/23:30, March 31/April 1 and December 31/January 1 under multiple device timezones; audit/createdAt timestamps stay UTC. The saved invoice financial-year series and reset/numbering rules are unchanged.

## Blocked, unimplemented and unverified work

| Risk / severity | Evidence and explicit limit |
| --- | --- |
| Noncooperating older writer / **High, strict gate FAIL** | An injected old writer records receipt 5 between the current code's read and `setItem`; current Save overwrites it and acknowledges success. localStorage has no compare-and-swap, and old code does not honor Web Locks. Closing every old tab/window/offline copy and using the compatible complete stack is mandatory; no unsupported atomicity workaround was applied. If excluding old writers cannot be assured, do not transition to live use. |
| Physical durability/eviction/capacity / **High owner risk** | Browser-local storage and a checksum are not independent durable storage. No power-loss/disk-full/eviction guarantee. Synthetic 5,000-record profile may refuse journal staging unchanged; this is safe refusal, not capacity/performance certification. Checked external private downloads are essential. |
| Ambiguous historical data / **High, refused operation** | No automatic supplier/year/party-name inference, duplicate renaming, conflicting payment-history reconciliation or receipt invention. Complete archive export is not proof an ambiguous history is safely restorable. Real archives were deliberately not inspected. |
| Opening collection/netting/refunds / **Unimplemented** | Signed opening reports are defined and visible, but no opening-payment/credit-allocation event format, supplier payable netting or explicit cash refund is invented. Individual linked invoice/purchase settlement remains available. |
| Recovery/PIN/size support / **Known limit** | Recovery mutation needs usable cooperative Web Locks, readable nondefault current PIN and valid proof. Denied reads cannot export unreadable bytes. Recovery/import file size remains limited to 20 MiB; CSV uses its documented UTF-16 input limit. |
| Private backup/audit assurance / **Medium** | Private files contain sensitive configuration/credentials and need owner protection. SHA-256 detects corruption, not authenticity against a malicious file author. Audit entries do not establish authenticated operators or complete immutable history. Hard delete persists; no Recycle Bin was added. |
| Printing/mobile/native backups / **Unverified hardware** | Chromium native software PDFs are inspected; Firefox/WebKit native PDF output, real Android/iOS keyboards/dialogs, printer calibration and native folder permissions are not certified. Automatic backups cannot run while the app is closed; revoked permission visibly falls back to manual reminders. |
| Optional live sync / **Unverified** | No real Sheets/JSONBin account or production credential/failure journey was exercised. Comprehensive cross-device synchronization is unimplemented; GitHub Pages does not share billing records between devices. |
| Legacy maintainability/accessibility / **Medium debt** | Monolithic function overrides, 143 lint warnings, inherited HTML diagnostics, broad accessibility/keyboard redesign and whole-app XSS certification remain outside the verified repair scope. No lint-warning cleanup or backend rewrite masks these limits. |

Completed, blocked and unimplemented statuses are separated in [WORK_COMPLETED](WORK_COMPLETED.md), [WORK_BLOCKED](WORK_BLOCKED.md) and [WORK_UNIMPLEMENTED](WORK_UNIMPLEMENTED.md). Trusted tool sources, versions, installations and security/compatibility implications are in [REPAIR_TOOLING](REPAIR_TOOLING.md). No new local package, plugin or paid service was installed; CI uses lockfile-pinned npm/browser packages and official Ubuntu Poppler packages, recording actual versions.

## Owner transition and rollback decision

The owner must review the final exact-head artifact and remaining strict failure, preserve an independently checked private backup, close every older copy, and perform applicable native mobile/printer/download/folder checks on synthetic data first. Keep the same origin/path and a known compatible full stack; changing devices/origins does not migrate browser-local storage. Do not merge PR #5 alone or downgrade a live profile blindly to original main. A storage journal, incompatible old writer or ambiguous restore is a reason to stop and retain recovery bytes, not clear storage.

The detailed private-backup/profile/rollback and Pages deployment instructions in the historical [FINAL_PREMERGE_VERIFICATION](FINAL_PREMERGE_VERIFICATION.md) still apply where they describe supported operations. An eventual main update can trigger Pages deployment; neither that update nor a merge is authorized by this report. **No merge-readiness decision overrides the owner's personal approval or the remaining strict acceptance failure.**
