# PM-01 browser recovery and numbering follow-up

This supplements [PM01_REPAIR.md](PM01_REPAIR.md). The complete private-file and raw-adoption UI workflows now pass with distinct suppliers sharing P-1 and one supplier reusing P-1 in the next saved-date financial year. No source reference, supplier identity, saved financial year, historical receipt or discount is rewritten to make a test pass.

The new browser fixture contains three purchases: p2/P-1 dated 2026-10-09, p3/P-1 on that date, and p2/P-1 dated 2027-04-01. Each preserves total 500, actual cash paid 20, noncash supplier discount 10 and balance 470. Raw strings, settings, unknown compatible keys and preferences are compared exactly, not reconstructed as an invented earlier snapshot.

Five actual browser cases run in each engine:

1. Normal private export, saved-file import preview, wrong/current PIN, independent pre-restore download, committed restore and reload.
2. Real New Invoice Save, private export, valid external modification, failed initialization, raw recovery download/reselection proof, private restore preview, wrong PIN, missing confirmation, approved restore and reload.
3. Real New Invoice Save followed by valid external multi-supplier records, failed initialization, raw export/reselection proof, adoption preview, owner confirmation/current PIN, committed adoption and reload.
4. Ambiguous supplier-less duplicate adoption is refused; business and coordination bytes remain unchanged.
5. Ambiguous legacy-backup restore is refused; business and coordination bytes remain unchanged.

The locked cases assert `nav`, `saveSaleInvoice` and `importData` never initialized. They use the self-contained recovery UI and captured downloads, not direct recovery calls. A displayed preview or passing decode alone is not counted as a committed recovery. The test has no file-input clearing workaround, fabricated old snapshot or validation bypass.

The first new UI run found another real recovery defect. After a backup was refused because export proof was absent, selecting the same saved backup after proof caused no `change` event in Chromium/WebKit. The preview remained empty. Actual results were **13 passed, 2 failed**; Firefox dispatched the second selection. Fix `d91f44970c82df2d2ec5ab7d28015fe50316b220` clears only the proof/backup DOM input's selection in `finally`, after processing the captured File. This allows explicit reselection and revalidation. It does not delete the saved file, mutate business storage, waive proof, change the backup format or authorize a restore.

The final UI fixture at test commit `be21969d1ed91b8d940ce879c2e882b3f5e85122` also blocks requests outside its isolated loopback origin and awaits the visible wrong-PIN result. All existing assertions remain. On runtime SHA-256 `aebeb34272efea6906edeac8f69fd4bc8afee230507a19aaeee1c37f20af24c1`, **15 passed, 0 failed, 0 skipped** across Chromium, Firefox and WebKit. [Source-bound comparison](../test/repairs/pm01/browser-recovery-before-after.json) includes each actual result and both retry failures.

An optional extra replay against original PR #9 application bytes was stopped to release shared final-verification resources: 14 failures, 1 interrupted. This is **not a completed or verified baseline gate**. Its failures include newly specified ambiguity diagnostics; they do not establish 14 corruption incidents. The previously completed immutable owner probes and their unchanged before/after reports remain the authoritative PM-01 baseline. The incomplete extra replay is labelled explicitly in the evidence rather than presented as passing.

Independent review also found an inherited sales-number bypass: the old duplicate guard tested only new IDs, so changing an existing INV-1002 to INV-1001 passed an ordinary transaction. Test-first `d57781c` reproduced **1 passed, 2 failed**; fix `3b79c52` refuses changed duplicates irrespective of which conflicting record appears first. Untouched historical duplicates remain readable during unrelated changes, and full recovery still rejects them. No invoice number, counter, prefix, FY or series policy changes. [Sales evidence](../test/repairs/pm01/sales-collision-before-after.json) records the before failures and final passing assertions.

The final isolated Node run on committed recovery-fix bytes passed **83 tests: original 63 + supplier 17 + sales 3**, with zero failures/skips. The existing parcel VM passed earlier. The final assembled repair branch must still run the complete application suite, independent owner/safety gates, lint/build and exact-head GitHub CI; this supplement certifies only its stated subtask checks.

Reproduction on an isolated synthetic test profile using existing development dependencies:

```sh
node --test --test-reporter=tap test/unit/*.test.cjs test/foundation/*.test.cjs
XL_REPORT=/tmp/pm01-recovery-ui.json npx playwright test test/e2e/supplier-recovery.spec.cjs
```

The reported local UI executions used a temporary loopback HTTP server on an OS-assigned port with the same index.html bytes and an isolated Playwright configuration. No installation was required. Original dependencies and browser-library fallback were sufficient. Parent final verification supplies the assembled branch and Draft PR links; no main modification, push, merge, deployment, real profile, live account or hardware operation was performed by this subtask. Ambiguous historical identities/dates and actual device/private-profile acceptance remain owner decisions.
