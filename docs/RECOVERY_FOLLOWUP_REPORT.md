# PR #7 recovery and business-date follow-up

Branch: `codex/xl-recovery-date-followup`, based on Draft PR [#7](https://github.com/nileshkchaubey-glitch/Xl-billing/pull/7), commit `aa9b03c5ff1968445a1a92197302796a26a3e824`. Follow-up: Draft PR [#8](https://github.com/nileshkchaubey-glitch/Xl-billing/pull/8). This is a separate draft for review. Main, PR #7, hosting and real business data have not been modified; no PR has been merged.

## Completed implementation

- Independent recovery controls mount before application initialization. Raw export, saved-file verification, candidate preview, current-PIN verification and explicit owner confirmation work when normal navigation, invoice and import scripts never initialize.
- Adoption preserves exact external business bytes and requires a valid, unambiguous schema/accounting state with no unresolved journal. Restore supports existing private and legacy backup formats, including legitimate historical opening receipts and supplier discounts. Invalid candidates remain unchanged.
- A checksummed owner-reviewed recovery journal retains exact records, metadata and any earlier journal. Interrupted recovery rolls back or completes only from checked before/after evidence. Foreign or contradictory bytes block mutation. Successful recovery requires reload before normal operations resume.
- Preview distinguishes a captured current state from an unavailable historical snapshot. Changed counts appear only when both actual compared states validate; metadata is never treated as an earlier record snapshot.
- Invoice Save distinguishes staging failure, verified rollback, recovery pending and a verified commit requiring reload after uncertain cleanup. Failed operations do not show success, consume invoice numbers or claim an unverified rollback.
- Business dates, month ranges, aging and date-derived financial years use Asia/Kolkata regardless of device timezone. UTC audit/createdAt timestamps, configured financial-year series, invoice numbering and existing Delete PIN behavior are preserved.

Implementation and assertion mapping: [RECOVERY_FOLLOWUP_ACCEPTANCE.md](RECOVERY_FOLLOWUP_ACCEPTANCE.md). Date-specific evidence: [ASIA_KOLKATA_DATE_REPORT.md](ASIA_KOLKATA_DATE_REPORT.md).

## Before and after evidence

The immutable PR #7 baseline HTML SHA-256 is `acf710663fa22807a215f3a5cc334bbc566313de68d4a090a4de7d546957f88b`. [RECOVERY_FOLLOWUP_BEFORE.json](../test/review/RECOVERY_FOLLOWUP_BEFORE.json) records **31 failing and 6 passing recovery browser cases**. Separate core tests initially failed because independent recovery APIs were absent; additional tests isolated malformed collections, invalid dates/numbers, cleanup uncertainty and interrupted reviewed restores. Five date browser probes and four calendar-helper Node tests also failed before implementation. A missing recovery UI can mask later validation failures, so the baseline browser results alone do not establish every downstream defect.

Final review added two more browser probes: invoice Save and locked restore cleanup-read denial. Both failed at source hash `93c4a03a3bde5e9f44578a2d9f2d44555dc3abe912c41e2d9bcee9d04b943c3e` because UI messages claimed a removed journal existed. Neutral wording fixed both; six corrective cases passed across all three engines. This is separate from the immutable PR #7 baseline evidence.

The final runtime is commit `d8cf420`; HTML SHA-256 is `37cb3c09b5d165768666d3ccefae9478b10f08a7dc20f1dcc219cad91e596933`.

| Check | Evidence/status |
| --- | --- |
| Node and parcel VM | 63 Node tests passed, including all original 44, four calendar tests and 15 recovery tests; parcel VM passed. |
| Full local functional run before final alert fix | 432 passed, 3 failed. All three failures were the same existing overpayment test: a hidden empty recovery alert conflicted with its strict alert locator. |
| Corrective alert check at `61177f7` | The three unchanged overpayment assertions passed in Chromium, Firefox and WebKit after the inactive output became a status region. Actual recovery errors still use an alert. Six additional cleanup-message cases passed at the final runtime. |
| New browser acceptance in the full local run | All 111 recovery and 60 date cases passed across Chromium, Firefox and WebKit. |
| Final full local functional run | **441 passed**, zero failures/skips/flaky results: 147 per engine, including 264 existing, 117 recovery and 60 date cases. The same invocation passed all 63 Node tests and parcel VM checks. |
| Existing visual evidence case | Complementary final-source run: 1 Chromium capture passed, 2 other-engine captures skipped by existing design. This covers all 444 browser suite entries with 442 passes and 2 intentional screenshot skips; no functional case was skipped. |
| CI | [Run 38256578493](https://github.com/nileshkchaubey-glitch/Xl-billing/actions/runs/38256578493), head `03069fadf81ff18a198ca81f72f1fd38efefc8d8`: stabilization and foundation jobs passed. Full CI is still installing browser dependencies; its full test gate is pending and is not claimed passed. |
| Separate safety audits | 69 passed at the final HTML hash: 36 stabilization and 33 foundation cases across Chromium, Firefox and WebKit; no failures or harness errors. |
| Lint/build | Zero lint errors, 143 existing warnings; self-contained build is byte-identical to the runtime HTML. |

[RECOVERY_FOLLOWUP_FINAL.json](../test/review/RECOVERY_FOLLOWUP_FINAL.json) retains source hashes, actual before failures, corrective results, the final full functional run, complementary screenshot run and all 69 separate audit results. Both final browser commands used the same final runtime and unchanged tests; the final pass is not inferred from earlier runtime versions. The screenshot case captures evidence rather than adding a functional assertion. Generated screenshot/log bundles were not added to this follow-up. CI status is reported separately and remains unverified for its full test job.

## Remaining limitations and blocked operations

localStorage provides no atomic transaction across keys. The protocol coordinates participating tabs and retains verified recovery evidence; it cannot guarantee physical durability, survive eviction/device loss or constrain older application copies that ignore locks. Close older copies. Without usable Web Locks, raw export remains available, while recovery verification and mutation fail closed.

Re-selecting an exported file proves possession of matching captured bytes, not durable storage on independent hardware. Keep the private file outside the browser profile; it contains settings and credentials. Saved-file verification and backup selection currently support files up to 20 MiB. Oversized or unreadable inputs are refused without changing stored bytes.

Locked mutation requires readable, nondefault current PIN credentials. Missing, corrupt or default-only credentials cannot be replaced by a backup's PIN. Those profiles can retain raw export for separate review. A local PIN is not protection against an adversary who can replace the entire browser profile and credential records.

Invalid or ambiguous candidate histories, stale previews/proofs, unresolved adoption journals and foreign transaction bytes remain blocked. A valid backup may replace corrupt current records only after raw export verification, candidate validation, preview, the current PIN and explicit owner confirmation. Original captured bytes remain in the owner's export.

Asia/Kolkata is explicit and fixed; device clock accuracy is outside the app's control. Native mobile folder pickers, physical printers and physical power-loss testing remain unverified. Deferred view/report defects and other unimplemented releases remain listed separately in [WORK_UNIMPLEMENTED.md](WORK_UNIMPLEMENTED.md).

All verification uses isolated synthetic profiles and test-generated files. No mandatory backend, paid service, merge or deployment was introduced.
