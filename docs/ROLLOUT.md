# Preserve the active billing app during review

The owner has started entering bills at `https://nileshkchaubey-glitch.github.io/Xl-billing/`. That app currently uses `main`. PR #3 is a draft and must not be merged or used to replace production until the owner has reviewed the revised UI and the migration checks below pass.

## While continuing current entries

- Use the current sidebar's **Export Backup** action regularly. It downloads `myshop-backup-YYYY-MM-DD.json`. Keep copies outside the browser.
- Keep using the same browser/device for those entries until cloud sync is activated. A repository backup preserves code, not browser billing entries.
- Preserve the current browser storage and original `shop4_*` keys. No live records have been read, changed, cleared or migrated in this refactor.

The current app's export includes settings, items, parties, invoices, purchases and retail entries. Its exporter does not include the separate activity-log key. Keep the browser recovery copy as well as the JSON file; do not claim the old export contains every legacy storage key.

## Review and test separately

1. Open `docs/ui-preview.html` to review the invoice layout, sample sale/purchase lists and login form. This is clearly labelled sample-only: no real records, browser cache or cloud API are used. Its generated UI reuses production renderers/styles. It is not a live login or sync test.
2. Configure the API and owner login in your own Cloudflare/Firebase accounts using `BACKEND_SETUP.md`. Keep a separate staging database/bucket and review frontend while validating. Do not test fixture writes against a production database.
3. Restore a copy of the latest old-app JSON backup in that staging workspace. Compare parties/items, invoices, purchases, retail, dates, amounts, payment balances, packing/brand fields, custom fields and photos. Check any rejected duplicate/invalid records before proceeding.
4. Run the actual desktop/mobile, two-device and printer checks in `VERIFICATION.md`. Review the UI with the owner before merging.

## Controlled cutover

Agree a short cutover window, take a final backup after the last old-app entry, and compare its record counts. Restore that final copy into the approved production workspace; changes entered after an earlier test backup must be included. Do not run both old and new apps as simultaneous independent sources of billing truth.

Only then merge/deploy the reviewed frontend to the existing GitHub Pages path, with the tested API URL and public authentication configuration. On the original browser, the new app can copy the legacy keys to its separate cache without deleting them. If cloud already contains the restored data, preserve the local copy and explicitly choose **Use cloud data** after downloading its backup. On the phone, sign in with the same billing email/password and verify the cloud record counts.

Rolling back code does not copy new cloud bills into old browser keys. Keep a final cloud JSON backup when switching versions and reconcile any later entries deliberately. Browser caching and local recovery are not substitutes for an external backup.
