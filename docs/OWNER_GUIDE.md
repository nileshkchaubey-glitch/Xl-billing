# Owner guide — hotfix test copy

The live app has not been changed. Stabilization and the storage/backup foundation are implemented on draft branches.
Rehearse using a separate synthetic browser profile before considering an upgrade.

The recovery/date follow-up is in Draft PR [#8](https://github.com/nileshkchaubey-glitch/Xl-billing/pull/8), based on PR #7. See [its verification report](RECOVERY_FOLLOWUP_REPORT.md) before considering this draft for an upgrade.

## Enter a bill

Open New Invoice. Select the party, add the items, and check the date and total.
For a parcel, enter quantity per parcel and the number of packs. Existing bills
keep their saved final quantity. Save once, then check the invoice on Sale List.

![New invoice on a phone](../test-results/screenshots/new-sale-390.png)

## Find bills and receive money

Use Sale List search and date filters. Rows chooses 20, 50 or 100 records per page.
Next/Prev reaches the rest. Click a column to sort. The summary covers the entire
filtered list. Receive only what is outstanding; an excess payment is rejected.

![Sale list](../test-results/screenshots/sales-list-1366.png)

## Delete PIN

The first delete asks you to set a new PIN. This step does not delete the record.
Choose Delete again, enter your PIN, and confirm with Enter or Delete. Escape or
Cancel closes the dialog. Change the PIN in Settings; supply the current PIN.
**Deletion is still permanent in this draft. Take a backup first.**

## End-of-day routine

Use Export Backup and keep the complete private file outside the browser. It includes
audit, preferences, settings and optional service credentials. Keep earlier copies.
Settings → Independent backups can select a folder for free automatic backups in
compatible browsers. The app must stay open; permission or disk failures show a
reminder. On mobile/unsupported browsers, use manual downloads and confirm the file
was saved. Do not clear browser/site data.

Restore opens a preview. Replacement requires the existing Delete PIN, and a
pre-restore backup download is requested before changes. PIN setup does not restore
automatically; reopen the backup afterward. Unsupported histories are left intact
for review. Reload after a verified restore. New devices need a separate folder
selection; changing the file path or web address does not transfer browser data.

Existing keyboard shortcuts remain. Escape closes the new PIN dialog and Enter
confirms. A complete keyboard-first shortcut redesign is not included yet.

## When the application is locked or cannot initialize

Keep the browser profile and close older copies of the app. Do not clear site
data or keep pressing Save. The **Private recovery** panel works even when
normal navigation and Import Backup are unavailable.

1. Choose **Download private raw recovery**. Save and retain the private file
   outside the browser profile. It includes settings and credentials.
2. Under **Verify the raw recovery file you saved**, select that same saved file.
   Verification must succeed before any reviewed changes are possible.
3. Choose **Review adoption of the current external records** to keep the exact
   current records, or select a private/compatible legacy backup to replace them.
   Review the preview and checksum status. Invalid or conflicting candidates
   are refused. An unavailable earlier snapshot is never reconstructed; change
   counts require two valid actual states.
4. Enter the **current profile Delete PIN**, select the separate owner approval
   checkbox, then choose **Apply this reviewed recovery**. A backup's PIN cannot
   authorize replacement. Missing, default-only or unreadable current credentials
   prevent locked changes; retain the raw file for separate review.
5. After **Recovery verified**, choose **Reload application** and inspect the
   records before entering another bill. Keep the original raw file and older
   backups even after successful recovery.

If a message says recovery is pending or commit cleanup is uncertain, preserve
the profile and available raw export, then reload and inspect. A pending message
does not prove that a journal still exists or that rollback succeeded. Saved-file
verification and backup selection support files up to 20 MiB. Unsupported browser
locking leaves export available and refuses mutation. Re-selecting a file proves
matching file contents; it cannot prove physical disk durability.

Business dates use Asia/Kolkata, including on a phone configured to a different
timezone. Audit and creation timestamps remain UTC. Check the device clock; the
app does not obtain time from a server.
