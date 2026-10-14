# Plan A A1b — isolated read-only storage diagnostics

**Status: Draft PR implementation; actual-head CI and owner approval required.** This diagnostic tool is NOT a backup, sync, recovery, financial verification or production certification.

## Delivered scope

- Standalone static entrypoint: [storage-diagnostics.html](../storage-diagnostics.html). Open using the same HTTPS billing origin and Chrome profile. No billing index page, migration scripts, other resources or provider calls are loaded.
- Read-only inventory of billing collections, settings, supported unknown prefixed keys, direct preferences and pending-import marker. Show distinct absent, present-empty, invalid, null, wrong type, duplicate IDs and denied/incomplete outcomes; never default unreadable business data to empty.
- Present coarse record counts, UTF-8 and UTF-16 string sizes, generic warnings and **unverified** provider/backup statuses. Never display stored records, key values, raw exceptions or credentials.
- No export/import, restore, file/folder permission, business-data write, cloud request, mutation, quota-fill probe, local diagnostics marker, persistent status or application startup.

## Source and origin constraints

The original index.html SHA-256 remains d5fbcd1a47a5bf6e8d2ec735b561f46108e3c905878ba301acd322040b52b70a. All 15 initial files and 12 A1a files are unchanged. The existing billing UI gains no new link; open the diagnostics page URL explicitly.

The page is **same-origin, not an isolated restore profile**. A different hostname/browser profile can show absent records. file:// origin is unsupported because browser storage semantics vary. Offline availability is not guaranteed without a previously cached copy; no new Service Worker is installed. Ordinary XL Billing startup migrations are not started by this document, but they remain active if the user opens the original app separately.

The tool includes a restrictive CSP, zero external assets and fixed labels rendered using textContent only. Unknown keys are counted but their names and stored strings are not shown. No network calls are allowed. A localStorage inspection does not provide cross-tab atomicity, accurate free quota, physical durability, accounting correctness or independent backup proof.

## Acceptance checks

| Gate | Tested scope |
| --- | --- |
| A-READ-01 | Absent/empty/bad JSON/null/wrong type/duplicate IDs/denied property, length, key or read |
| A-READ-02 | Separate entrypoint never loads index or runs app migrations on visit, reload, refresh |
| A-DIAG-PRIVACY-01 | No hostile/secret values, raw error or unapproved requests |
| A-DIAG-STATUS-01 | Backup and provider statuses explicitly unknown, recovery marker warning |
| A-DIAG-SIZE-01 | Synthetic UTF-8 and UTF-16 sizes, without quota guarantees |
| A-DRILL-ORIGIN-01 | Synthetic same-origin browser tests and unsupported file-origin refusal |
| A-CI-01 | Exact PR-head checkout and baseline integrity harness |

Synthetic VM harness: [verify-readonly-diagnostics.cjs](../qa/plan-a/verify-readonly-diagnostics.cjs). Three-engine browser harness: [verify-diagnostics-browser.cjs](../qa/plan-a/verify-diagnostics-browser.cjs). GitHub Action: [plan-a-diagnostics.yml](../.github/workflows/plan-a-diagnostics.yml).

The browser harness uses a loopback HTTP server and **synthetic** seeded records in disposable Chromium, Firefox and WebKit contexts. It checks raw-key/value equality before/after visit, reload and reinspection and blocks any other network request before navigation. It does not load the production billing URL or real customer files. Node 22.23.3 and ephemeral Playwright 1.56.1 are test-only dependencies.

**Actual pass/fail must be read from the final head's CI run**, rather than inferred from this specification.

## Not implemented or verified

No owner Chrome-profile data reads, real-backup restoration, automatic Google Drive backup, SQLite migration, PWA, JSONBin quarantine, financial reconciliation, cross-tab consistency, quota/eviction durability, or native device testing. Existing normal-app corrupt-data fallback and early migrations remain unchanged. Do not merge or deploy without owner approval.
