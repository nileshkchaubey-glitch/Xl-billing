# Backend activation

The source includes the integration. A live project, owner account, hosted URL and Google authorization must be configured before cloud/Google controls can work. No existing cloud project is modified by this refactor.

## Billing database

1. Create a dedicated Supabase project. Run `backend/schema.sql` in the SQL editor; the script is transactional and can be rerun for this version.
2. Create an owner email/password account in Authentication. Disable public signup if it is unnecessary. Use this account on every billing device.
3. Deploy the static frontend over HTTPS. GitHub Pages can serve the ES modules directly from the repository root. No build or package installation is required. Disable Jekyll processing if your host requires it; the repository includes `.nojekyll`.
4. In Data & sync, enter the Supabase project URL and a publishable or legacy anon key, then sign in. Never enter a secret/service-role key.
5. Restore your full old JSON backup on the original device before its first connection to an empty workspace. Check counts, balances and photos. Open the other device and sign in.

`xl_billing_workspaces` contains a private data snapshot and revision for each `auth.uid()`. An authenticated owner can select their row; only `xl_billing_commit` can write. `xl_billing_operations` is private and deduplicates acknowledged or uncertain retries. A revision conflict returns SQLSTATE `40001`. The client fetches the newer data and rebases independent creates. Bill/master/settings edits carry version checks and fail if stale. Neither device silently replaces the other device's changes.

An uncertain network response leaves the original operation in localStorage. Retry in Data & sync sends the same ID. Do not clear browser storage before exporting saved data and any pending operation. Restoring a backup replaces the workspace after review and first downloads its current contents.

The schema deliberately preserves a JSON workspace for this migration. Back up the database according to your hosting plan and retain periodic JSON exports. For growth, the next migration should split documents/lines/payments into relational tables and store photos in private object storage. Do not raise the size cap as a substitute for that migration.

## Optional Google integration

Use a Google Cloud OAuth **web application** for the business owner's account. Enable Drive API and Sheets API, configure the OAuth consent screen, request Drive and Sheets access, and obtain a refresh token through the server OAuth authorization-code flow with offline access. Use the narrow `drive.file` scope if your application creates/selects its folder/files; access to existing files may require broader scopes. Obtain explicit authorization for the chosen resources. Google refresh tokens for an external app left in Testing can expire; configure the consent screen appropriately for ongoing backups.

Create/select a dedicated Drive folder and a spreadsheet owned by that account. Store the following as Edge Function secrets (Supabase URL/anon key are normally supplied by the platform):

| Secret | Value |
| --- | --- |
| `APP_ORIGIN` | Exact frontend origin, e.g. `https://owner.github.io` (no trailing slash or repository path) |
| `BILLING_OWNER_ID` | Owner's UUID from Supabase Authentication |
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_REFRESH_TOKEN` | Authorized business account's refresh token |
| `GOOGLE_DRIVE_FOLDER_ID` | Target Drive folder ID |
| `GOOGLE_SHEET_ID` | Target spreadsheet ID |

Deployment through an existing Supabase CLI:

1. Run `supabase init` in a separate deployment directory.
2. Copy `backend/functions/xl-billing-google/` to `supabase/functions/xl-billing-google/`.
3. Copy the `[functions.xl-billing-google]` section from `backend/config.toml` into the generated `supabase/config.toml`.
4. Add secrets through the dashboard or a private env file. Do not commit credentials. Deploy with `supabase functions deploy xl-billing-google --project-ref YOUR_PROJECT_REF`.

The custom entry point is JavaScript. `verify_jwt = false` disables the platform's legacy JWT precheck; the function **still validates every request** through `/auth/v1/user`, requires the configured owner UUID and enforces the frontend origin. It then reads the workspace using that user's JWT/RLS. A caller cannot choose another owner, folder or spreadsheet in their request.

**Back up to Drive** creates a new version-labelled JSON file using a resumable upload, including photos and audit history. A failed upload may leave an incomplete upload session; retry can create a second backup, which is harmless but not a deduplicated export. **Update Google Sheets** atomically refreshes the named reporting tabs (Items, Parties, Sales, Purchases, Lines, Payments, Retail, OpeningPayments, Audit, Snapshot), clearing stale cells in those tabs and preserving unrelated tabs. Named tabs are generated reports; edits inside them will be replaced. Photos stay in JSON backups. Upstream failures are shown without changing billing records.

## Primary API references

- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Edge Function authentication](https://supabase.com/docs/guides/functions/auth)
- [Function configuration / custom JavaScript entry point](https://supabase.com/docs/guides/functions/function-configuration)
- [Google Drive resumable uploads](https://developers.google.com/workspace/drive/api/guides/manage-uploads)
- [Google Sheets UpdateCellsRequest](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/request#updatecellsrequest)
- [Google OAuth server flow](https://developers.google.com/identity/protocols/oauth2/web-server)
