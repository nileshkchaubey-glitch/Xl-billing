# Verification and release checklist

## Automated checks

`node scripts/check.js` parses all application, backend and test JavaScript, checks relative module links, rejects inline HTML handlers/styles and checks named `data-action` handlers. `node --test tests/*.test.js` exercises the billing domain, legacy migration, safe renderers, CSV handling, REST/session behavior, mocked concurrent devices and the authenticated Google handler.

The tests cover rounding, old paid amounts, photos/audit backup preservation, invalid dates/IDs, last-price order and variants, cancellation, invoice uniqueness, atomic imports, FIFO/payment-out/discounts, reversal, overpayment prevention, stale edits/settings, first-connect data preservation, uncertain-response retries, forbidden keys, Google owner/origin enforcement and literal spreadsheet cells.

GitHub Actions also provisions a **disposable PostgreSQL 16** service and runs `scripts/test-database.js` to exercise the actual schema, RLS, permissions, commit RPC, stale revisions and retry deduplication. The local review environment had no PostgreSQL server/client, so this database suite must pass in CI before merging. The script must never run against a live database; it creates fixture roles and a mock Auth schema. It does not emulate Supabase Auth itself.

The hosted browser could not reach the local development server during review, so desktop/mobile browser interaction, IndexedDB behavior, print preview and live cloud/Google service calls require the release checks below. Source and renderer tests do not establish that those browser paths were visually tested.

## Before daily use

- Keep a full backup from the old app. Restore a copy into a test workspace; compare invoice/purchase/party/item counts, paid amounts, balances, opening balances, photos and custom fields.
- At desktop and phone widths (including 360 px), open each main screen. Confirm nav, date/status filters, pagination, dialogs and save actions remain usable. Check no horizontal page overflow.
- Select customer + item and verify last-price hints update when switching customers/brands/units. Save, edit, cancel and restore a test invoice; print both A4 and an 80 mm layout using your actual printer settings.
- Record payments in/out and discounts across multiple bills. Reverse one payment and verify ledger balances. Check opening-balance payments separately.
- On PC and phone, create different bills at the same time. Both must appear with unique numbers. Attempt a stale edit after the other device records a payment; it must require reopening the bill.
- Interrupt the connection while saving. Restore connectivity and retry the pending operation; there must be exactly one bill. Offline drafts should survive reload; cloud bills should not claim a successful offline save.
- Export/restore JSON; confirm photos and audit remain. Import a malformed CSV/JSON and confirm no partial replacement occurs.
- If Google is configured, export to Drive and restore that JSON in a test workspace. Refresh Sheets, remove a test record from the projection and export again to ensure stale rows disappear. Confirm another Auth account cannot use the owner's Google connection.

Only promote the reviewed branch after CI and these device/service checks. The original source and `shop4_*` recovery keys allow rollback; switching code versions does not merge two divergent datasets, so retain the final cloud backup when rolling back.
