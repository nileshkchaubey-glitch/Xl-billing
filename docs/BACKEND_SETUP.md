# Cloud backend and migration

## Hosting and storage

The application is a dependency-free Worker ESM service deployed to an owner-private Sites project. `.openai/hosting.json` identifies that project and requests the `DB` D1 binding and `BUCKET` private R2 binding. Reuse the existing project ID for updates. Changing the ID requires deliberately provisioning another site; copying this manifest is not a new-site setup process.

Run the checks in the README, build with `node scripts/build-worker.js`, and validate the artifact. The generated `dist/server/index.js` contains the Worker and embedded static assets; frontend source remains modular. The build also copies `drizzle/` to `dist/.openai/drizzle/`. Publish through the Sites source/package workflow so the exact pushed source commit and its archive match.

Migrations run during deployment. Requests never create tables. `0000_billing.sql` creates:

| Table | Stored data |
| --- | --- |
| `billing_workspaces` | Owner ID, settings and extra metadata, current revision, last operation |
| `billing_records` | Collection, stable record ID, order, JSON fields, private photo reference |
| `billing_operations` | Owner-scoped operation IDs and successful revisions for retry deduplication |

Collections are constrained to the known billing datasets. Photos are content-addressed private R2 objects; they are returned only through the authenticated workspace API and included in full backups. A failed competing save can leave an unreferenced immutable photo object, but cannot replace committed billing records. Object garbage collection is future maintenance work.

The host supplies trusted `oai-authenticated-user-id` and email headers. Every billing-data query uses that owner ID. The app must remain behind the trusted Sites dispatch layer: do not expose this Worker through a public route that accepts caller-supplied identity headers. Sign in/out use the host's ordinary ChatGPT authentication links. The current audience is owner-only; multiple employees and business roles are outside this release.

## Atomic saves and device synchronization

The browser sends a command, expected revision and unique operation ID. The server applies the same financial rules independently. An atomic D1 batch updates the revision, records and operation receipt together. A constrained operation row aborts the entire transaction when a competing revision wins. Repeating a committed operation returns the latest workspace without posting another bill.

The browser polls the revision every eight seconds, fetching records/photos only after a change. Independent creates can rebase once after a conflict; edits and payments retain version checks and require reopening stale records. A pending save is retained locally before its network request. No other operation can silently replace it.

Full-workspace synchronization is currently capped at 20 MB, including photos; each metadata record is capped at 1.8 MB and API bodies at 21 MB. The invoice editor limits newly attached photos to 1 MB. Writes use bounded JSON groups to avoid one SQL statement per imported record. This is suitable for a small business workspace, with explicit size limits rather than an unlimited-history claim.

## Move from the old app

1. Keep a full JSON backup and preserve the old browser's recovery data.
2. Open the private hosted link with the same account on both devices. An empty cloud workspace is initialized on first connection.
3. On one device, choose **Data & sync → Restore JSON**. Inspect the proposed counts and confirm. The current workspace is backed up before replacement.
4. Compare parties/items, invoice and purchase totals, paid amounts, opening balances, custom fields and photos against the old app.
5. Refresh the second device and check the same data appears. Use the private cloud link for subsequent bills.

An existing cloud workspace never silently overwrites nonempty device-only data on first connection. Export the local backup before choosing **Use cloud data**. Migration does not merge divergent datasets automatically.

## Optional Google exports

Google Sheets is a reporting destination; D1 remains the billing source of truth. Drive receives complete versioned JSON backups. These actions remain disabled until an owner-authorized Google connection is configured on the server. Cloud synchronization does not depend on Google.

Create/select a dedicated Drive folder and spreadsheet, authorize the appropriate Google Drive and Sheets scopes through Google's OAuth process, and store the following as private Sites runtime variables. Keep credentials out of Git, browser settings, generated assets and logs.

| Variable | Value |
| --- | --- |
| `GOOGLE_OWNER_ID` | Trusted owner ID returned by the authenticated `/api/billing/session` endpoint |
| `GOOGLE_CLIENT_ID` | Authorized Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_REFRESH_TOKEN` | Owner-authorized refresh token |
| `GOOGLE_DRIVE_FOLDER_ID` | Dedicated backup folder ID |
| `GOOGLE_SHEET_ID` | Dedicated reporting spreadsheet ID |

The Worker verifies the billing owner and request origin, refreshes the token server-side and exports the current committed database revision. It never accepts a spreadsheet ID or arbitrary snapshot from the browser. Sheets tabs contain literal values with stale rows cleared in one batch; photos are represented as references rather than image data. Full Drive JSON preserves photos and all billing fields. Sheet export requests are capped at 2 MB; use JSON backup for larger workspaces.

Live Google OAuth authorization and exports have not been completed. They require the owner's Google resources and authorization.

## Reference documentation

- [Cloudflare D1 prepared statements, sessions and atomic batches](https://developers.cloudflare.com/d1/worker-api/d1-database/)
- [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [Google Drive resumable uploads](https://developers.google.com/drive/api/guides/manage-uploads)
- [Google Sheets batch updates](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate)
