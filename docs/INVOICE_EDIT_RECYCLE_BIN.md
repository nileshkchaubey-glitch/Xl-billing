# Invoice edit/print identity and invoice Recycle Bin

Scope: the owner's request after PR #24. Base main: `318f987` (merged delete-PIN fix). The paused A3b automatic backup branch is excluded. No framework, build step or runtime dependency is added; application changes remain in index.html.

## Behavior

- A saved form retains its invoice ID. Update then Save & Print, repeated Save & Print, and new Save & Print followed by another save update the same record instead of creating another invoice or incrementing its number.
- Explicit New Invoice links (desktop, mobile, dashboard, sale list, party detail and existing keyboard path) clear that saved identity and open a fresh form. Existing Edit and Cancel Edit remain supported.
- Invoice Delete now requires the existing PIN and moves the complete invoice, including payments/custom fields/cancellation and dispatch state, to Invoice Recycle Bin. Sidebar and Sale List buttons open it; Restore requires PIN and returns the same ID/number/history. There is no automatic expiry or individual permanent-delete action.
- Previously permanently deleted invoices cannot be reconstructed by this feature. Older independent backups may contain them; never import over the live profile.

## Impact map

| Area | Impact and boundary |
| --- | --- |
| Save/update/Save & Print | Keep form identity after confirmed save; no total, payment-validation or numbering formula change. Explicit New Invoice resets it. |
| Active invoices | Existing `shop4_invoices` remains the active collection. All existing report/ledger/payment/export readers still use it. No new soft-delete filter is needed throughout the application. |
| Recycle Bin | New optional `shop4_invoice_recycle` raw key contains `{id, deletedAt, invoice}` entries. It is created only by an explicit successful delete. No startup migration. |
| Reports/outstanding/dashboard/payment ledger | Deleted invoice is absent from active collection as before; its amounts/payments are excluded. Restore reinstates the original record, including any cancelled state; existing cancellation rules are unchanged. |
| Other records | Parties, items, purchases, retail, settings/PIN and unrelated keys are not rewritten by a move. Restore does not recreate a deleted party/item master. |
| Invoice numbers | Delete/restore never changes the counter. Restore refuses a conflicting active ID or case-insensitive invoice number. Identical copies from an interrupted move may be reconciled without adding another invoice. |
| Audit | Confirmed moves log delete/restore. Audit write failures roll back the move where possible; existing 500-entry cap is retained. |
| Private V1 backup and verified-folder page | Existing generic `shop4_*` capture includes the archive with exact raw strings. Signed codec and file format remain byte-identical. Tested round-trip includes the bin. |
| Older V4 backups/Google Sheets | They lack the new archive. Do not treat legacy exports or Sheets sync as a complete Recycle Bin backup. JSONBin remains disabled; Apps Script is unchanged. |
| Diagnostics | Existing read-only diagnostics remain unchanged and may flag the archive as an additional unknown prefixed key. They do not certify its internal records. |
| Clear All Data | Existing two-confirmation action explicitly names Recycle Bin and also removes that new key. Cancelling preserves it. Other legacy clear-all behavior is unchanged. |
| Print | Actual installed print function receives the saved invoice ID; popup content stays attached to its number. Physical printer/PDF behavior remains owner verification. |

## Small storage-move protocol

Read and validate source/destination plus the audit array directly; corrupted JSON and pending-import markers refuse a move. Capture the reviewed row before PIN and reject changed/stale records at confirmation. Write and read back the complete destination before removing the source. Verify source removal and audit write before reporting success.

On a synchronous error, restore exact original raw keys/absence. Source recovery is checked before undoing the destination, so a failed rollback does not remove the last full copy. A recovery-required message asks the owner to stop editing if bytes cannot be restored. A sudden process stop can leave two copies; a repeated owner-confirmed move may reconcile them only when the invoice contents agree exactly.

This is not a cross-tab transaction engine, journal, early-startup safety fix or disk-durability guarantee. Use one active billing profile/tab. Bin invoices still use browser storage; quota pressure can prevent a move, and no silent deletion frees that space. Keep Private Backups.

## Actual local evidence

Before implementation, `NODE_PATH=/tmp/xl-full-dom/node_modules node qa/invoice-recovery/verify-app.cjs` failed on merged main: repeated Save & Print produced **2 invoices instead of 1**.

After implementation:

- Same full-application JSDOM command: **13 groups PASS**. Real inline app scripts, installed save/PIN/report/payment/backup functions and DOM events execute over synthetic storage. Native print windows are simulated; popup identity is checked.
- Groups cover repeated edit/new Save & Print, Update then Save & Print, explicit fresh entry, complete delete/restore, active report/payment exclusion, exact signed backup round-trip, stale/conflicting/corrupt records, six destination/source/audit quota cases across delete and restore, rollback failure preserving the last copy, interrupted duplicates, pending imports, safe text, cancelled records after reload and explicit clear-all confirmation.
- Six unchanged original QA suites: **PASS**.
- Delete PIN DOM regression: **PASS**, with only its storage adapter extended to model the newly recoverable delete callback.
- A3a 11 groups, A1b 14 groups, 15 historical fixture checks, 14 evidence-runner controls, 40 JSONBin checks and original provenance controls: **PASS**.

Commands for reproduction:

```sh
npm install --prefix /tmp/invoice-tests --no-save --no-package-lock jsdom@26.1.0 linkedom@0.18.12
NODE_PATH=/tmp/invoice-tests/node_modules node qa/invoice-recovery/verify-app.cjs
NODE_PATH=/tmp/invoice-tests/node_modules node qa/verify-delete-pin.cjs
node qa/plan-a2/verify-runtime-revision-tests.cjs
node qa/plan-a3a/verify-backup-source.cjs
node qa/plan-a/verify-readonly-diagnostics.cjs --runtime-revision qa/plan-a2/runtime-revision.json
node qa/plan-a/verify-historical-fixtures.cjs --runtime-revision qa/plan-a2/runtime-revision.json
```

The immutable A1a/A2 manifests stay unchanged. Exact new index bytes are pinned in qa/invoice-recovery/verify-source.cjs; projecting only the enumerated UI/save/move regions and two explicit-new-entry call sites must reconstruct the identical merged PR #24 before existing provenance validation runs. No backup codec changes are permitted.

The new Invoice edit and Recycle Bin CI workflow checks the actual head, runs full-app synthetic checks and real Chromium/Firefox/WebKit UI scenarios. Browser results are pending until actual CI executes; local browser binaries were unavailable. Browser tests are defined for repeated edit/print, actual PIN cancel/delete/restore, quota failures and explicit New Invoice. Test definitions alone are not passing evidence.

No real billing data was opened, edited or deleted. No merge/deploy is authorized by this report. Review actual-head CI and leave the production merge to the owner.
