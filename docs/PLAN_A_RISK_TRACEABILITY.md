# Plan A — compatibility, risk traceability and source inventory

Status: limited A1a documentation/source characterization complete; all later implementation/release gates remain approval-pending. Based on main `3855c6ab21de64fdc9e28116fcd0f770304eef66`. Main runtime SHA-256: `d5fbcd1a47a5bf6e8d2ec735b561f46108e3c905878ba301acd322040b52b70a`.

Evidence classes: **VERIFIED QA** refers only to an explicitly recorded passing isolated VM script; the planning review recorded six such passes. **SOURCE-CONFIRMED** means the code path/ordering is present, not that its runtime behavior is safe. **HISTORICAL REPRODUCTION** belongs to an earlier pinned audit, not a current-main browser run. **NOT VERIFIED** means the runtime/device test has not been executed. Candidate commands/outcomes are in [A1a verification](PLAN_A_A1A_VERIFICATION.md), with hashes in the [baseline manifest](../qa/plan-a/baseline-source.json). No complete current-main browser, real-data or provider test is established by this document.

## Historical evidence is not current implementation

Read [original ranked risk register][old-risk], [Release 1 audit][old-review], its [required recovery design][old-protocol], [historical verification][old-verification], and [PR #10 blocker report][old-blocker]. Current main and PR #10 diverge from the common baseline `29aeb20225bccfc653b192651de608491185096c`; GitHub comparison reports 25 ahead / 124 behind. Main includes PR #12–#16, not the old complete repair stack. Do not cherry-pick that stack or claim its test totals here.

| Original risk rank | Current reconciliation / source | Plan A tasks and remaining gate |
| --- | --- | --- |
| 1: invoice/counter/audit quota consistency | SOURCE-CONFIRMED: [invoice writes][invoice] then [audit wrapper][audit-wrap]; no business journal | A4-03/04/08 and A5-01–07. A4 visible partial failure is not A5 exact rollback. |
| 2: incomplete/unsafe backup | PARTLY ADDRESSED: [V1 codec][v1] includes raw supported keys/checksum; [restore UI][import] remains empty-profile-only | A3 and A6. Physical copies, post-reload history fidelity and full validation/fault coverage not verified. |
| 3: permanent deletion/relationships | SOURCE-CONFIRMED: [deletion wrappers][deletes], [previous bills][old-bill], [Clear All][clear] | Inventory/guard in A4; destructive-action backup proof is a separately approved extension. No Recycle Bin is delivered by Plan A. |
| 4: startup rewrites | SOURCE-CONFIRMED: [V5][v5], [V13][v13], [V14][v14], [V15][v15] mutate | A1 entry conflict; A4 early bootstrap; A6 before/after reload gate. |
| 5: two tabs/double submissions | SOURCE-CONFIRMED: no Web Locks/revision/journal in main | A5 cooperative serialization/read gating; noncooperating old writer remains unsupported. |
| 6: imported text/print execution | SOURCE-CONFIRMED raw templates in [receipt rows][rows], [vendor rows][vendor], [PIN][pin] and print | Safe diagnostics DOM in A1; full imported-text/PIN/print acceptance before A4/A6 financial release. No universal XSS certification. |
| 7: remote sync/credentials | SOURCE-CONFIRMED [JSONBin][push], [Pull][pull], [Create Bin][bin], [GS merge][gs] | A2 needs three JSONBin guards, credential-preserving Settings Save and an Apps Script scope decision. No live diagnosis performed. |
| 8: legacy paid/discount/precision semantics | PARTLY ADDRESSED in PR #16 normal invoice/receipt paths, but [standalone][standalone], [edit][edit], [settlement][settle], [purchase][purpay], [payout][payout] still differ | Characterize before A4/A5. Preserve valid aggregates, distinct opening components and separate purchase discounts; no automatic repair. |
| 9: imported/reused numbering | SOURCE-CONFIRMED sequence uses saved prefix/counter; CSV/bulk routes write independently | A1 inventory and A4/A5 preflight. Keep numbering/FY rules; test imports, cancelled/deleted records, duplicate IDs/numbers and counter bounds. |
| 10: dates/printing/accessibility/capacity | SOURCE-CONFIRMED UTC date/month defaults and fixed A5 overflow; no current browser suite | Regression/risk gates in A6 and test matrix; native devices/performance remain unverified. No silent unrelated redesign. |

### Reconcile exact R1 findings instead of copying old diagnoses

| Finding | Current-main result | Required acceptance |
| --- | --- | --- |
| R1-01 old discount-only paid20→10 | The exact old `saveSettlement` failure is not the present implementation: current discount increments paid at [8830][settle]. Other routes recalculate paid from histories. | Test each real winning route separately; legacy opening paid must survive standalone/edit/delete. |
| R1-02 allocation precision | Current [settlement][settle] does not read entered receipt total; [Payment Out][payout] only tests positive total, stores uncapped raw allocations | Integer-paise or explicitly compatible precision contract; reject unsupported precision rather than silently round history. Same values must be validated, persisted, reported and audited. |
| R1-03 migration/history rewrite | [V13][v13] clamps paid above total without fixing receipt history; all four startup migrations write | Corrupt/denied and legitimate legacy fixtures; no writes or version advancement when blocked; compare restored bytes after reload. |
| R1-04 corrupt/denied reads | [DB/getters][db] returns null on errors and empty/default collections | Emergency bootstrap before all writers; missing versus denied/corrupt/wrong type; never create a replacement collection. |
| R1-05 transaction boundary | [Invoice][invoice] and [settings][settings] multi-key/multi-wrapper writes; no journal | Exact write-site failures and truthful partial/committed/pending outcomes; no premature success/print. |
| R1-06 unsafe legacy import | PR #12/#13 improve [V4/V1][v1] validation and empty-profile-only restore; JSONBin Pull still bypasses these | Preserve current import guard; do not reopen populated restore in Plan A. V4 rollback, denial/remove failures and full startup remain unverified. |
| R1-07 PIN bypasses | [Old-bill][old-bill], receipt/retail/clear paths bypass winning PIN route | Actual DOM buttons/direct calls, consistent identity-bound confirmation, failure visibility; separately approve any protective behavior change. |
| R1-08 stale destructive targets | [Receipt edit][edit]/deletes retain array indices; [PIN][pin] removes overlay before callback | Shifted indices/reassigned records/PIN change while confirmation is open must be refused unchanged. Test generated attributes, not only callbacks. |
| R1-09 historical business formats | Normal modal increments paid; [standalone][standalone]/edit/delete reset to summed history; separate supplier discounts are ignored | Missing/empty/matching/conflicting histories, openingPaid, separate discount histories and fractional totals; no blanket normalize/reject-all assumption. |
| R1-10 stored text | Raw interpolations remain in current [rows][rows], [vendor][vendor] and other templates | Safe DOM for diagnostics; benign execution-flag payloads across current actual views/print/PIN/import, network blocked. |
| R1-11/12/13 views and R1-14 cash reports | PR #14/#15 address specific pagination; this does not certify all sort/search/tab behavior. [Transactions][txn] mix accrual and receipts; cancelled-cash treatment differs. | Preserve narrow current pager checks; full report oracle and real controls. Backup fidelity is distinct from correct financial reporting. |
| R1-15/16 imports/dates/relationships | CSV remains incomplete/unsafe recovery advice; [today/month defaults][date] use UTC/device offsets | Characterize actual imports and numbering; no CSV-as-full-backup claim. Add timezone/report/relationship regression gates without silently expanding Plan A changes. |

## Confirmed specification corrections and missing criteria

1. **A1 launch boundary:** diagnostics appended after startup cannot satisfy A-READ-02. Split characterization from an isolated diagnostics entry or explicitly reviewed early bootstrap. Do not label ordinary source-mutating startup read-only.
2. **V14 and existing markers:** name V14 in A4 and A-MIGRATE-01. Gate `shop4_import_pending` as well as future/foreign journals before immediate scripts and `window.load`; the current DOMContentLoaded notice is insufficient.
3. **Third JSONBin operation:** A2 must disable `createNewBin` alongside Push/Pull, including underlying globals, absent status DOM and guidance outside Settings. A local field-removal change must not erase existing credentials on Save.
4. **Apps Script and CSV boundary:** GS Pull is a final live merge writer, not the earlier read-only stub. Decide whether it is retired; do not claim universal remote quarantine otherwise. CSV's daily-backup wording must not imply complete recovery.
5. **A4 versus A5:** wrapping writes/errors cannot recover the original invoice after a later counter write fails. A4 must display partial/recovery-required state; A5 owns exact staged rollback. Define per-PR/future acceptance so A1 is not forced to implement A5.
6. **Raw emergency evidence:** current V1 refuses corrupt JSON/IDs and pending import. Define a separate non-restorable raw package with readable-key/denied-key completeness, origin, UTC capture metadata and all recovery bytes. Never fabricate prior state or silently drop unreadable values. Its UI must work without app initialization.
7. **Backup validation levels:** V1 validates supported keys/basic shapes/IDs and checksum, not full accounting/relationships or a requirement that all six sections exist. A missing source collection is not fabricated. Preserve archive fidelity; independently classify whether it is usable for billing. Legacy formats must not gain stricter invented history rules without explicit compatibility review.
8. **V4 versus V1 comparison:** V4 reserializes parsed sections, so require semantic equality, not unknown original raw-string equality. V1 can preserve supported strings. Neither result before reload proves the startup will preserve those values.
9. **Backup snapshot coherence:** current before/after snapshot comparison detects many changes during digest, not all cross-key or transient old-writer changes. Add mid-collection and change-then-revert tests. Do not call the export atomic.
10. **Journal sizing and readers:** account for originals + before + after + JSON/key/metadata and memory overhead. `navigator.storage.estimate()` is origin-wide and cannot reserve localStorage. Readers/exporters must not treat partly applied keys as a committed snapshot.
11. **Journal namespace/portable backup:** explicitly choose excluded coordination keys and a committed-state export gate. Do not accidentally embed unfinished/foreign journals into a valid V1 or change its accepted key policy by reusing old unmerged code.
12. **Filesystem semantics:** preserve every existing generation on name collision, denied/cancelled picker, partial write/close failure, revoked permission and corrupt readback. Local readback is not disk flush, physical durability, Drive upload or independence proof. Prefer session-only directory permission; persistent handle storage would require another design/approval.
13. **Privacy and metadata:** no owner records/credentials in logs, screenshots, exception excerpts or artifacts. Profile ID cannot be verified by JS. Export age/copy status defaults unknown; metadata persistence would be a new write requiring scope approval. Test malicious text/key names and sensitive-error redaction.
14. **Financial prerequisites:** before adapter/journal release, characterize allocation budget/caps/precision, same-name party IDs, stale forms/modal replacements, receipt-index changes, supplier discounts, legacy aliases, cancellation and signed opening components. Positive opening is receivable and negative credit for all party roles; do not infer supplier inversion/netting or consume credits.
15. **Print confirmation/identity:** `printFromList` queues printing after a missing view lookup can leave previous ID/DOM intact. Require requested identity/content/revision match, no success/print before required audit completion, and full long-content PDF/layout checks. Physical output remains owner-only.
16. **Destructive guards are underspecified:** Clear All removes six keys but leaves audit/preferences/version/unknown keys; Clear Audit is separate. A browser-local verified flag is not independent-backup possession. Do not broaden deletion or call a real deletion test. Define actual routes and owner-approved proof requirements separately.
17. **CI:** trigger new diagnostics/files/fixtures; explicitly checkout PR head, record source/runner hashes, retain failed results, separate future gates from current blockers, pin browser tooling after approval, and add real three-engine runs. Current default checkout may test a merge ref rather than the actual head.
18. **Strict gate tension:** A-TAB-02 says noncooperating race stays failed while A-CI-01 says all new tests pass. Keep the failure and distinguish supported-scope checks from strict release readiness. Owner risk acceptance must be explicit; never silently turn it into an expected pass.

## Source and writer inventory

The reviewed exact winning-chain and complete mutation-site tables are maintained in [PLAN_A_SOURCE_INVENTORY.md](PLAN_A_SOURCE_INVENTORY.md#winning-and-replaced-chains). That document preserves all reviewed sites, adds source links and predecessor/closure classifications, and binds them to the immutable `index.html` hash above. This avoids copying the same inventory into two risk documents. All classifications are static findings; browser route coverage and write-failure behavior remain unverified.

## Evidence-backed decision

The Plan A direction is appropriate for limited local stabilization and independent private backups, with the corrections above. **Only the narrowed A1a characterization scope is approved and in progress.** A2 removes existing capabilities and needs consent; A3 adds evidence-backed manual/file generations; A4/A5 implementation/release are not approved or verified. A6 real-device/private-file drill remains owner-only. A checksum or six green VM scripts cannot certify safe daily billing, complete runtime restore, off-device durability or old-writer isolation.

[old-risk]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/d07729e60e6901fa1255a8331dde805c22890e9c/docs/RISK_REGISTER.md
[old-review]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/d07729e60e6901fa1255a8331dde805c22890e9c/docs/RELEASE1_CODE_REVIEW.md
[old-protocol]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/d07729e60e6901fa1255a8331dde805c22890e9c/docs/RELEASE1_CODE_REVIEW.md#L154
[old-verification]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/d07729e60e6901fa1255a8331dde805c22890e9c/docs/VERIFICATION.md
[old-blocker]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/9191b2ea5c7570f2bc3ec245dca2c48fb19aebba/docs/BLOCKER_REPAIR_VERIFICATION.md#L102
[db]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L902
[invoice]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L1242
[audit-wrap]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8619
[audit]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8497
[settings]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2170
[v1]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L690
[v4]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L815
[import]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2218
[v5]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2289
[v13]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L7436
[v14]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L7501
[v15]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9328
[deletes]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8568
[old-bill]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3173
[clear]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2237
[rows]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L4239
[vendor]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9720
[pin]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8523
[push]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2668
[pull]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2689
[bin]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2716
[gs]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9204
[standalone]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L3607
[edit]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L4133
[settle]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8797
[purpay]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L8069
[payout]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9787
[txn]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L9029
[date]: https://github.com/nileshkchaubey-glitch/Xl-billing/blob/3855c6ab21de64fdc9e28116fcd0f770304eef66/index.html#L2258
