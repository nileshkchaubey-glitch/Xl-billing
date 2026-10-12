# Storage, backup and stabilization verification

Draft PR #6 contains Phase A on `codex/xl-release-1-stabilization`, based on PR #5 at d07729e. The separate `codex/xl-release-2-foundation` branch is based on that reviewed stabilization head (0e4d916). No PR was merged, main changed or deployment performed. All records, browser profiles, faults, folders and remote responses used in verification are synthetic.

## Completed

Phase A fixes R1-01/02/03/04/07/08/09/10 preserve historical opening paid amounts and supplier discounts, enforce paise precision, remove startup rewriting, block unreadable storage, guard destructive routes against PIN/stale-selection bypasses and escape stored text. Full details and original failures are in STABILIZATION_REPORT.md and the unchanged RELEASE1_CODE_REVIEW.md.

P0-6 groups invoice/counter/audit and other workflow writes in a checked recoverable journal, recovers before application reads, restores exact originals on failure when possible, retains recovery material and blocks writes when rollback cannot complete, and rejects stale/overlapping cooperating clients. This is not a claim of multi-key localStorage atomicity or physical disk durability.

P0-7 preserves exact private backup bytes, audit, settings, unknown compatible keys, preferences and credentials. It verifies SHA-256, validates legacy v4/v5 formats (including the existing cloud `ts` header), previews restore, checks the current PIN before replacement and requests a pre-restore backup download. Unsupported historical conflicts are archived unchanged but cannot be restored through unsupported assumptions. Raw recovery exports preserve malformed bytes/journals separately.

P0-8 started only after checkpoint b817937 passed P0-6/P0-7. It offers free opt-in folder backups with write/close/readback verification, unique retained filenames, permission-loss/manual fallback and reminders. Manual download requests are distinct from verified folder persistence. It cannot run while the app is closed.

## Local test evidence

- P0-6/P0-7 checkpoint: 22 foundation Node tests, 11 regression Node tests, parcel VM check, 237 functional browser cases, plus all 11 storage/restore audit probes in each engine.
- After automatic backup and conflict-archive changes: full functional run passed 261 cases in Chromium, Firefox and WebKit; there were no no-op screenshot cases in this count.
- Final cloud compatibility suite: 33 backup browser cases passed across all three engines, including the added v5 cloud preview/PIN case; seven backup codec cases passed with nonzero positive/negative party opening balances. Final Node suite totals 44 passes, including 17 storage, seven backup, nine automatic-backup and 11 regression cases. Parcel VM checks passed.
- Automatic-backup UI cases: 21 passed; malformed remembered timestamps failed before correction in both Node and Chromium. Write/close/readback and revoked-permission probes never mark a failed backup verified.
- Stabilization audit remains 12/12 per engine; foundation audit remains 11/11 per engine. Source-bound final JSON evidence accompanies this report.
- Lint: zero errors, 143 existing warnings. Build is a byte-identical standalone HTML copy. HTML markup diagnostics, physical crash durability, real printers and every native mobile folder chooser are not passed claims.

The committed-source full functional run passed 264 cases on 495f17f. A subsequent failing boundary probe identified a writer/recovery size mismatch; bcb9f8e rejects oversized operations before staging, and all 44 Node cases pass. The final source-bound audit gates on bcb9f8e pass 69 probes. SHA-256 of the final HTML and identical build: `acf710663fa22807a215f3a5cc334bbc566313de68d4a090a4de7d546957f88b`. GitHub CI on bcb9f8e passed all three jobs: stabilization, storage/backup acceptance, and full regression/lint/build. Historical logs are not fresh verification.

CI for the preceding runtime passed: https://github.com/nileshkchaubey-glitch/Xl-billing/actions/runs/38233239050

Passing CI for the final runtime including the boundary test: https://github.com/nileshkchaubey-glitch/Xl-billing/actions/runs/38233759587

## Remaining risks and separate status

Older app versions can ignore locks; close old copies. Browser eviction, cleared site data, lost devices and physical power failure require independent backups. Journal quota overhead can prevent immediate rollback; retained recovery material must not be discarded. Private backups contain credentials. Native folder support varies, especially on mobile; manual downloads must be checked by the owner. Exact before/after readback is not proof of physical durability.

WORK_COMPLETED.md, WORK_BLOCKED.md and WORK_UNIMPLEMENTED.md separate delivered features, operations blocked on unsupported records/capabilities, and deferred work. R1-11 through R1-14 view/report issues, Recycle Bin, comprehensive live sync, performance/accessibility budgets and hardware testing remain outside completed work. STORAGE_AND_BACKUP_DESIGN.md defines exact contracts and limitations.

## Review links

- Stabilization Draft PR: https://github.com/nileshkchaubey-glitch/Xl-billing/pull/6
- Foundation branch: https://github.com/nileshkchaubey-glitch/Xl-billing/tree/codex/xl-release-2-foundation
- Foundation Draft PR: https://github.com/nileshkchaubey-glitch/Xl-billing/pull/7 (base: stabilization branch).
