# Cloud backend and migration

## Hosting and storage

The frontend remains compatible with GitHub Pages. Deploy the API to a Cloudflare Worker in the business owner's own Cloudflare account. Firebase Authentication supplies the app's email/password login; it does not store the billing database. This revision is not deployed: no Cloudflare/Firebase account has been provisioned or configured here.

1. In your Firebase project, enable **Authentication → Email/Password**. Create the owner's account in the console and record its UID. The app offers sign-in and password reset, with no registration screen. Enable email enumeration protection and configure the password reset template/domain. Never share your password in chat or Git.
2. Using your existing Wrangler installation, sign in to your Cloudflare account. Copy `wrangler.example.jsonc` to the ignored `wrangler.jsonc` file.
3. Create the D1 database and private R2 bucket in that account:

```sh
wrangler d1 create xl-billing
wrangler r2 bucket create xl-billing-photos
```

4. In `wrangler.jsonc`, replace the placeholder database ID, `FIREBASE_PROJECT_ID` and `BILLING_OWNER_UID`. Keep `APP_ORIGIN` equal to the frontend origin, `https://nileshkchaubey-glitch.github.io`, without the repository path or trailing slash. Set `FIREBASE_API_KEY` privately using `wrangler secret put FIREBASE_API_KEY --config wrangler.jsonc`. This key must belong to the same Firebase project. Use an API-restricted server key that permits Identity Toolkit; browser-referrer-only restrictions cannot be used for server account lookup.
5. Build, migrate and deploy the API:

```sh
node scripts/build-worker.js
node scripts/validate-artifact.mjs
node scripts/smoke-worker.mjs
wrangler d1 migrations apply xl-billing --remote --config wrangler.jsonc
wrangler deploy --config wrangler.jsonc
```

6. Put the actual HTTPS Worker origin and public Firebase web configuration in `config.json`: `apiBaseUrl`, `firebaseApiKey`, `firebaseProjectId`. These are public configuration values; never put passwords, refresh tokens, database credentials or Google OAuth secrets there. Test on a separate frontend/review origin before rollout. Update `APP_ORIGIN` to that test origin while testing, then to the actual production frontend during cutover.

The build creates dependency-free `worker/index.js` and `dist/server/index.js` artifacts, plus `dist/drizzle/` migrations. No packages were installed during this refactor; the deployment commands assume an existing Wrangler installation. Neither an empty configuration nor passing unit tests means live synchronization is active.

Migrations run during deployment. Requests never create tables. `0000_billing.sql` creates:

| Table | Stored data |
| --- | --- |
| `billing_workspaces` | Owner ID, settings and extra metadata, current revision, last operation |
| `billing_records` | Collection, stable record ID, order, JSON fields, private photo reference |
| `billing_operations` | Owner-scoped operation IDs and successful revisions for retry deduplication |

Collections are constrained to the known billing datasets. Photos are content-addressed private R2 objects; they are returned only through the authenticated workspace API and included in full backups. A failed competing save can leave an unreferenced immutable photo object, but cannot replace committed billing records. Object garbage collection is future maintenance work.

Every record access requires a Firebase owner ID token in the Authorization header. Google's authenticated account lookup verifies the token; unverified JWT claims never grant access. The Worker checks project, issuer, expiry, email/password provider, owner UID, disabled status and credential revocation time. Identity headers supplied by a hosting proxy are ignored. Positive verification is cached for at most 30 seconds, bounded by token expiry; revocations may take up to that interval to take effect.

Tokens are kept in the tab's session storage, scoped to the API origin and Firebase project. Passwords are never persisted. The client refreshes expiring tokens, and sign-out removes them. This is a single-business, single-owner release; employee roles require a separate permissions design. Only the configured frontend and API origins receive CORS permission, and cookie-based cross-site authentication is not used.

## Atomic saves and device synchronization

The browser sends a command, expected revision and unique operation ID. The server applies the same financial rules independently. An atomic D1 batch updates the revision, records and operation receipt together. A constrained operation row aborts the entire transaction when a competing revision wins. Repeating a committed operation returns the latest workspace without posting another bill.

The browser polls the revision every eight seconds, fetching records/photos only after a change. Independent creates can rebase once after a conflict; edits and payments retain version checks and require reopening stale records. A pending save is retained locally before its network request. No other operation can silently replace it.

Full-workspace synchronization is currently capped at 20 MB, including photos; each metadata record is capped at 1.8 MB and API bodies at 21 MB. The invoice editor limits newly attached photos to 1 MB. Writes use bounded JSON groups to avoid one SQL statement per imported record. This is suitable for a small business workspace, with explicit size limits rather than an unlimited-history claim.

## Move from the old app

1. Keep a full JSON backup and preserve the old browser's recovery data.
2. After the staged rollout checks, open the billing app and sign in with the same billing email/password on both devices. An empty cloud workspace is initialized on first connection.
3. On one device, choose **Data & sync → Restore JSON**. Inspect the proposed counts and confirm. The current workspace is backed up before replacement.
4. Compare parties/items, invoice and purchase totals, paid amounts, opening balances, custom fields and photos against the old app.
5. Refresh the second device and check the same data appears. Use the verified billing frontend for subsequent bills.

An existing cloud workspace never silently overwrites nonempty device-only data on first connection. Export the local backup before choosing **Use cloud data**. Migration does not merge divergent datasets automatically.

## Optional Google exports

Google Sheets is a reporting destination; D1 remains the billing source of truth. Drive receives complete versioned JSON backups. These actions remain disabled until an owner-authorized Google connection is configured on the server. Cloud synchronization does not depend on Google.

Create/select a dedicated Drive folder and spreadsheet, authorize the appropriate Google Drive and Sheets scopes through Google's OAuth process, and store the following as private Worker secrets. Keep credentials out of Git, browser settings, generated assets and logs.

| Variable | Value |
| --- | --- |
| `GOOGLE_OWNER_ID` | Firebase owner UID returned by the authenticated `/api/billing/session` endpoint |
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

- [Firebase email/password, refresh, reset and authenticated account lookup](https://firebase.google.com/docs/reference/rest/auth)
- [Wrangler configuration and bindings](https://developers.cloudflare.com/workers/wrangler/configuration/)
