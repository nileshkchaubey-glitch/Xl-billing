# PM-02, PM-03 and PM-04: CSV safety and fidelity

This repair continues the confirmed blockers in `FINAL_PREMERGE_VERIFICATION.md`. It changes both CSV import screens and the local CSV exporter. It does not change invoice numbering, the complete private JSON backup format, Delete PIN, main, deployment, or storage recovery rules. All tests use disposable synthetic records.

## Completed behavior

- `createXLCSV` is an inline, dependency-free parser, serializer and preflight module. It handles escaped quotes, commas, CRLF records, embedded CR/LF and exact field whitespace. Malformed quoting, duplicate/unknown headers, incorrect row widths and mixed schemas are refused.
- `xlProcessCSV` and `importCSV` build and validate the complete candidate file before their single collection write. A mixed file with one valid row and one invalid row imports neither row. Existing recoverable storage still checks and commits the proposed write; no stronger localStorage atomicity is claimed.
- Explicit numeric text uses complete decimal parsing. `NaN`, `Infinity`, exponent notation, trailing text, declared blank values, negative receipts and more than two monetary decimal places are refused. Monetary values must fit safe integer paise. Supported quantities allow up to six decimal places. Values are not silently coerced or rounded.
- Declared financial fields reconcile in paise. The invoice fixture retains subtotal 100, discount 10, tax 0, total 90, paid 20 and balance 70. Saved receipt/discount histories must agree with aggregates. An explicit party/item reference must exist in the destination; names alone never create an inferred association.
- Existing record identifiers, histories, line details and unknown fields survive supported own-export imports. Duplicate record IDs or sales invoice numbers are refused, including within the same file. Imports do not reserve or advance the invoice counter.

## Versioned own-export contract

Every supported export keeps readable scalar columns and adds `xlCSV` and `recordJSON`. The marker is `XL-CSV-1:<collection>`, where the collection is invoices, purchases, parties, items or retail. `recordJSON` contains the full source row, including IDs, relationships, line items, payments, discounts and unknown fields. The importer checks every readable scalar against that source row and rejects inconsistent dual representations. It preserves source row fields rather than synthesizing missing history.

Every string cell receives exactly one leading apostrophe, including strings starting with `=`, `+`, `-`, `@`, whitespace or tabs, and the JSON source cell. The constant version marker and numeric cells are not arbitrary executable text. This is a spreadsheet literal-text policy; some spreadsheet viewers display the apostrophe. The versioned importer removes exactly the documented encoding prefix by reading the validated source record. Real original apostrophes remain part of the saved value. An unmarked legacy CSV never has its apostrophes stripped. Formula safety is verified from emitted cell bytes; an actual Office installation was not opened or certified.

Keep all own-export columns together. Removing a marker/source column, mixing versions or editing a readable value without a matching source record is refused. Use the supported legacy template for intentional summary entry, and Complete Private Backup for recovery. A CSV is a row transfer file, not a full backup: it does not include settings, counters, complete audit storage, preferences, unknown storage keys or independently captured matching master collections.

## Defined legacy compatibility

The unmarked previous-bills template remains supported: `date,invoiceNo,partyName,total,paid,paymentType,notes`. The prior unmarked item/party export headings and safely representable invoice scalar exports also remain supported. Known header case, spaces, underscores and hyphens normalize consistently; collisions after normalization are refused.

A historical invoice summary with total and no discount/tax can explicitly represent its total as subtotal. A discounted or taxed summary must provide its original subtotal; nonzero declared tax percentage also requires a declared tax amount. Declared balance must reconcile. Missing historical item/payment columns are not guessed.

Legacy `paid` is retained as `openingPaid` with an empty event history. The importer does not fabricate receipt dates or payment methods. A visible result identifies these as summary records and explains the missing history; the screens also state that CSV is not a recovery backup. A declared `openingPaid` that differs from paid is refused because the schema cannot explain the remainder. An absent party ID remains explicitly unlinked. A supplied party ID must match the supplied master name; an own-export row may retain its legitimate historical name snapshot for an existing ID.

Files with no record ID column create new manual row IDs. A declared blank or duplicate ID is refused. Missing bill numbers, unsupported financial/history columns, malformed exports or ambiguous schemas are refused without modifying the original collections. Older malformed quote/newline exports cannot be reconstructed reliably; no repair guesses their original contents.

The CSV input limit is 20,971,520 UTF-16 code units. It is not a browser-storage capacity guarantee. Legacy timestamp metadata supplied by the file is retained; newly created import records use UTC ISO `createdAt`. This repair does not authenticate historical audit metadata.

## Test evidence

The baseline is PR #9 commit `5d3fb7991586d7acef84d49cdd26a003b290d912`, application SHA-256 `37cb3c09b5d165768666d3ccefae9478b10f08a7dc20f1dcc219cad91e596933`. Local final CSV implementation is `d00ae4b53805867fba609be3581b513e1d9b15ab`, application SHA-256 `8c89415c6a198038fb57ad379bf40e411874d5d45dba5a196f18c80c668706c5`. Other PM repairs are deliberately absent from this isolated CSV evidence; combined final verification belongs to the root follow-up branch.

| Gate | Before | After |
| --- | --- | --- |
| Unchanged independent owner CSV probes, Chromium | 3 PASS, 4 FAIL, 0 harness errors | 7 PASS, 0 FAIL, 0 harness errors |
| Unchanged independent owner CSV probes, Firefox and WebKit | Prior PR #9 report contains confirmed failures | 7 PASS, 0 FAIL, 0 harness errors per engine |
| Actual Previous Bills and Excel file-input mixed valid/NaN rows, Chromium | 2 FAIL: both files append GOOD-ROW and BAD-ROW; BAD-ROW paid becomes 0 | Both leave exact original business bytes unchanged; final browser gate includes both in all engines |
| Pure codec/preflight acceptance | 27 FAIL against the baseline because the module is absent | 27 PASS, including 120 generated codec round trips |
| Real file-input regression | Mixed-invalid baseline evidence above | 17 cases per browser; 51 PASS across Chromium, Firefox and WebKit |
| Lint and build | Existing lint warning debt retained | 0 lint errors, 143 existing warnings; self-contained build passes |

The initial negative unit checks were tightened to require actual `CSV rejected:` errors; a missing module or another harness exception cannot satisfy a refusal test. Corrected baseline and passing results are recorded separately. No failure was relabeled as an expected pass.

The browser cases cover both import entry points, full-file rejection, sub-paise amounts, unsupported fields, missing master relationships, duplicate numbers within one file, precise summary arithmetic, real own-export download/upload, exact ID/history/unknown-field preservation, formulas and genuine apostrophes, quoted CRLF text, and inconsistent readable/source columns. Curated source-bound results are in `test/premerge/csv-repair/`.

Reproduce focused tests from a checkout:

```sh
node --test test/unit/csv-safety.test.cjs
npx playwright test test/e2e/csv-safety.spec.cjs
XL_PREMERGE_ONLY=csv-invalid-paid,csv-reject-duplicate,csv-reject-overpaid,csv-reject-invalid-date,csv-round-trip,csv-formula-neutralization,csv-invoice-financial-round-trip node scripts/verify-premerge.cjs
```

Run the owner command with `XL_PREMERGE_BROWSER=chromium`, `firefox`, and `webkit`. Browser/dependency versions remain the repository's existing pinned tooling; no plugin, package, remote runtime script or paid service was installed for this repair.

## Remaining limits

CSV does not authenticate financial history or replace verified private recovery. A full row import requires matching referenced masters in the destination. Unsupported/ambiguous legacy files remain refused and require owner inspection outside the application; source files and stored bytes stay intact. Physical spreadsheet behavior and native device import dialogs remain owner checks. The broader PM blockers, cancellation/opening policies, older uncooperative writer races, storage capacity and native printing are reported separately; this document does not make a merge-readiness decision for the entire application.
