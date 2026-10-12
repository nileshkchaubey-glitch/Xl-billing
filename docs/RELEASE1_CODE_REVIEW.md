# Release 1 code review and Release 2 gate

**Decision: BLOCKED. Release 1 is not a sufficiently safe foundation for Release 2.**

Reviewed Draft [PR #5](https://github.com/nileshkchaubey-glitch/Xl-billing/pull/5),
original head `aa34ef9e476d6256f48d7ead8d3870413b5d65c9`, against main/baseline
`29aeb20225bccfc653b192651de608491185096c`. The audit additions leave the
executable `index.html` unchanged. P0-6, P0-7 and P0-8 are **not implemented or
verified**. No Release 2 branch or PR was created. PR #5 stays draft; main,
hosting and the live business profile were not changed.

The stop follows the requested architectural/data-safety gate. Payment semantics
and unguarded historical rewrites must be resolved before a storage adapter can
reliably validate a commit, recovery or restored snapshot. Journaling an invalid
settlement would preserve the invalid settlement; a checksum would faithfully
identify the corrupted business state. Adding another late script override would
also leave earlier startup migrations outside the safety boundary.

## Scope and evidence

- Read all 10,131 lines of the current HTML, all 16 script blocks, embedded styles,
  tutorial code, immediate migrations, wrapper chains and final overrides.
- Reviewed every application diff hunk: 363 added and 205 removed lines. Reviewed
  tooling, configuration, fixtures, tests, documentation and preserved QA files.
- Inspected all 47 reachable Git commits and their change history, including the
  May financial normalization/purchase-discount changes, later uploaded versions,
  the separate cloud-refactor lineage and the restored standalone baseline.
  Historical cloud transaction claims do not describe this branch's localStorage.
- Accounted for every one of the original 108 changed files in
  [RELEASE1_FILE_REVIEW.md](RELEASE1_FILE_REVIEW.md). Parsed all JSON, read all logs,
  and decoded all 38 PNGs. Visually sampled the two owner-guide illustrations and
  the mobile payment/previous-bill captures. Screenshots are evidence of appearance,
  not assertions of data safety or pixel-regression baselines.
- Ran synthetic safety probes in fresh disposable contexts on a randomly assigned
  loopback HTTP port. All external requests were blocked. The second-tab test uses
  two pages in the same isolated context. No production URL, real localStorage,
  cloud account or real customer record was accessed.

Source locations below refer to the unchanged audited HTML. Severity: **Critical**
means financial-data loss/corruption or unsafe recovery; **High** means destructive
protection or important workflow failure; **Medium** means incorrect reporting,
view behavior or test coverage. Static findings are explicitly distinguished from
reproduced defects.

## Blocking findings

| ID / severity | Affected functions and evidence | Recommended fix / gate |
| --- | --- | --- |
| R1-01 Critical, PR regression | `saveSettlement` (8643), `allowPayment` (738), `reconcilePayment` (747). With total 100, historical paid 20 and no payment history, discount-only 10 skips `allowPayment` for its target and saves **paid 10, balance 90**. The prior state was paid 20, balance 80. `legacy-discount` reproduces this in all three engines. Commit `f8d3d47`, before P0-4, gives paid 30/balance 70 for the identical operation. | Validate the discount target and all allocations before mutation. Preserve unresolved history exactly and block changes with a visible reconciliation path. Define an explicit compatible representation for legitimate opening payments; never infer that empty history means nothing was paid. Characterize all historical invoice/purchase shapes first. |
| R1-02 Critical, inherited calculation problem amplified by PR | `saveSettlement` (8643), `savePoutPayment` (9624). Two allocations of 0.006 with entered receipt 0.01 pass aggregate validation, then each rounds to 0.01: **0.02 is recorded**. Validation and storage use different amounts; audit/success text sum the raw allocations. Earlier code stored 0.012, also incorrect. `settlement-rounding` and `payout-rounding`. | Parse money once into validated integer paise, or reject unsupported precision. Validate, store, summarize and audit the same allocation values; check their exact sum against the receipt. Preserve existing fractional totals through an explicit compatibility policy rather than rewriting them. |
| R1-03 Critical, inherited migration plus PR incompatibility | `runMigrations` (2144), `migrateV13` (7253), `migratePurchasesV14` (7318), `migrateV15` (9173). Startup changes paid 150 to 100 while history remains 150, without snapshot/audit. Version 16 does not stop the v13/v14/v15 IIFEs. A legitimate fractional total 2719.4895 accepts payment 2719.49; reopening clamps paid back to 2719.4895 but leaves history 2719.49. `startup-mutation`, `fractional-total-reload`. v5 additionally catches migration-write failure then advances its version marker. | Put recovery/read validation before every migration. Preserve original bytes, distinguish invalid records from supported historical precision, and preview/snapshot/verify any explicit repair. Remove silent clamping; define invariants compatible with stored legacy formats before introducing a journal or restore engine. |
| R1-04 Critical, inherited destructive read behavior | `DB.get` (692), all getters and save paths. Parse errors and denied reads return null; getters return empty arrays. A subsequent invoice save replaces a corrupt collection with one new invoice, or discards both synthetic original invoices after a denied read. `corrupt-storage`, `read-denied`; the corrupt-JSON defect also reproduces on the exact baseline. | Distinguish absent, unreadable, malformed and wrong-schema storage. Fail closed with persistent visible feedback and preserve raw bytes. Never permit ordinary saves, migrations or exports to reinterpret an unreadable collection as an empty shop. |
| R1-05 Critical, incomplete transaction boundary | `saveSaleInvoice` (1114 and v15 wrapper), `pbSaveAll` (3164), `auditLog` (8309), PIN setup and other multi-key writers. A settings-quota failure leaves a new invoice but an old counter; an audit-quota failure leaves invoice and counter committed after a **saved** toast. Reload preserves partial writes. No journal/revision/recovery exists. `failed-write-settings`, `failed-write-audit`. Invoice-key failure preserves bytes only; it has no user-facing error. | Inventory every mutation, including early migrations, imports, sync and deletion. Define one operation containing invoice/counter/audit and use recoverable staging before writing. Verify completion before any success UI; retain evidence and block further writes if recovery cannot finish. See the protocol requirements below. |
| R1-06 Critical, inherited unsafe restore / incomplete export | `importData` (2076), `exportData` (2067), `cloudPull`, `gsPull` (9064). A JSON object containing only `invoices:[]` silently clears invoices. Restore writes settings before a failed items write and reports “Invalid backup” without rollback. Exports omit audit/version/preferences and include the synthetic JSONBin secret. A backup-delete-restore exercise restores invoices but leaves the deletion audit. Truncated JSON is rejected, but shape/checksum validation is absent. `restore-wrong-schema`, `restore-partial-write`, `backup-completeness`, `backup-rollback`, `restore-tampered-checksum`. | Validate complete supported schemas before any write; preview counts, unknown keys and compatibility conflicts. Verify checksum for a versioned new format; explicitly identify legacy unchecked backups. Capture a complete pre-restore snapshot and make restore recoverable through the same early adapter. Separate complete private recovery data from redacted shareable exports. Do not claim the existing export is a complete rollback. |
| R1-07 High, incomplete PIN protection | `pbDelBill` (3023), `renderPrevBillsTable` (3240), old-bill party history. A real Delete-button click deletes an old invoice with a PIN hash configured, no PIN dialog and no audit. PR #5 even changes this button's arguments without routing deletion through its new guard. `old-bill-delete-pin`. `clearAllData` (2092) and Clear Audit remain additional unguarded destructive paths (static). | Enumerate every destructive entry point and route it through one guarded mutation API. Bind the confirmation to the selected immutable entity and current revision. Preserve recoverability before deletion. |
| R1-08 High, new asynchronous deletion regression | `deletePaymentEntry` (8466), `delPurPayEntry` (8478), `withDeletePin` (8338). Confirmation targets an array index. After a second tab removes payment 0, the pending dialog deletes the different remaining payment at index 0. `stale-payment-delete`. A failed invoice deletion first writes its audit and then loses the error because the dialog was already removed. `failed-delete-feedback`: invoice remains, deletion audit exists, zero visible alerts. | Bind selected payment identity/content and invoice revision at prompt time; reread and reject stale confirmation. Keep the dialog/error visible until the entire operation succeeds. Do not write a completed-deletion audit ahead of a failed destructive write. |
| R1-09 High, backward-compatibility gap | `allowPayment` (738), `savePayment`, `savePurPayment`, invoice edit. Ordinary payments for a legitimate legacy bill with paid 20 and absent history now fail; exact baseline and pre-P0-4 commit accept the same payment and preserve paid 30. The May `07bfd14` purchase format has separate `discounts`/`discount`; current validation ignores them: total 500, paid 20, discount 10, remaining 470 accepts another 480, recording paid 500 plus discount 10. `legacy-payment`, `historical-purchase-discount`. | Create checked-in fixtures from historical code-defined shapes, with synthetic values only. Specify how opening amounts and separate discounts contribute to payable balances, and preserve those fields. Avoid disabling ordinary historical business workflows without an explicit compatible resolution path. |
| R1-10 High, inherited stored-script execution | Winning `renderSalesList` (9264), invoice/print templates, purchase autocomplete and other `innerHTML` interpolation. A harmless image-error payload stored in `partyName` executes on Sale List. `stored-text-xss` uses loopback only. Escaped handler arguments in PR #5 do not protect displayed text or interpolated IDs. | Encode text/attributes for their actual DOM context or use textContent and event listeners. Validate imported IDs, avoid string-generated executable handlers and characterize print/export/import surfaces. A valid checksum does not make imported text safe. |

R1-01, R1-03 and R1-09 are incompatible with the requested preservation of existing
invoice formats and business functionality. R1-04 and R1-05 establish that a later
adapter cannot safely wrap only the final save handlers. These are foundation
problems in addition to the P0-6/7 features that were already planned, so the review
does not treat all missing future features as automatic architectural blockers.

## Other unresolved findings

| ID / severity | Evidence / affected code | Recommended fix |
| --- | --- | --- |
| R1-11 Medium, PR view regression | `listPager` (769) supplies invoice-shaped sort fields to purchases/transactions. Purchases store `billNo`, transactions use `party`, `amount`, `type`. `purchase-sort` selects ascending invoice-number sort and displays P-2 before P-1. `listHeaders` is added to the overridden v13 purchase renderer, not the winning v14 renderer: zero sortable purchase headers. Transaction field mismatch is static. | Define explicit field maps per list and attach controls to winning renderers. Assert actual numeric/text/date ordering, not just dropdown presence. |
| R1-12 Medium, PR search regression | `renderAuditPage` (8802) filters all JSON fields before paging, then filters a narrower label/details/entity set afterward. Searching the user field shows “1–20 of 25” but zero rows. `audit-search`. Rendering also recreates the focused search input. | Apply one defined filter before sorting/paging; preserve focus and query state. Assert row counts and reachability for every searchable field. |
| R1-13 Medium, inherited incomplete workflow | `openPartyDetail` v15 adds Transactions; `pdShowTab` (7008) only handles inv/pay. Clicking Transactions never reveals its content. `party-transactions-tab`. | Extend the tab controller and verify real clicks, focus and all tab contents. The existing page crawl never clicks this tab. |
| R1-14 Medium, inconsistent reporting policy | `getAllPayments` (4104) includes cancelled invoice receipts, while dashboard/sale/outstanding exclude the same invoice. `cancelled-payment-ledger` reproduces the difference. `renderTxnPage` also sums sale value and its payments together as “Total IN,” mixing accrual and cash activity (static). | Specify treatment of cancellation, retained cash, discounts and reversals, then reconcile independent report totals. Do not simply erase real receipts to make totals agree. |
| R1-15 High, import/create validation gaps (static) | `importCSV`, `xlProcessCSV` (4840), `savePurchase` (8193), `purBulkSaveAll` (7709) bypass invoice-number/history/overpayment checks. CSV invoices can have paid values with empty histories. Purchase bulk numbers restart each batch. `nextInvoiceNumber` (719) has no finite/safe-integer limit; large colliding counters can stop advancing. | Share schema, amount and identifier validation across all creation/import paths, with bounded series counters and import-wide deduplication. Keep originals intact and preview rejected rows. These paths have not received complete browser acceptance testing. |
| R1-16 Medium, inherited export/date/relationship gaps (static) | CSV quoting only checks commas, does not consistently escape quotes/newlines or neutralize formulas. `today()` uses UTC despite IST workflows. Hard party/item deletion leaves linked invoices. Optional sync merges/overwrites sequentially without compatible validation/recovery. | Include these in the next foundation fixes and independent fixture-based tests. No CSV safety, IST boundary, hardware print or cloud-sync safety verification is claimed. |

## Review of the existing tests and documentation

The committed report of **66 passes** consists of 22 cases in three engines. The
visual case returns immediately in Firefox/WebKit, so two passes have no assertions.
The other screenshots are captures, not baseline comparisons. The fresh audit run
excluded that capture case and passed **63 functional browser cases**, the preserved
parcel VM check and **4 unit/property tests**. This demonstrates existing coverage
still runs, not that the release is safe.

Important coverage gaps:

1. The “invoice entry, edit, cancel and restore” case never edits an invoice. The
   “payments and replacements” property only appends payments; it never replaces
   them. Its paise-only fixtures cannot expose legacy fractional totals.
2. All main fixtures have matching modern payment histories. They do not exercise
   legitimate opening paid balances, missing histories, historical purchase
   discounts, migration failures, read errors, quota errors, partial restore,
   second-tab changes or real rollback.
3. Seven-list tests check controls/size/direction but do not assert most ordering.
   The page crawl does not operate every menu/modal/tab. Mutation tests recreate
   five selected defects; they are not a general financial-invariant oracle.
4. Baseline/mutation HTTP runs use `XL_HTML`, but the file-origin case and unit tests
   read the current `index.html`. A full baseline run is therefore mixed-source
   evidence. The earlier 15-case baseline report is retained as historical evidence.
5. Lint parses concatenated scripts and treats every `window.name` assignment as a
   global; it does not establish initialization order or validate all generated
   handlers. HTML validation has 144 legacy errors and lint has 143 warnings; neither
   is a complete acceptance gate. Clean build merely copies the executable file.
6. Existing documentation honestly calls most work partial. Its general descriptions
   of guarded deletion and checked payment routes must now be read with this review:
   the old-bill bypass and discount/history corruption are confirmed defects.
   An empty secret-scan log is limited evidence, not a full dependency/license audit.

The [file manifest](RELEASE1_FILE_REVIEW.md) identifies **75 generated evidence
files (4,588,791 bytes)** and one duplicate generated JSON inventory (63,267 bytes).
Full repeated JSON/log output and 36 non-owner-guide screenshots can move to CI
artifacts. Keep the dependency lock, source/tests, compact pinned baseline/mutation
summaries, one useful architecture inventory and two owner-guide illustrations.
Failed browser-install/debug logs are not runtime requirements. Nothing was removed
in this audit because earlier delivery instructions requested retained evidence.

## New reproducible safety evidence

Run `npm run test:review` after installing Playwright Chromium. The command returns
**1 when any safety assertion fails**; it does not mark known defects as expected
passes. The dedicated **Release 1 data-safety gate** CI job uses this command and
uploads its report even on failure. The legacy test job remains separate.

| Run | Safety assertions | Passed | Failed | Harness errors |
| --- | ---: | ---: | ---: | ---: |
| [Chromium](../test/review/release1-chromium.json) | 27 | 3 | 24 | 0 |
| [Firefox](../test/review/release1-firefox.json) | 27 | 3 | 24 | 0 |
| [WebKit](../test/review/release1-webkit.json) | 27 | 3 | 24 | 0 |
| [Original baseline, targeted](../test/review/original-baseline.json) | 4 | 2 | 2 | 0 |
| [Before P0-4, targeted](../test/review/prepayment-change.json) | 4 | 2 | 2 | 0 |

These are **24 distinct failing assertions reproduced across three engines**, not
72 independent root causes. JSON reports include source revision/SHA-256, observed
state and any page errors. The baseline comparisons identify the regular historical
payment regression; the pre-P0-4 comparison isolates the discount regression and
shows allocation precision was already defective before the new rounding logic.

The three passing safety assertions are deliberately narrow: failure of the first
invoice write preserves storage bytes; truncated JSON leaves storage unchanged;
a conventional synthetic v4 backup can restore ordinary invoice fields. They do
not prove visible quota handling, complete legacy compatibility or safe rollback.

The new suite explicitly exercises denied/corrupt reads, failed first/second/audit
writes, reload after partial commit, corrupted/tampered backup input, partial
restore, backup rollback and two-tab changes. Tampered-checksum testing supplies an
extra checksum field to the legacy v4 input and proves it is ignored; **a new
checksum format/verifier does not yet exist**. Exception injection followed by
reload simulates interruption between writes; physical power-loss durability,
browser eviction and filesystem crash behavior are **not tested or guaranteed**.
Huge-file limits, automatic folder permissions/reminder timing and a successful
recoverable transaction implementation remain **not implemented / not verified**.

## Required localStorage recovery design before P0-6 implementation

localStorage provides synchronous writes to individual keys. A failed `setItem`
should leave that key unchanged, as the first-write probe demonstrates. It does
**not** offer a transaction spanning invoices, counters, settings and audit, a
compare-and-swap primitive, a cross-tab lock or guaranteed physical disk flush.
Several consecutive calls, a try/catch or writing audit first do not create
atomicity. A rollback itself can fail. Browser/site-data clearing can erase a
journal and the records together; an external backup is still essential.

The following is a proposed design, **not implemented or tested recovery**:

1. Initialize one storage adapter before all current migrations/renderers. Route
   every billing/settings/audit/import/sync write and read through it. Validate raw
   schemas without normalizing unreadable data to empty collections. Maintain
   compatible legacy decoding separately from persistence.
2. Serialize writers where supported with Web Locks; use revisions and stale-form
   checks. Feature-detect secure-context/file-origin support. Broadcast/storage
   events are notifications, not locks. A localStorage lock token cannot provide
   compare-and-swap isolation. Where reliable writer coordination is unavailable,
   enforce a safe write restriction and explain it; do not claim isolation.
3. Build the full operation in memory: expected revision, exact before/after raw
   values for every affected key, counts and business invariants. Include numbering
   and audit in the same operation. Preserve unknown compatible fields and keys.
4. Write and reread one journal record containing the complete recovery material
   **before** changing legacy keys. If staging fails because of quota, change no
   business key. Account for duplicated data; do not delete originals to free space.
5. Apply keys in a deterministic order, verify readback, then record a completion
   marker/revision. Interrupted readers must detect an outstanding journal and
   recover or block reads/writes; they cannot assume the visible legacy keys form
   a consistent snapshot. Delay success UI until verification finishes.
6. Before startup migrations or normal use, recover idempotently from journal phase
   and exact revision/content checks. Choose a documented rollback/roll-forward
   policy. If neither can finish, retain the journal and raw bytes, block writes,
   show the problem and permit independent recovery export. Never silently discard
   the recovery record or automatically select an unrelated newer tab state.
7. Test failure/interruption at every journal, data, revision and cleanup write;
   include repeated recovery, failure during rollback, corrupted journals, quota
   exhaustion, stale readers/writers and old exports. Avoid any claim of atomic
   multi-key visibility or guaranteed durability across physical crashes.

## P0-7/P0-8 prerequisites and acceptance criteria

P0-7 must inventory all `shop4_*` keys, version markers, audit, unknown compatible
keys and the separately named `v8_slcols`/`v8_compact` preferences. Define whether
internal recovery journals belong to a recovery package or a clean committed-state
backup. Use a versioned deterministic envelope and SHA-256 checksum over clearly
specified bytes; SHA-256 detects accidental corruption, not authenticity. Do not
load imported content into executable HTML. Keep a complete private recovery format
and explicitly redacted shareable exports so secret handling does not silently
break rollback. Legacy v4/v5 input needs an explicit unchecked compatibility path.

Restore needs full validation/checksum verification before writes, a count/schema
preview, a complete pre-restore recovery snapshot and adapter-level recovery.
Acceptance must include current and historical fixtures, wrong types, duplicate
IDs/numbers, unsupported versions, corrupt/truncated/tampered/oversized input,
quota failure during stage/apply/recovery, interrupted restore, repeat recovery and
byte-preserving rollback including settings/audit/unknown fields. None of this is
claimed delivered by the existing import/export functions.

P0-8 must remain free and offline: user-selected folder backups only where the
File System Access API supports them and after its required user gesture/permission;
fallback to manual downloaded backups and reminders on unsupported mobile/file
origins. Browser-local snapshots are not independent backups. Handle permission
revocation, missing folders, write errors, stale backup state and tab coordination.
Mark backup success only after completion. Test reminders and permission lifecycle
with isolated clocks and synthetic files; do not repeatedly trigger mobile downloads
or promise background writes while the browser is closed.

## Follow-up decision

Keep PR #5 draft. Resolve the blocking financial/history, early-migration and
mutation-boundary issues with independently reviewed synthetic fixtures first;
then rerun the failing gate. Only after that review can a separate Release 2 branch
and Draft PR safely implement P0-6/7/8. Release 2 remains stopped at this checkpoint;
no unverified workaround, mandatory backend, merge or deployment was introduced.
