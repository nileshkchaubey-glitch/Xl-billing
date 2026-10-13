# Payment Out focus repair

The final-source owner collector found a genuine UI failure in `real-payment-out`: the supplier field became `Synthetic Supplier12.34`, the amount stayed empty and the selected supplier ID was cleared. Billing correctly refused the operation, retaining paid 20 and balance 480 instead of the expected paid 32.34 and balance 467.66. This was a focus defect, not a date error, storage snapshot race or invalid accounting expectation.

`openPayOutModal()` scheduled an unconditional supplier-field focus after 80 ms. When the user had already selected a supplier and focused Amount, that callback moved focus back to Supplier. Subsequent keyboard text landed in the supplier name. Its input handler correctly invalidated the reviewed bill selection rather than saving a payment against an unreviewed identity. The failed owner result and screenshot observations remain in the comprehensive repair report; no existing assertion is removed or weakened.

## Test-first evidence and minimal change

Test commit `765dcf218c812c3e99af834a8cbd13118be8aa04` adds a fifth case to `scripts/verify-party-click.cjs`. The four original assertions and the helper's unchanged-business-byte requirement remain intact. The added case uses real navigation, supplier autocomplete, Amount focus and keyboard entry, while the browser clock deterministically crosses the former 80 ms callback. It asserts the selected supplier, Amount focus, UPI mode and exact 12.34 allocation. It introduces no sleeps, retries or expected-failure conversion.

[Before evidence](../test/party-actions/payout-focus-before-chromium.json) binds that test commit to application SHA-256 `990c1f10db9e25ed1fc98a5f76d04e7ed9bab2062f5ba9477402ede78d0ec6dd`: four original cases pass and the new case fails, with no harness errors. Focus changes from Amount to Supplier, typing alters the supplier field, the review is cleared and original billing bytes remain unchanged.

Fix commit `e32d6ef30ca0e9349450a71f295a7bc34c0e6277` changes one application line: the supplier receives initial focus synchronously after the modal is shown. There is no later focus callback to interrupt another control. Selection validation, financial-review tokens, allocation, PIN behavior, numbering, business dates and storage writes are unchanged.

After application SHA-256: `0b59624aa83af362c884c0bc32d214b10d7df5bd203e55cab55507861601c0df`.

| Focused check | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| Existing four party cases plus new Amount-focus case | 5 PASS, 0 FAIL | 5 PASS, 0 FAIL | 5 PASS, 0 FAIL |
| Original unchanged owner `real-payment-out` Save assertion | PASS | PASS | PASS |
| Harness errors | 0 | 0 | 0 |

The five-case reports are [Chromium](../test/party-actions/payout-focus-after-chromium.json), [Firefox](../test/party-actions/payout-focus-after-firefox.json) and [WebKit](../test/party-actions/payout-focus-after-webkit.json). They verify unchanged billing bytes during navigation and typing. Separate original-owner reports exercise actual Save and verify the cash opening receipt 20 plus UPI 12.34, paid 32.34 and balance 467.66: [Chromium](../test/party-actions/payout-focus-owner-after-chromium.json), [Firefox](../test/party-actions/payout-focus-owner-after-firefox.json) and [WebKit](../test/party-actions/payout-focus-owner-after-webkit.json).

All six focused after invocations exited successfully. These are isolated source-bound checks, not a claim that final combined CI or all other gates have passed. The comprehensive verification report supplies final committed-head CI and the retained unsupported older-writer failure.

## Environment and limits

Tests use disposable synthetic browser contexts and loopback servers with external requests blocked. The isolated worktree reuses the existing lockfile-pinned development dependencies and installed Chromium, Firefox and WebKit; no dependency, plugin or skill installation was needed. Main, production records, hosting and merge controls were not modified.

Physical phone keyboards and native device behavior remain owner-only acceptance checks. This repair does not change localStorage's lack of compare-and-swap or provide isolation against noncooperating older copies.
