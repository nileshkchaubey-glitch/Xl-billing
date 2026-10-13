# Step 2 — Complete Verified Private Backup

## What this step changes

The existing **Export Backup** action now produces a versioned `xl-billing-private` JSON containing an **exact raw snapshot** of all present `shop4_*` keys (including audit, settings, receipts, recovery metadata if present, and unknown future app keys) plus `v8_slcols` and `v8_compact`. It uses SHA-256 to detect accidental/tampered file changes. Existing `v4` exports from 12 October remain accepted by Import Backup in a blank isolated browser profile.

- The SHA-256 signature validates **included bytes only**. It cannot prove that records deleted before export were recovered, or that the browser actually saved the download to disk.
- Every billing record and stored settings value, including **private JSONBin credentials / Delete PIN data**, may be included. Store the JSON file **privately**, outside GitHub or any shared folder.
- This backup is **not compatible with the original pre-PR #12 V4 import button**. To restore it, use the updated app's Import Backup function. Do not assume old versions can read it.
- The app requires browser SHA-256 support to export or restore the verified format; use current desktop Chrome/Edge under a supported local file or secure origin.
- The app is offline-first. No remote upload, cloud sync, paid backend, or runtime dependency is added.
- Export checks that application storage did not change during digest; this is **not an atomic snapshot** against malicious/uncooperative older tabs.

## Restore protocol

1. **Never import into your live/working profile.** Download and keep an independent backup of the live version first. Finish and close all competing billing tabs.
2. Open this **new standalone HTML in an isolated origin and brand-new browser profile**. Do not try to create an isolated test site under a different path of `nileshkchaubey-glitch.github.io`; both paths share localStorage.
3. In the empty profile click **Import Backup** and select the verified JSON (or legacy V4 JSON); read the counts, confirm, and allow reload.
4. Check original vs restored invoice counts, invoice numbers, receipts, outstanding, parties, items, purchases and settings. Export the restored data again and retain the backup.
5. Do **not** make this profile your real billing writer until invoice/payment concurrency risks, device printing and owner-run reconciliation are reviewed.

The restore writes records only to a blank profile, verifies readback and rolls back on ordinary synchronous failures. Browser tab crashes, power failures, quota exhaustion and an uncooperative old writer cannot be guaranteed atomic by `localStorage`. If `shop4_import_pending` is present, the existing safety screen blocks further entry to prevent silent partial-record use. Do not delete it or clear localStorage blindly. Preserve the profile for recovery.

**Do not merge any unrelated Draft PR.** PR #1-#11 remain closed, and the separate `billing-2` testing repository must not change.

## Technical verification

`node qa/verify-complete-backup.cjs` checks complete raw-key coverage, byte-identical roundtrip, checksum corruption, unknown-key preservation, audit history, quota rollback, unfinished imports, older V4 import compatibility and snapshot-race detection using synthetic data. `node qa/verify-backup-import.cjs` preserves the Step 1 independent import safety checks. Both run in GitHub Actions under `.github/workflows/verified-private-backup.yml`.

**Not verified:** actual owner backup restore, physical printer output, cross-tab multiwriter safety, real-device data retention, historical financial conflicts or complete live production reconciliation. Owner authorization is required for merge and eventual cutover.
