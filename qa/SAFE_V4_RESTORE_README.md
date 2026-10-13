# Release Step 1 — Prevent destructive backup import

**Scope:** This PR changes only the legacy V4 backup import safety path in the original single-file HTML. It does not change invoice entry, sales calculations, existing records, or the deployed website until the owner explicitly merges it. No mandatory backend, new dependencies, credentials or cloud services.

## Before / after

Before: Import accepted arbitrary partially populated JSON, wrote up to six billing collections sequentially over a live browser profile and displayed success even if the file omitted essential collections. Quota errors could leave a half-restored profile.

After: A version-4 backup must contain valid settings, items, parties, invoices, purchases and retail collections (optional audit collection is preserved if present), with unique record IDs and numeric bill/payment values. Import refuses any populated `shop4_*` storage profile (except the harmless version marker created at startup). The owner sees row counts and must confirm restoring into an **empty, isolated browser profile**. Writes are read back; synchronous failures attempt to remove the newly written keys. A persistent import marker warns and disables UI after an unexpected interruption; do not clear this marker manually without verified recovery.

A normal original V4 export **does not contain the audit collection or cryptographic checksum**. This PR does not invent a missing audit trail and does not claim that a file can be proven complete. It does not implement a merge, restore over existing data, safe legacy/new multi-tab concurrency, automatic off-device backups or physical power-loss durability.

## Verification

- `node qa/verify-backup-import.cjs` exercises synthetic legacy V4 data, missing fields, malformed JSON, invalid IDs/payments, existing-profile refusal, readback, injected storage quota failure/rollback, and interrupted marker.
- GitHub Actions `legacy-backup-import.yml` runs the built-in Node tests without paid services or extra npm dependencies.
- Real customer backups are **not committed**, included in CI, copied into Actions artifacts, or sent to any new remote service.
- Owner acceptance, when ready: export the current live profile as a separate backup and keep it; use a new empty Chrome profile and non-shared origin for a restore trial; confirm invoice count, invoice numbers, parties, items and balance with the file and re-export. Never test by importing into the live profile.

## Release blocker / dependency

This PR is **not** approval to move business billing data or to merge the old stacked PRs. The older noncooperating writer race remains unresolved; a different GitHub Pages path under the same host is not isolated from live `localStorage`. No existing data was modified by making this PR.

**User approval required before merge.** Once merged and safely accepted, Step 2 can address complete verified backup/export and recoverable restore; Step 3 payments, then accounting and print corrections.
