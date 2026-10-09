# Verification and release checks

## Automated verification

`node scripts/check.js` parses source JavaScript, checks relative module links, rejects inline HTML handlers/styles and checks named delegated actions. It excludes generated build output so old artifacts cannot masquerade as live source. The Worker artifact is separately parsed and exercised after building.

`node --test tests/*.test.js` covers money rounding, legacy paid amounts, photos and audit preservation, invalid dates/IDs, last-party prices and variants, cancellations, invoice uniqueness, atomic imports, FIFO/discounts/payment-out, reversals, overpayment prevention, stale edits/settings, first-connect preservation and uncertain-response retries. Rendering and exports cover HTML escaping, CSV formulas and literal spreadsheet cells.

Backend tests run the actual migration SQL against Node 24's built-in SQLite engine, with D1/R2 adapters. They exercise owner isolation, server-side financial validation, competing writes, complete transaction rollback, operation deduplication, large master imports and private photo roundtrips. API tests exercise authenticated owner access, rejection of host identity headers, trusted cross-origin preflight/reads, body validation and Google-owner enforcement. Login tests cover password non-persistence, rejected business access and concurrent token refresh. Verification also rejects disabled/revoked credentials and unavailable authentication services. They establish database logic, not a full emulation of Cloudflare or Firebase authentication.

`node scripts/build-worker.js`, `node scripts/validate-artifact.mjs` and `node scripts/smoke-worker.mjs` verify the generated ESM Worker, frontend asset responses and an HTTP-level billing roundtrip against the SQLite adapter. GitHub Actions runs these same checks on Node 24 without dependency installations.

Firebase and Google service responses are mocked in tests. Live email/password login, token refresh/reset, Drive and Sheets exports have not been exercised. This independent-auth revision has not been deployed. Desktop/mobile interaction, browser IndexedDB, print preview and real simultaneous-device use have not been visually verified. Source, SQLite and Worker tests do not establish those device paths.

## Before daily use

- Keep the old app's full backup and browser recovery keys. Restore a copy, then compare invoice/purchase/party/item counts, totals, opening and remaining balances, photos and custom fields.
- At desktop and phone widths, including 360 px, open each main screen. Check navigation, pagination, date/status filters, dialogs and save actions, with no horizontal page overflow.
- Switch customers, brands and units in an invoice; verify last-price hints. Save/edit/cancel/restore a test bill. Check A4 and 80 mm print previews using the actual printer settings.
- Record receipts, payment-out, discounts and opening-balance payments. Reverse a payment and compare ledger balances.
- On PC and phone, create different bills simultaneously. Confirm both appear with unique numbers. Reopen a stale bill after a payment on the other device; stale edits must be rejected.
- Disconnect while saving, reconnect and retry in Data & sync. Confirm exactly one bill. Check draft survival after reload and that offline cloud posting never claims success.
- Export and restore JSON with photos/audit intact. A malformed import must reject the entire operation.
- When Google is authorized, verify a full Drive backup and Sheets refresh, including stale row clearing and owner enforcement.

The GitHub branch remains a draft for review. Keep the final cloud backup when switching code versions: rolling back source does not merge divergent data.
