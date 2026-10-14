# XL Billing Plan A — implementation backlog and A1a authorization

Date: 2026-10-14 (owner timezone: Asia/Kolkata). Status: **limited A1a development approved; A1a work in progress; later phases and merge/deployment approval pending**.

This repository document adapts the complete English planning review of `XL_Billing_Plan_A_Work_Codex_Implementation_2026-10-14.md`. The owner subsequently approved only A1a source inventory, documentation, synthetic characterization and narrowly scoped read-only CI. Work is on `codex/xl-plan-a-a1a` against the pinned baseline below. This authorization does not approve A1b diagnostics, runtime/storage/provider changes, later phases, merge or deployment. Candidate results belong in [A1a verification](PLAN_A_A1A_VERIFICATION.md); approval here is a scope statement, not a safety result.

## Verified baseline and limits

- Approved baseline main: [3855c6ab21de64fdc9e28116fcd0f770304eef66](https://github.com/nileshkchaubey-glitch/Xl-billing/commit/3855c6ab21de64fdc9e28116fcd0f770304eef66), merge of PR #16. This matches the specification's baseline. Runtime: 10,290 lines / 554,923 bytes; SHA-256 `d5fbcd1a47a5bf6e8d2ec735b561f46108e3c905878ba301acd322040b52b70a`.
- During the planning review, all **15** baseline-main files were read from an immutable source snapshot and checked against their Git blob hashes. That review used a temporary non-Git directory without updating local refs. The candidate now has additional development files; its source contract is recorded in the [baseline manifest](../qa/plan-a/baseline-source.json) and [source inventory](PLAN_A_SOURCE_INVENTORY.md).
- The six mandatory existing QA scripts passed in the planning snapshot using synthetic in-memory Maps/VMs; the source files remained byte-identical. Candidate reruns and their actual results are recorded separately in [A1a verification](PLAN_A_A1A_VERIFICATION.md). These scripts do not execute the full browser bootstrap, native filesystem dialogs, physical printers or real profiles.
- The pinned baseline has five Node-only workflows and no package manifest, pinned Playwright suite or `docs/` directory. Its existing workflows use Node 22 and default PR checkout. A1a adds development documentation/characterization and a narrowly scoped workflow with explicit PR-head checkout and relevant new-file triggers; verification must confirm the final candidate.
- The original risk register and Release 1 audit are at `d07729e60e6901fa1255a8331dde805c22890e9c`; the blocker repair report is at `9191b2ea5c7570f2bc3ec245dca2c48fb19aebba`. Main and that repair head **diverge**, sharing baseline `29aeb20225bccfc653b192651de608491185096c`. Old 110-Node/508-browser results do not certify current main. PR #10 is closed and unmerged.
- The specification's 86-invoice / 120,173-byte example and reported JSONBin limit are owner-provided historical observations, not measurements made here. No live JSONBin response or current business size was inspected. The reported object exceeds either 100,000 or 102,400 bytes, but that alone does not establish a production HTTP failure cause.

Source links below point to the pinned main, not the earlier repair branch. Status means current code capability, not a completed new implementation. [Risk traceability](PLAN_A_RISK_TRACEABILITY.md) and [test matrix](PLAN_A_TEST_MATRIX.md) supply the acceptance details.

## Authorized first scope — A1a

**A1a — source inventory and synthetic baseline characterization only — is approved and in progress.** Prepare a small Draft PR against the freshly rechecked pinned main. Authorized changes:

1. Add the reviewed source/writer inventory, risk mapping, [future diagnostic contract](PLAN_A_DIAGNOSTIC_CONTRACT.md) and test matrix under `docs/PLAN_A_*`.
2. Add only a development QA baseline/evidence runner and synthetic historical-shape fixtures. Preserve all six existing scripts. Record source/test hashes and unsafe/unverified outcomes without converting them into safety passes.
3. Add a narrowly scoped read-only CI job for these files, explicit PR-head checkout, synthetic-only artifacts and visible failure reporting. Reuse built-in Node tooling; browser tooling installation belongs to a separately approved scope.

**Production diff contract:** `index.html` unchanged; no new live diagnostics panel, adapter, storage key, migration, export/import format, cloud capability removal or background job. Existing application/storage/provider behavior remains outside the claimed safety result. This is a characterization prerequisite, not a claim that current billing is safe.

A1a gates: all six existing VM scripts pass on the actual PR head; inventory distinguishes winning, replaced and tutorial code; source hashes are bound to reports; fixtures/logs contain no business data; no external service request or production profile occurs; unsupported current behavior stays clearly reported. Documentation-only/test-only acceptance must be distinguished from future A4/A5 feature acceptance.

**A1b diagnostics UI requires another reviewed decision.** A late panel cannot satisfy zero-write launch: [V5 runs immediately][v5-call], and [V13][v13], [V14][v14] and [V15][v15] mutate before normal navigation. Choose a separate self-contained same-origin diagnostics tool that never loads application initialization, or explicitly approve an early diagnostics-only bootstrap. A standalone tool would be an additional reviewed static support HTML file with its own offline contract; the production application remains self-contained. The early-bootstrap option changes script initialization and needs broader browser regression. Another URL path is not an isolated restore environment; file-origin storage sharing also needs explicit support tests. Neither route is part of A1a.

The A1a branch is now authorized and exists. A1b and every later scope still require their own reviewed authorization. A1a development approval is not merge/deployment approval; nothing in this document approves a production release.

## Source-linked backlog: every proposed goal

### A1 — discovery and read-only diagnostics

| Task | Current-main verification | Proposed boundary / acceptance |
| --- | --- | --- |
| A1-01: enumerate reads/writes and winning chains | [DB][db], [entry wrapper][entry], [audit wrappers][audit-wrap], [migrations][v13], direct preferences and imports exist; no complete inventory in main | A1a inventory must include every category in the risk document, predecessor definitions, closures and actual caller order. |
| A1-02: diagnostic-only entry | Ordinary startup writes through [V5][v5], [V13][v13], [V14][v14], [V15][v15]; the [marker notice][notice] runs too late | A1b isolated route/earliest gate; A-READ-02 compares exact presence and values before/after full diagnostic visits. Do not silently incorporate A4 into a panel patch. |
| A1-03: origin/profile/count/size/status panel | [Getters][db] hide denied/corrupt reads; [export][export] records no persistent verified-copy history | Read raw strings through a diagnostic-only port; distinguish missing, denied, malformed, wrong type and unknown. Profile identity, export age and independent-copy state are unknown unless reliable evidence exists. Warn against private/incognito billing, clearing site data, changing profile/device without a verified independent copy and simultaneous editors; do not invent private-mode/profile detection. |
| A1-04: safe financial/schema diagnostics | [V1 validation][v1-validation] checks collection shape/IDs, not full accounting; [receipt paths][standalone] have different legacy semantics | Report incompatible or unexplained states without repairing them. Never show private values/error excerpts; render untrusted text safely. |
| A1-05: UTF-8/UTF-16 and approximate quota bands | Current source has no `navigator.storage.estimate()` panel or quota reservation | Report exact encoded string lengths and separately labelled origin estimate. Key/encoding/metadata overhead and free localStorage capacity remain uncertain. No quota-fill probe on a real profile. |
| A1-06: 0/86/500/2,000/5,000 fixtures and historical formats | [Current V1 QA][qa-v1] uses two invoices; [V4 QA][qa-v4] uses one | Synthetic values only; missing-store versus present-empty collections; V4/V1, unknown safe keys, legacy history and large Unicode/photo/notes payloads. Record measured bytes and timings, not a capacity SLA. |
| A1-07: evidence and diagnostics-only screenshots | Current workflows are Node-only; [entry QA][qa-entry] executes a snippet | Separate passing baseline, source-confirmed risks, unimplemented gates and actual browser evidence. Future screenshots labelled diagnostics only; screenshots do not prove accounting or durability. |

### A2 — JSONBin quarantine, with separate owner consent

| Task | Current-main verification | Proposed boundary / acceptance |
| --- | --- | --- |
| A2-01: stop ordinary UI and direct provider calls | [Push][push] PUTs V5; [Pull][pull] overwrites six keys; [Create Bin][create-bin] POSTs independently; [buttons][cloud-buttons] invoke globals | Approval must cover **all three** functions/buttons. UI and direct calls produce zero JSONBin requests and zero storage changes, including valid synthetic credentials. |
| A2-02: retain settings/credentials | [Settings wrapper][cloud-settings] writes current input values; four save layers exist | Do not replace credential fields with empty inputs or clear properties. Test visit/save/cancel through final settings chain and exact stored properties. |
| A2-03: preserve backup/restore and billing | [V1 export/import][export] and [V4 parser][v4] are separate from JSONBin | Keep current wire formats and empty-profile protection; preserve all six regression scripts and future full workflow checks. |
| A2-04: honest status everywhere | Upload-success text at [Push][push]; sync instructions in [GitHub guide][guide] | Show legacy JSONBin disabled/not verified; replace PC Push/phone Pull advice. No off-device-success claim. |
| A2-05: credential retirement guide | Complete settings are preserved in [V1 records][v1-encode] | Owner-only rotation after private independent backup possession. No actual rotation, deletion, key display or request during development tests. |
| A2-06: decide non-JSONBin sync boundary | Winning [GS Push][gs-push] uploads settings; [GS Pull][gs-pull] merges items/parties and writes audit | JSONBin-only quarantine does not fulfill a claim that all cloud mutation is disabled. Ask whether Apps Script sync is retired too; regardless, A4 must gate its writes. No provider is contacted by tests. |

### A3 — immutable external generations, without migration

| Task | Current-main verification | Proposed boundary / acceptance |
| --- | --- | --- |
| A3-01: keep complete main V1 contract | [Key policy][v1-keys] allows matching unknown `shop4_` keys plus two preferences, excludes pending marker; [V1][v1-encode] preserves raw strings | Retain format/checksum/membership; absent fields not fabricated. Preserve private credentials and audit. SHA-256 detects accidental corruption; it provides neither encryption nor authentication. Complete private recovery exports, non-restorable shareable/redacted artifacts and emergency raw evidence remain distinct. This does not authorize implementing a new redacted exporter. Unsupported or corrupt committed captures remain refused. |
| A3-02: sortable unique filenames | [Export][export] uses `Date.now()` alone | Define timezone explicitly (UTC filename metadata, optional IST display), generation IDs and existing-name refusal. No silent replacement, including duplicate-clock/collision cases. |
| A3-03: universal manual download | [Export][export] already requests a browser download | Keep fallback and truthful requested/unchecked wording; handle missing crypto, Blob/object-URL failures and size limits without storage mutation. |
| A3-04: optional desktop directory flow | No File System Access implementation in main | A3b after A3a manual generations: secure-context feature detection, owner gesture, picker cancel/permission denial/revocation; session-only handle unless another persistence design is approved. No IndexedDB handle store. |
| A3-05: close/reopen/readback verification | Browser download has no filesystem readback | Verify exact saved file and checksum after close; classify write/close/readback uncertainty accurately. A partial unique file must not replace an earlier generation or produce verified status. |
| A3-06: independent second copy | Main has no proof of off-device retrieval | Owner copies to independent private media/location and retrieves/checks it. A Drive sync-folder pathname, directory permission or local readback is not upload or independence proof. No OAuth or automated network upload. |
| A3-07: evidence-backed status | No verified-file state persisted by current [export][export] | Initially unknown; successful local readback means local file verified only. A1 must not add metadata writes; any later metadata key/schema needs explicit review and tests. |
| A3-08: 7 daily/4 weekly/3 monthly retention | Not implemented; specified as proposal | Owner chooses privacy, disk budget and manual retention. No automatic deletion, overwrite or enforced rotation. Before-release and end-of-business-day copies remain owner actions. |
| A3-09: optional automation/reminders | No directory scheduling implementation in main | Default off. Timers must not request permission or cause repeated downloads. Reminders/authorized auto-writes need another explicit approval; nothing runs with the app closed. |
| A3-10: failure tests and recovered generation | [V1 QA][qa-v1] covers one write failure and one digest-time change, not physical files | Add complete file lifecycle, memory/size/Unicode/collision tests, isolated empty restore and before/after startup checks. A6 post-reload fidelity may remain blocked until A4. |

### A4 — early integrity and truthful failures; financial prerequisites first

| Task | Current-main verification | Proposed boundary / acceptance |
| --- | --- | --- |
| A4-01: bootstrap before every writer | [Notice][notice] is DOMContentLoaded; [V5][v5] alone checks import marker; [V13][v13]/[V14][v14]/[V15][v15] do not | Include **V14** explicitly, existing `shop4_import_pending`, future/foreign journals, normal load handlers, keyboard and direct calls. No write-capable initialization in locked state. |
| A4-02: missing/denied/corrupt reads | [DB][db] catches every read/parse error and getters supply empty/default values | Fail closed without confusing a fresh absent collection with JSON `null`, bad JSON or denied access. Preserve valid legacy shape/unknown keys and original raw strings. |
| A4-03: guarded writes/preconditions | [Create][invoice] writes invoice then counter separately; [settings][settings] has four write layers | Trap security/quota/readback failure, stop later writes and block further entry. A4 alone may have partial commits; truthful recovery-required status is essential. Exact operation rollback belongs to A5 unless staging is deliberately added here. |
| A4-04: success/audit/print ordering | Base [invoice save][invoice] acknowledges before [audit wrapper][audit-wrap] | No completed-success toast/navigation/print before required invoice/counter/audit verification. Deletion audit also must not claim a failed deletion. |
| A4-05: financial history compatibility | [Standalone][standalone], [edit][edit], [settlement][settlement], [purchase receipt][pur-pay], [Payment Out][payout] differ | Characterize all historical shapes, precision, separate discounts, same-name parties and stale review first. Do not impose `paid == sum(payments)` on all old data, infer receipts, invert opening signs or silently normalize. |
| A4-06: all writers, not just Save Invoice | CSV, direct preferences, [GS Pull][gs-pull], clear actions, bulk bills and imports bypass a single late save wrapper | Use the complete mutation inventory in risk traceability. Test every winning UI/direct route and settings wrapper; no catch-and-ignore success. |
| A4-07: independent emergency raw export | [V1 validation][v1-validation] refuses corrupt JSON/IDs; [collect][v1-keys] refuses pending import | New raw evidence format and UI must work before normal initialization, preserve readable raw strings/markers, explicitly identify partial/denied capture, and never advertise it as a valid restorable V1. No Clear Storage action. |
| A4-08: acceptance/release boundary | Current [QA safety][qa-safety] uses stubs and selected snippets | Full isolated browser initialization/reload/failure injection required, plus historical accounting and real PIN/print routes. No unit-only A4 release or claim of completed P0-6. |

### A5 — optional recoverable protocol, after separate approval

| Task | Current-main verification | Proposed boundary / acceptance |
| --- | --- | --- |
| A5-01: full immutable operation | Current [DB][db] has no transaction adapter/revision | Validate operation semantics and prepare exact before/after values plus absence, stable IDs, counter, settings and audit. Preserve source formats and bounded numbering rules. |
| A5-02: cooperative single writer | No Web Locks/revision/storage-event protocol in main | Feature-detect HTTPS/file-origin support; define safe fallback when coordination is unavailable. Storage events only notify; stale forms/PIN/payment reviews require immutable identity/content checks. |
| A5-03: quota-aware staged journal | No business-operation journal; existing [import marker][v1-restore] is not such a journal | Budget originals + before + after + serialized metadata/encoding and memory. An estimate is not a reservation. Verified full journal before business keys; failed staging leaves keys unchanged. |
| A5-04: apply/revision/cleanup outcomes | Existing [invoice][invoice] and [audit][audit] write sequentially | Deterministic verified application, completion/revision and explicit rolled-back, partial/recovery-pending, committed-cleanup-uncertain outcomes. Never repeat a verified commit or reserve duplicate numbers. |
| A5-05: startup recovery | Current startup does not understand a future journal | Design protocol/version/phase/content checks before migrations; idempotent exact-byte rollback/roll-forward. Preserve foreign, corrupt or ambiguous journal bytes; never auto-clear them. |
| A5-06: readers and other tabs | [Getters][db] independently read collections | Current-version readers must block/identify partly applied state; stale tab remains read-only until an approved refresh. Test rendering/export mid-apply and stale modal/PIN context. |
| A5-07: all fault/interruption steps | No current browser protocol suite | Stage/apply/revision/marker/rollback/remove/readback/cleanup errors, abrupt disposable-process interruption, reload and repeated recovery. Physical disk durability remains unverified. |
| A5-08: older writers/optional omission | [Historical blocker report][old-blockers] retains the noncooperating race | Reproduce as a visible failed release gate; never xfail/invert it. A5 cannot prevent old code writing between checks and `setItem`. If excluded writers/single-master consent cannot be assured, do not mark A5 production-safe. Omitting A5 leaves P0-6 incomplete. |

### A6 — owner drill and release decision

| Task | Current-main verification | Proposed boundary / acceptance |
| --- | --- | --- |
| A6-01: isolated V1/V4 restore | [V1 restore][v1-restore] and [V4 restore][v4] refuse occupied profiles; [UI][import-ui] reloads afterwards | V1 supported-key raw equality; V4 semantic section equality because it reserializes JSON. Compare both immediately after restore **and after actual app reload**. |
| A6-02: records/reports/accounting comparison | [Migrations][v13] can change restored history; reports mix cash/accrual | Independent IDs/numbers/packing/receipts/discounts/paid/balance/cancelled/opening components, settings/audit and reports. Backup byte fidelity and accounting correctness are separate gates; do not rewrite history to satisfy a report. |
| A6-03: owner/private independent-copy drill | No owner-device or real-file check performed here | Owner alone retrieves a private independent copy and verifies it locally, after synthetic rehearsal. Different GitHub Pages paths share one origin; use a new browser profile/context and independent test origin. |
| A6-04: cutover/smoke/revert evidence | [Owner backup guide][backup-guide] lists unresolved device checks | Record exact code SHA, file hash, tests, residual blockers, owner, Chrome/print checks and explicit merge decision. GitHub Pages merge may deploy. HTML rollback does not roll back business data. |
| A6-05: failure hold policy | [Clear All][clear] deletes only six keys and leaves other history/markers | Stop entry, preserve raw evidence and generations, close older copies, recover in a reviewed empty profile. Do not clear/re-import live data or broaden Clear All deletion scope. Any later destructive-action guard is separately approved. |

## Dependencies and approval gates

Recommended order: A1a → approved A1b/A2 → A3a → optional A3b → synthetic A6 rehearsal. A4 begins only after historical financial characterization and a bootstrap design review. A5 is optional and follows accepted A4; final A6 cutover depends on the applicable storage/history gates. A6 documentation and synthetic drill design can start earlier, but a passing codec restore is not a passed final drill.

The specification's minimum-before-any-release matrix must be split into **per-PR acceptance**, **future unimplemented acceptance**, and **actual current blockers**. Do not require an unimplemented journal to pass before A1 documentation/manual generations, and do not rename an actual old-writer failure to PASS. A4 must not claim A5 rollback guarantees. A-TAB-02 versus A-CI-01 needs an explicit owner release-risk decision; until that decision, strict overall release readiness remains blocked.

Scope protections apply to every future PR: preserve invoice numbering/FY/counters, master opening signs, raw compatible fields, current V1/V4 formats, offline/self-contained runtime, private settings and the six QA scripts. No IndexedDB/backend, paid service, account connection, real-data fixture, automatic reminder/write/retention deletion or live provider test is implied by approval of A1a.

## Authorization and decisions still pending

1. A1a development only is approved on `codex/xl-plan-a-a1a`; candidate verification and Draft PR handoff are in progress. A1a completion does not approve merging or deployment.
2. Later approve A1b entry design and whether JSONBin **Push/Pull/Create Bin** and Apps Script synchronization are retired.
3. Choose private backup location, independent second copy and manual retention; current defaults remain manual download and copy status unknown.
4. Accept one master Chrome profile/device and the explicit old-writer limitation; no forced cache update closes old tabs.
5. Separately authorize A4, optional A5, any automated backup/reminder, and each merge/deployment. Existing opening-balance sign policy is already settled and needs no repeat question.

[db]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L902
[entry]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L10273
[audit-wrap]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8619
[v5-call]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2886
[v5]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2289
[v13]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L7436
[v14]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L7501
[v15]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9328
[notice]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L886
[invoice]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1242
[standalone]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3607
[edit]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L4133
[settlement]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8797
[pur-pay]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8069
[payout]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9787
[settings]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2170
[audit]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8497
[push]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2668
[pull]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2689
[create-bin]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2716
[cloud-buttons]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2849
[cloud-settings]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2875
[guide]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L6009
[gs-push]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9173
[gs-pull]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9204
[v1-keys]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L697
[v1-validation]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L715
[v1-encode]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L748
[v1-restore]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L772
[v4]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L815
[export]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2197
[import-ui]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2218
[clear]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2237
[qa-v1]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/qa/verify-complete-backup.cjs#L9
[qa-v4]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/qa/verify-backup-import.cjs#L8
[qa-entry]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/qa/verify-invoice-entry.cjs#L7
[qa-safety]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/qa/verify-invoice-payment-safety.cjs#L53
[backup-guide]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/qa/STEP2_BACKUP_RESTORE.md#L14
[old-blockers]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/9191b2ea5c7570f2bc3ec245dca2c48fb19aebba/docs/BLOCKER_REPAIR_VERIFICATION.md#L102
