# Remaining risks

| Risk | Practical limit or mitigation |
| --- | --- |
| Browser eviction, site clearing, device loss or physical power failure | Keep independent files and earlier copies; localStorage readback is not physical durability |
| Extra quota needed for checked before/after journal | Do not delete records to make space; failed rollback retains the journal and requires recovery |
| Older app copies bypass Web Locks | Close older copies; drift checks detect many but cannot prevent every uncoordinated write |
| Conflicting historical payment records | Preserve and archive exact bytes; refuse unsupported payment/restore assumptions |
| Native folder support and revoked permission | Explicit opt-in/reconnect, visible failure and manual/reminder fallback; no backups while closed |
| Private backups contain credentials and PIN hashes | Keep backup files private; portable format deliberately preserves complete recovery data |
| Permanent deletion and deferred report/view defects | Backup before deletion; Recycle Bin and R1-11 through R1-14 are separate work |
| Optional live synchronization, hardware, printing and broad performance | Not exhaustively verified; no live account or business data was used |

Completed risks and test evidence are in FOUNDATION_REPORT.md and STABILIZATION_REPORT.md. The original audit remains a historical source review.
