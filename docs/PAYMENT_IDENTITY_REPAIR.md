# Confirmed cross-party payment corruption repair

Independent QA found two blocking accounting defects after the reporting repairs. The settlement modal correctly showed one stable party ID, but its discount writer still selected a record using `partyId OR partyName`. A different customer with the same name could receive the discount. Payment Out used the same name fallback while loading supplier bills, so its FIFO allocation could pay a different same-name supplier. These were real application UI failures with synthetic records, not hypothetical concerns.

## Completed fixes

- `openSettlementModal` reviews only invoices associated with the explicit stable party ID. Unlinked histories are not assigned a master from matching text; the UI directs the owner to review/pay individual bills.
- `poutLoadBills` reviews only active bills belonging to the explicitly selected supplier ID. The autocomplete clears the old ID, bill list and review evidence whenever its text is edited.
- Each modal has an immutable review containing selected record IDs and their complete serialized record values. Before applying any allocation, `financialReviewRecords` verifies unique current IDs, the same stable party association, active status, valid and consistent accounting state, and exact matching record values.
- The settlement discount candidate comes only from the validated modal records, after subtracting that same operation's proposed allocations in paise. It cannot select an unrelated same-name record.
- Each save captures its review token before entering the asynchronous storage transaction. Replacing the modal/review, including reopening the same party, invalidates the pending save. The writer also requires its modal to remain open and its allocation fields to belong to that modal.

No historical customer/supplier association, opening receipt, refund, or financial record is invented. Invalid or stale reviews produce a visible error before invoice/purchase/audit storage writes. Current Delete PIN behavior, numbering, existing payment/discount fields, backup formats and storage recovery remain unchanged.

## Test-first evidence

`scripts/verify-payment-identity.cjs` uses disposable synthetic contexts, isolated localhost servers, blocked external requests and a fixed Asia/Kolkata business clock. It exercises real settlement and Payment Out UI controls, including actual Save button dispatch.

| Stage | Evidence | Result |
| --- | --- | --- |
| Before repair, unchanged `40a0d7a` application | `test/payment-identity/before-chromium.json` | 0 PASS, 10 FAIL, 0 harness errors |
| Settlement repaired, supplier writer still incomplete | `test/payment-identity/after-settlement-chromium.json` | 5 PASS, 5 FAIL, 0 harness errors |
| Both writers repaired | `test/payment-identity/after-payment-out-chromium.json` | 10 PASS, 0 FAIL, 0 harness errors |
| Exact final subtask runtime, Chromium / Firefox / WebKit | `test/payment-identity/after-final-{chromium,firefox,webkit}.json` | 10 PASS per engine, 0 FAIL, 0 harness errors |

The ten probes cover discount-only settlement, combined payment plus discount, record reassignment, concurrent valid receipt changes, same-party modal replacement after Save dispatch, same-name supplier FIFO selection, edited supplier autocomplete text, supplier bill reassignment/history changes, and supplier review replacement after Save dispatch. Positive payments verify the other party's complete record remains identical and reconcile the selected bill's paid/balance amounts. Failed operations verify exact storage bytes immediately before versus after the attempted save.

Some stale-record probes intentionally commit a valid synthetic cooperating change *before* attempting the stale save. Their outer `bytes_preserved` compares against the original seeded fixture and therefore is false; `observed.preserved` compares the attempted save's actual before/after snapshots and must be true for PASS. No failure is converted to an expected pass. Controlled event-loop review replacements test the application's asynchronous review binding; they do not claim isolation from unsupported older writers.

The final 30 identity checks and 18 normal owner regression checks tested exact test commit `c30b600018e3fbcea1eede57cbf123e0283488a1`. Its application is unchanged from runtime commit `76847d17c6364aa68a7b894f644128e71d7fb691`, with SHA-256 `f43b8efd20923da5101ee38724a7b29f36a92b6259f22ebc9ed59b63149dbe56`. JSON files retain commit, application and runner hashes, engine, expected behavior and observed values. The final full integrated branch must be verified separately.

## Additional regression results and unresolved verification

Six unchanged owner assertions were also run per engine: real supplier payment out, historical opening receipt/discount settlement, cancellation/restore, cash classification, legacy item amounts and signed opening receivables. Chromium and WebKit passed 6/6. Firefox passed 5/6; `party-opening-ledger` captured an empty `party_stats` array immediately after clicking Detail. It did not capture an incorrect financial value. This original failure is preserved in `test/payment-identity/normal-owner-firefox.json`; it is not retrospectively marked passed. Test-only commit `c30b600` adds bounded waits for the visible party modal, visible statistic and four populated statistic elements before the unchanged 185 assertion. It does not force rendering or mock an application function. After that synchronization correction, all six normal owner checks passed in every engine (18 PASS), documented in `test/payment-identity/normal-owner-after-wait-{chromium,firefox,webkit}.json`. The 30 identity checks were also rerun and passed on the same exact test commit and application source. Full integrated verification is still required.

Lint passed with zero errors and 143 existing warnings. The self-contained static build passed. Existing Node v24.19.0 and Playwright 1.64.0 were sufficient; no dependency, skill, plugin, backend or paid service was installed.

Explicit unlinked-bill party settlement, opening-balance allocation, supplier purchase-payable netting and refund records remain unimplemented. Individual invoice/purchase payment workflows remain available by unique bill ID. Reproduce the identity probes with `XL_PAYMENT_IDENTITY_BROWSER=chromium|firefox|webkit node scripts/verify-payment-identity.cjs`. A stale review requires reopening/reselection; the app does not silently reinterpret unseen changes. No real data, main branch, deployment or merge was touched.
