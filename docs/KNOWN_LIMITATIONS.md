# Known limitations

The [full Release 1 review](RELEASE1_CODE_REVIEW.md) confirms blocking data-safety
defects and regressions. P0-6/7/8 development is stopped; no Release 2 branch or PR
has been created. This decision supersedes any interpretation of the earlier
passing regression tests as a foundation approval.

This is a draft hotfix checkpoint, not a finalized production billing app.

- Release 2 (P0-6/7/8 and P1 data-safety work), Release 3 and Release 4 are not implemented.
- The original hard-delete behavior remains. The repaired PIN now allows it to execute; keep a backup before deleting. Recycle Bin/soft delete is not provided yet.
- localStorage quota failures, multi-key invoice/counter/audit atomicity, complete checksummed backup/restore, automatic backup and stale-tab protection remain unresolved.
- Automatic baseline migrations are not snapshotted/verified; historical compatibility is not proven.
- Duplicate repair preview and import-wide uniqueness are incomplete. Two batches and typed old-bill numbers are tested; backup/CSV merge and quota failures are not covered.
- The 1,200-invoice sales reachability test and seven-list controls pass. The 4,200/5,000/20,000 performance budgets and exhaustive sorting/filter combinations are not proven. Some secondary supplier/transaction sort controls still need explicit field mapping tests.
- Payment tests cover regular, supplier, standalone, settlement rejection and payment editing. Purchase creation, Payment Out positive/negative allocation paths and all legacy payment shapes need further tests. No full randomized UI operation/soak suite exists.
- Quotes in party names now select/settle through real clicks. Other HTML templates and printing still need the complete XSS/secret-egress audit.
- Lint has zero no-undef errors but legacy unused/redeclared warnings remain. HTML validation still fails on legacy markup. Accessibility, PDF, real printers, Windows/Android/iOS hardware and cross-device restore are not verified.
- UTC date helpers, float-noise records, missing inventory/GST/FY features and the legacy popup-based printing remain.
- Daily bills, row moves, custom fields, every setting and optional JSONBin/Google Sheets journeys do not yet have complete characterization coverage.
- No finalized release tags are created while these prerequisites are incomplete; the baseline tag is retained.
