# Plan A — acceptance matrix and verification evidence

Status: **limited A1a development approved and in progress; later tests remain proposed and their feature scopes approval-pending**. The six planning-review executions below are historical observations. Actual candidate A1a results must be recorded in [A1a verification](PLAN_A_A1A_VERIFICATION.md); no pending feature acceptance is implied by an existing VM pass. Baseline: main `3855c6ab21de64fdc9e28116fcd0f770304eef66`; runtime SHA-256 `d5fbcd1a47a5bf6e8d2ec735b561f46108e3c905878ba301acd322040b52b70a`.

## Planning-review observations and current candidate evidence

The earlier planning review checked all 15 pinned source files against Git blob hashes, then ran the unchanged six scripts in a temporary non-Git copy. Its storage was synthetic in-memory Maps/objects; DOMs were mocks, and selected source snippets ran in Node VMs using built-in modules. That review performed no app bootstrap, browser profile, real storage, provider request, repository write, dependency installation, workflow dispatch, merge or deployment. A1a now adds development files in the repository; final candidate observations and exclusions belong in [A1a verification](PLAN_A_A1A_VERIFICATION.md).

| Required existing command | Planning-review result | What it proves / limit |
| --- | --- | --- |
| `node qa/verify-backup-import.cjs` | PASS, exit 0 | V4 parser, occupied refusal, optional audit, one write-4 rollback, isolated notice callback. Does not execute full startup/reload or every failure. |
| `node qa/verify-complete-backup.cjs` | PASS, exit 0 | Main V1 raw 11-key/2-invoice roundtrip, checksum/duplicate-key checks, one write-5 rollback, marker refusal, change during digest. No native file/device or full accounting gate. |
| `node qa/verify-invoice-entry.cjs` | PASS, exit 0 | Last entry block against a save-counter stub, packs/legacy quantity/settings. Not final full save chain or money precision safety. |
| `node qa/verify-pagination.cjs` | PASS, exit 0 | Selected actual list renderers/shared pager over mocked DOM, 45 records. Not all user flows or financial states. |
| `node qa/verify-payment-ledger-pagination.cjs` | PASS, exit 0 | Renderer/pager over 63 prepared payment rows and a stubbed getAllPayments. Not the real aggregation/business oracle. |
| `node qa/verify-invoice-payment-safety.cjs` | PASS, exit 0 | Selected base/receipt/edit/audit snippets with modern fixtures. Totals/audit/DB are stubbed; purchase writer is fabricated; full initialization/settlement/payout/stale PIN/quotas are omitted. |

See [A1a verification](PLAN_A_A1A_VERIFICATION.md) for candidate commands, outputs and tool versions, and [baseline-source.json](../qa/plan-a/baseline-source.json) for the immutable source/file contract. The planning-review source files remained byte-identical after those earlier executions. Current-main contains these six scripts; PR #10 is closed/unmerged, and its older 110-Node/508-browser totals are not current candidate coverage. Six passing scripts are not six complete release acceptance gates or a substitute for a current full-runtime/browser failure suite.

## Required harness and evidence contract

- Use a pinned copy of the actual candidate HTML, empty disposable browser contexts/profiles and loopback/test origins. Route-block every non-test request before navigation. JSONBin/Apps Script calls are intercepted mocks only; live endpoints are never called, even to obtain status or check limits.
- Execute every application script in original order when testing ordinary startup, then reload. Do not replace missing real globals with convenient mocks in the full-runtime suite. Diagnostics-only tests deliberately prove ordinary app scripts never run.
- Snapshot exact key membership and raw string values, including null/absence, versions, preferences, unknown supported keys and recovery markers before/after each operation. Compare committed data, counters, audit, generated files and UI signals separately.
- For expected mutation, independently compute which records may change and check all unrelated records unchanged. For an unsupported action/failure, retain exact before/after evidence and real FAIL status; no xfail, retry-to-green or expected-unsafe pass.
- Use synthetic fixtures generated from code-defined historical formats, never sanitized real customer exports. Synthetic secret sentinels test redaction. Do not retain private owner files, credentials, record text or their snapshots in CI.
- Capture source/test hashes, actual checkout SHA, fixture seed/count/bytes, engine/version, fault site/phase, observed UI and result. Label mocked versus native/device checks; screenshot/PDF presence alone is not a safety assertion.
- First preservation/synthetic baseline work can use current Node tooling. Pin and approve Playwright/dev dependencies before adding browser infrastructure. Current five workflows do not perform three-engine browser testing.

## All 16 acceptance requirements in the uploaded plan

Current coverage below is partial/current QA, not a completed proposed gate. Sources resolve to [pinned main][main-source] and the risk document's exact write inventory.

| ID / phase | Setup, fault and required independent oracle | Current evidence / gap |
| --- | --- | --- |
| A-READ-01 / A1b,A4 | Empty profile; absent key; JSON `null`; malformed JSON; wrong array/object/primitive; denied localStorage property/getItem/enumeration. Report distinct states, preserve bytes; denied/corrupt never becomes zero-safe. | [DB/getters][db] collapse read errors. No current complete read-denial gate. |
| A-READ-02 / A1b | Snapshot all keys; visit/revisit diagnostics; normal app functions and V5/V13/V14/V15 writers never initialize in this mode. Unknown keys/preferences/markers remain unchanged; no diagnostic metadata writes. | Conflicts with [ordinary migrations][v13]. A late panel cannot pass. |
| A-CLOUD-01 / A2 | UI and direct Push/Pull/**Create Bin** calls, synthetic present/absent credentials, confirmation/no DOM. Zero provider fetches, storage writes and false-success status. | All [three JSONBin functions][push] are active; no current gate. |
| A-BACKUP-01 / A3,A6 | Exact main V1 envelope/hash, membership/raw strings, present audit/settings/preferences/unknown safe keys; before/after digest equality; restore only empty profile. | [V1 QA][qa-v1] partially covers; full financial usability and file persistence do not follow from checksum. |
| A-BACKUP-02 / A2,A3,A6 | V4 six sections + optional audit; current V1 unchanged; occupied restore blocked, including marker/preferences as specified per format. V4 semantic, V1 raw equality. | [V4 QA][qa-v4] partially covers. Full startup and concurrent/removal failures missing. |
| A-BACKUP-03 / A3,A6 | UTF-8 boundary/oversized/truncated/tampered/unsupported version/duplicate key and row IDs; malicious rechecksummed structurally invalid codec schemas rejected before writes. Independently classify unsupported or ambiguous accounting/history without inventing new codec rejection rules: preserve valid historical paid aggregates, absent/empty histories and separate discounts, and never impose a blanket `paid == sum(payments)` rule. Retain raw evidence rather than repairing it. A checksum is not encryption or authentication: a valid digest does not prove authorship or trustworthy accounting. Structural restore fidelity and financial usability are separate gates. | Parser/codec checks exist; 20 MiB and full historical/accounting matrix untested. |
| A-FILES-01 / A3b | Cancel/deny/revoke picker, unique-file partial write/close error, readback/hash mismatch, stale handle/name collision. Prior generation files unchanged; no verified result on failure. | No directory-write code or file tests in main. |
| A-FILES-02 / A3 | Supported offline manual/directory save; unsupported API/secure-context path falls back honestly; no timer/permission/repeated download; no work while app closed. | Download exists; directory/offline/native dialog lifecycle unverified. |
| A-QUOTA-01 / A4,A5 | Fail each invoice/counter/audit/purchase/settings/backup-stage write/readback. No completed-success/print. A4 shows partial/recovery-required if earlier keys committed; A5 verifies exact rollback or preserves journal and blocks. | One isolated restore fault per current format only. [Invoice writes][invoice] are separate. |
| A-MIGRATE-01 / A4 | Corrupt/denied data and marker under missing/old/current versions. All **V5/V13/V14/V15**, normal load and incidental writes skipped on unsafe state; valid legacy reads leave bytes unchanged. | V5 marker regex + isolated notice callback only; later migrations bypass it. |
| A-PAY-01 / characterization,A4 | Actual normal/standalone/edit/delete/settlement/purchase/payout chains and all historical shapes; independent amounts/discounts and unchanged histories. | Current modern snippet tests omit major routes and staleness; [standalone][standalone] recomputes paid. |
| A-TAB-01 / A5 | Two current-version tabs; simultaneous saves, double-click/Enter, stale form/review/PIN, mid-apply readers. Unique number and one confirmed mutation; stale state visibly read-only. | No current locks/revisions/journal/two-tab suite. |
| A-TAB-02 / A5,A6 | Run older source in second disposable tab; inject receipt between validation/read and setItem. Record overwritten receipt as actual FAIL; no xfail or atomicity promise. | Historical [PR #10][old-blocker] failure persists as a required limitation; not rerun on current main here. |
| A-PRINT-01 / all runtime PRs,A6 | Real invoice/packs entry, save/edit, receipts, purchases, previous bills, masters, reports, current export/import and actual print controls. Independent accounting and requested-document identity. | Six scripts cover snippets/pagers, not full browser or physical printing. |
| A-DRILL-01 / A6 | Retrieve verified generation from independent copy; restore fresh profile; compare supported keys/IDs/numbers/payment/discount totals/settings/audit both immediately and after reload. | No owner/native drill here. [UI reload][import] can trigger migrations. |
| A-CI-01 / every future PR | Explicit actual head checkout, new-file triggers, immutable source/runner hashes, pinned tooling, original scripts preserved, artifacts with pass/fail/skip labels. | Existing [workflow][workflow] uses default checkout and Node-only selected path filters. No Plan A workflow existed in the pinned baseline; the A1a candidate workflow must meet the actual-head/source-hash contract. |

## Missing acceptance criteria to add before implementation

| Proposed added ID | Required test / source basis | Gate |
| --- | --- | --- |
| A-BOOT-02 | Existing import pending, corrupt/foreign future journal, no normal globals initialized; independent raw-export UI remains accessible. [Notice][notice] currently runs after immediate scripts. | A4/A5 |
| A-RUNTIME-01 | Real script ordering/closure availability: isCancelled at 6623 and getPrintSettings at 5600 are closure-local; auditLog at 8497 is local too. Later callers must not be certified by mock globals. | Characterization; every runtime PR |
| A-DIAG-PRIVACY-01 | No secret/record values in UI/errors/logs/screenshots; safe malicious text/key names, no JSON parse excerpts. Complete private backups, private raw evidence and any shareable/redacted artifacts are distinct; shareable artifacts are explicitly non-restorable. No new redacted exporter is implied. | A1b/A4 |
| A-DIAG-STATUS-01 | Profile identity/export age/off-device status unknown without evidence; a new/wrong origin with no keys is not proof that backups or finances are safe. Generic warnings cover private/incognito billing, site-data clearing, profile/device changes and simultaneous editors without fabricated detection. Warning/status rendering is safe, read-only and makes no network requests or persistent metadata writes. A standalone support page has an explicitly reviewed self-contained/offline contract and no normal app scripts. | A1b |
| A-DIAG-SIZE-01 | ASCII/Unicode/surrogate pairs; exact UTF-8/UTF-16 string metrics with key overhead; origin estimate absent/denied/inaccurate; no live quota probe. | A1b/A5 |
| A-CLOUD-CREATE-01 | Create Bin UI/direct call intercepted with valid synthetic key; zero POST and no output of credentials/bin IDs. [Create Bin][bin]. | A2 |
| A-CLOUD-SETTINGS-01 | Final four-layer Save, visit/cancel and missing/disabled UI fields retain existing key/ID properties; no empty-input erasure. [Settings][settings]. | A2 |
| A-CLOUD-GS-01 | Define approved GS scope; mocked final GS merge cannot bypass unsafe-write gate or leak full settings. No all-network-quarantined claim if GS remains. [GS][gs]. | A2 scope decision/A4 |
| A-BACKUP-KEYS-01 | Valid present-empty arrays versus all business keys absent; missing audit remains absent; exact whitelist including key length, preferences and unknown safe values; marker exclusion; unsupported old-draft keys rejected unchanged. [V1][v1]. | A3/A6 |
| A-BACKUP-SNAPSHOT-01 | Mutation mid-enumeration/collect, during digest, change-then-revert and cross-key skew; do not treat stable endpoints as atomic snapshot proof. | A3/A5 |
| A-BACKUP-CRYPTO-01 | Missing crypto/secure context; encoding/digest/Blob/object-URL allocation failure; no write/status advance. Simulated memory failure is not a physical OOM guarantee. | A3 |
| A-BACKUP-UTF-01 | Just below/at/above 20 MiB UTF-8 envelope, checksum overhead, Unicode and unknown fields; private file >limit refused safely, no omitted records. | A3/A6 |
| A-RAW-01 | Corrupt known JSON/duplicate IDs/pending marker/partial denied enumeration preserved as independent raw evidence, not forced through V1 validation or falsely offered as restorable backup. | A4 |
| A-FILES-GEN-01 | Frozen/incorrect clock, repeated timestamp/ID collision, pre-existing filename, concurrent outside-file change. Preserve earlier generation; no latest-file overwrite or automatic retention deletion. | A3a/A3b |
| A-FILES-STATUS-01 | Close failure after bytes written, readback failure or revoked handle; classify uncertain/failed/local-readback states, keep off-device copy unknown; no persisted verified flag as deletion proof. | A3b |
| A-PAY-HIST-01 | paid20 with absent/empty/matching/nonempty conflicting history; openingPaid; separate purchase discounts; fractional total2719.4895; preserve raw views/reload and accepted legacy amounts. | Before A4/A5 |
| A-PAY-ALLOC-01 | Receipt0.01 with two0.006 allocations; negative/NaN/Infinity/sub-paise/overdue caps, combined receipt+discount, discount-only and no eligible discount target. Validate/store/audit identical accepted amounts. [Settlement][settle]/[Payment Out][payout]. | Before A4/A5 |
| A-PAY-ID-01 | Same-name/different-ID customers/suppliers; edited autocomplete, reassignment, cancellation/new receipt, replaced same-party modal and stale cached bills. Approved party only; unrelated rows exact. | Before A4/A5 |
| A-PIN-01 | Real generated PIN input/buttons, wrong/current/changed PIN, Enter/Escape, stale entity/index, every delete route, failed audit/business removal. Do not stub callbacks or log completed deletion prematurely. [PIN][pin]. | Before destructive adapter release |
| A-NUM-01 | Single/bulk/previous/CSV/imported/cancelled/deleted numbers, saved prefix/FY/counter, safe numeric bounds and repeated failure/retry. No numbering policy rewrite or duplicate reservation. | A4/A5; regression all runtime PRs |
| A-DATE-01 | IST00:30/23:30, October1–31, March31/April1, December31/January1 across device zones; audit/createdAt UTC; saved FY series unchanged. Existing [UTC/date defaults][date] are risks, not fixes authorized in A1. | Characterization/A6; separately scoped repair if needed |
| A-REPORT-01 | Independent cash versus accrual, Discount/Credit/unknown modes, undated opening paid, retained cancelled cash. Master opening +25/−25/−200 for all roles remains signed and separate from purchase payable. Legacy amount alias including amt0; no history writes. | A4 semantic gate/A6 |
| A-PRINT-ID-01 | View A then missing/deleted B; delayed A/B render, invalid/cancelled target, changed currentViewInvId and stale DOM. Print correct verified target or refuse. [View/print][print-id]. | A4/A6 |
| A-PRINT-LONG-01 | Short A4/A5, two-up page count, 40/80 wrapped lines, large/unbroken address/notes/terms/custom fields, denied measurement/popup, totals/balance/page bounds. Current A5 [hidden overflow][a5] must not receive a software certificate without tests. | A6/separate approved print fix |
| A-UI-FOCUS-01 | Held Detail pointer across delayed Settle insertion9296; Amount focus/keyboard entry across Payment Out timer9849. Actual UI calls, no timing retry or fake navigation. | Characterization/runtime regression |
| A-JOURNAL-PHASE-01 | Failure/interruption at stage/apply/counter/audit/revision/commit marker/rollback/cleanup, denied reads/removals, silent readback mismatch, reload and repeated recovery. Verify exact absence/raw values and truthful status. | A5 |
| A-JOURNAL-READER-01 | Second current tab renders/exports between apply steps; pending keys never advertised as a committed snapshot. | A5 |
| A-JOURNAL-FOREIGN-01 | Corrupt/version-mismatched/foreign before-after content; do not replace/clear unrecognized coordination bytes. Distinguish committed-state backup and emergency package. | A4/A5 |
| A-JOURNAL-CAP-01 | Originals+before+after+JSON/metadata/memory budgeting, 0/86/500/2,000/5,000 data/notes/photos, refused staging preserves records. No production SLA or live quota filling. | A5 |
| A-DELETE-01 | Direct/UI Clear All/Clear Audit/old bills/retail/payments, pending journal/invalid backup proof; no expanded deletion list or browser-local flag as independent-copy proof. | Separate consent/A4 |
| A-DRILL-ORIGIN-01 | New context/profile and actual independent test origin; another path on same host is not isolated. File-origin unsupported/shared behavior explicitly labelled. | A1b/A6 |
| A-RESTORE-RELOAD-01 | Exact supported V1 values / semantic V4 values before UI reload and after every startup block; compare migrations' history/paid/balance/alias changes, not only immediate readback. | A4/A6 |
| A-CI-HEAD-01 | All source/test paths are covered by triggers, actual head recorded, failures uploaded, source manifest matches runtime built/tested. No substitute old PR #10/merge-ref result. | Every future PR |
| A-CI-STATUS-01 | Completed, current blockers, unimplemented features, unsupported limits, skipped capture-only cases and hardware checks reported separately. Old writer remains actual FAIL, not xfail. | Every future PR/A6 |

## Fixture and browser matrix

Each future ordinary-runtime suite needs 0, 86, 500, 2,000 and 5,000 **synthetic** invoices with linked synthetic masters, purchases, retail and varied payload bytes. Do not assume invoice count predicts storage size. Include:

- Present/missing/empty known collections; unrelated keys, supported unknown keys, both preferences and import/journal markers.
- V4/V1 histories derived from code shapes: valid openings, independent supplier discounts, valid paid aggregates, conflicting nonempty history, cancelled receipts, old `amount` versus canonical `amt`, packing and fractional legacy amounts.
- Negative/nonfinite/malformed numbers, duplicate IDs/numbers, same-name/different-ID masters, stale forms/reviews/PIN indices, deleted masters and explicit unlinked histories. Do not infer links from names.
- UTC creation/audit metadata, IST business boundaries, Unicode/large notes/photos, counter/FY limits and fixture IDs that never resemble real customer identifiers.

Run shared functionality in Chromium/Firefox/WebKit after tooling approval. Chrome-only directory features use mock ports in all engines and supported native **disposable desktop Chrome/HTTPS** checks separately. Unsupported features must show manual fallback, not a functional pass. Physical phone keyboards, print dialogs/printers, real folders, off-device retrieval, power failure/eviction and real private archives are owner-controlled/unverified here.

## Per-PR acceptance versus release gates

- **A1a — approved/in progress:** inventory/contracts/fixtures, existing VM baseline and read-only synthetic CI; no production runtime diff or cloud capability removal. Candidate outcomes come from the verification report. New feature tests not implemented are labelled pending.
- **A1b:** complete diagnostic-only no-write/no-network/privacy tests. Ordinary app migrations must not run in this route.
- **A2:** zero JSONBin UI/direct/global requests and mutation, unchanged credentials/settings/formats, preserved billing checks; approved GS boundary.
- **A3a/b:** committed-backup membership/checksum/manual-generation/file lifecycle; no unjustified verified status or original-generation change. Do not call a physical owner copy verified from a mock.
- **A4:** full bootstrap/read/write/UI failure and compatible financial gates; actual partial failures visible and continued unsafe entry blocked. No invented A5 rollback.
- **A5:** recoverable protocol/cooperative writers/readers and all phase failures; old noncooperating writer still a strict failed limit.
- **A6:** checked independent snapshot recovered in an empty isolated environment, reload reconciliation, hardware/owner checks and explicit cutover decision.

The original planning review implemented no new code or test suite. A1a development has now been approved on `codex/xl-plan-a-a1a`; this matrix defines the allowed characterization boundary, while the verification report records what actually ran. A1b/A2/A3/A4/A5/A6 runtime work and merge/deployment remain approval-pending. Future failing current-safety assertions remain FAIL; future unimplemented features are not retroactively marked verified, nor forced into A1 merely to obtain green CI.

[main-source]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html
[db]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L902
[v1]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L690
[v13]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L7436
[notice]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L886
[invoice]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1307
[push]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2668
[bin]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2716
[settings]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2875
[standalone]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3607
[settle]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8797
[payout]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9787
[pin]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8523
[gs]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9204
[date]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L922
[print-id]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9570
[a5]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L5453
[import]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2218
[qa-v1]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/qa/verify-complete-backup.cjs#L9
[qa-v4]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/qa/verify-backup-import.cjs#L8
[workflow]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/.github/workflows/invoice-payment-safety.yml#L24
[old-blocker]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/9191b2ea5c7570f2bc3ec245dca2c48fb19aebba/docs/BLOCKER_REPAIR_VERIFICATION.md#L102
