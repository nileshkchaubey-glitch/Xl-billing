# XL Billing

A modular billing application with sale invoices, purchases, customer/supplier ledgers, allocated payments and an optional Supabase cloud workspace. The navigation follows the familiar business workflow of Vyapar: **Overview → Parties / Items → Sales / Purchases → Payment in / out → Reports**. The visual design is original.

## Run and verify

Requires Node.js 20.11 or newer; Node.js 24 is used in CI. There are **no npm dependencies to install**.

```bash
node server.js
node scripts/check.js
node --test tests/*.test.js
```

Open `http://localhost:4173`. ES modules must be served over HTTP/HTTPS; double-clicking `index.html` is not supported. For shared PC/mobile access, host the root on an HTTPS static host such as GitHub Pages, then configure the same owner account on both devices. The development server has no billing API; the backend is Supabase.

## What works

- Sale and purchase creation, item-wise or amount-only entries, edits, historical bills in a bulk entry screen, invoice numbering, dispatch and cancellation/restoration.
- Party and item catalogues; archived masters can be restored. Historical bills retain their original descriptions and prices.
- Payment in/out with explicit allocation or FIFO allocation, settlement discounts, payment reversals and separate opening-balance payments. Overpayments and unmatched allocations are rejected.
- Last-price hints and history by party, item identity, unit and brand, ordered by bill date. Draft and cancelled bills are excluded. Purchase history is separate from sale history.
- Daily retail entries, date/search/status filters, paginated transaction lists, item sales reports and activity history.
- Business settings, custom invoice fields, packing, bill-level tax and A4 / 80 mm print layouts.
- Full JSON backup/restore and Excel-compatible CSV export; reviewed atomic CSV imports for parties/items. JSON contains photos and audit history; CSV is a reporting format.
- Cloud sync every eight seconds, on focus/reconnect and after saving. The backend checks revisions, locks writes and deduplicates operation IDs. Stale edits are rejected; independent creates can be rebased safely.
- Offline application shell and local drafts. Cloud billing requires a successful online save; an uncertain response leaves a pending operation available to retry.

## Connect PC and phone

1. Download a JSON backup from the old app on the device containing your current records.
2. Create a dedicated Supabase project and run [`backend/schema.sql`](backend/schema.sql) in its SQL editor. Create one owner account in Authentication. Restrict public signups if you only need your own business.
3. Deploy the web files at an HTTPS URL. In **Data & sync**, enter that project's URL, **publishable/anon key** and the owner email/password.
4. On the original device, restore the reviewed JSON backup if the deployed origin differs from the old app. Sign in to the new, empty cloud workspace to upload those records.
5. On the phone, open the same URL and sign in with the same project/account. Its empty local workspace loads the cloud records. An existing local dataset is preserved until you explicitly choose **Use cloud data**; that action downloads a backup first.
6. Verify one test invoice and its payment on both devices before switching daily billing to the new version.

Browser storage is scoped to its origin. Moving from one URL to another does not automatically move the old browser records. Import is required in that case. The original `shop4_*` keys remain untouched when migration happens on the same origin. Full records are cached in IndexedDB; small connection/pending-operation metadata stays in localStorage. Auth sessions stay in sessionStorage.

Optional Drive backups and Sheets reports require the separate [Google integration setup](docs/BACKEND_SETUP.md). They do not affect database saves.

## Source layout

| File / folder | Responsibility |
| --- | --- |
| `index.html` | HTML shell and accessible navigation/dialog containers |
| `styles/app.css` | Desktop, tablet, phone and print styles |
| `src/main.js` | Routing and one set of delegated control handlers |
| `src/domain.js` | Billing rules, migration, allocations, balances, history |
| `src/features/` | Invoice editor, lists, dialogs and settings renderers |
| `src/storage.js`, `src/cache.js` | Workspace cache, pending saves and sync coordination |
| `src/cloud.js` | Authenticated REST client and session refresh |
| `src/export.js`, `src/print.js` | Safe exports and invoice printing |
| `backend/` | PostgreSQL schema/RPC and optional Google Edge Function |
| `tests/`, `scripts/` | Financial, migration, rendering, API and database checks |

## Architecture and limits

The initial cloud implementation stores one versioned JSON workspace per owner in PostgreSQL. This preserves unknown legacy fields and allows an atomic migration without inventing a different accounting model. Each save writes the complete workspace under a row lock with an expected revision. RLS isolates owners; the client cannot update tables directly. PC and phone use the same owner account. Multiple staff accounts and role permissions are a later extension.

This is suitable for a modest single-business workspace. Snapshots are capped at 20 MB; new bill photos are capped at 1 MB each. For larger histories, migrate to normalized parties/items/documents/lines/payments tables and private object storage for photos, with paginated queries and incremental realtime events. Sheets exports have a 2 MB request limit. These limits produce errors rather than deleting or truncating records.

The original **bill-level tax** calculation is retained. Item GST defaults are stored, but automatic GST breakup, e-invoicing, inventory stock valuation and staff access are outside this refactor. Customer advances cannot be entered through the allocated-payment screen. Google Sheets changes do not import back into billing.

See [cleanup findings and preserved workflows](docs/CLEANUP.md), [backend activation](docs/BACKEND_SETUP.md) and [verification / release checks](docs/VERIFICATION.md).
