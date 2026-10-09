# XL Billing

A modular billing application with sale invoices, purchases, party ledgers, allocated payments and a private cloud workspace. Navigation follows the familiar Vyapar business workflow: **Overview → Parties / Items → Sales / Purchases → Payment in / out → Reports**. The interface and assets are original.

The backend uses **Cloudflare D1**, with bill photos in **private R2 storage**. Authentication is supplied by the owner-private Sites host. The browser never needs a database key or an integration password. Open the same private URL with the same ChatGPT account on PC and phone.

## Run and verify

Node.js 24 or later is required. There are no npm dependencies to install.

```sh
node server.js
node scripts/check.js
node --test tests/*.test.js
node scripts/build-worker.js
node scripts/validate-artifact.mjs
node scripts/smoke-worker.mjs
```

`server.js` serves a device-only development preview at `http://localhost:4173`; it does not emulate the hosted API or authentication. ES modules need HTTP/HTTPS. The cloud app must be deployed as a Worker through Sites, rather than as static GitHub Pages.

## Source layout

| Path | Responsibility |
| --- | --- |
| `index.html`, `styles/` | Small HTML shell, responsive desktop/mobile layouts, print styles |
| `src/domain.js` | Financial validation, migration, invoice history and commands |
| `src/features/` | Invoice editor, lists, ledgers, dialogs and settings |
| `src/storage.js`, `src/cache.js` | IndexedDB cache, safe pending saves and synchronization |
| `src/cloud.js` | Same-origin authenticated billing API client |
| `backend/d1.js`, `backend/worker.js` | Owner-scoped database transactions and HTTP API |
| `backend/google.js`, `backend/projections.js` | Optional server-side Google backups and reporting |
| `drizzle/` | Deployment-time SQLite migrations |
| `scripts/build-worker.js` | Dependency-free deterministic Worker packager |
| `tests/` | Billing rules, rendering, migration, synchronization and actual SQLite tests |

## Cloud behavior

- Every save is validated again on the server. A revision comparison and atomic SQL batch prevent two devices from overwriting each other. Operation IDs make uncertain-response retries safe.
- Other devices check a small revision value every eight seconds and refresh after changes or reconnecting. This is polling-based synchronization.
- Cloud bills require an online successful commit. Drafts can remain on the device while disconnected; pending saves can be retried in **Data & sync**.
- Photos are private objects referenced by database records. Full JSON backups include photos, audit history, opening payments and preserved legacy fields.
- The current full-workspace sync supports up to 20 MB including photo data. Metadata in one record is limited to 1.8 MB. Larger archives need a future paginated sync migration; the app rejects oversized writes explicitly.

Deployment, optional Google configuration and migration steps are in [BACKEND_SETUP.md](docs/BACKEND_SETUP.md). The original defects and workflow mapping are in [CLEANUP.md](docs/CLEANUP.md); verified behavior and device checks are in [VERIFICATION.md](docs/VERIFICATION.md).

## Existing billing data

Download a full JSON backup from the old app before switching. Browser data is isolated by origin, so the new private URL cannot automatically read the old site's local storage. On the private app, use **Data & sync → Restore JSON**, review the record counts, then confirm. Both devices must subsequently use that private link and account.

When running the new code on the original origin, existing `shop4_*` keys can be migrated without overwriting the originals. Duplicate invoice numbers, invalid dates and malformed records fail visibly. Do not clear the old browser data until the restored totals, balances, photos and custom fields have been checked.

## Scope

The refactor preserves wholesale and bulk sales, purchases, retail entries, packing/brand/unit details, last-party prices, dispatch status, cancellations, allocated receipts/payments, opening balances, reports and A4/80 mm print templates. This is a billing and ledger application; automated stock accounting, statutory tax filing and a complete Vyapar feature set are not implemented.
