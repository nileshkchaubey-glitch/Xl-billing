# Repair test policy and retained failures

Authority: [owner repair assignment](https://github.com/nileshkchaubey-glitch/Xl-billing/pull/9#issuecomment-6128013121), based on reviewed commit `5d3fb7991586d7acef84d49cdd26a003b290d912`.

All original independent owner assertions remain active. The unsupported older-writer race and undefined party-opening-balance semantics remain individually reported failures until their actual requirements are resolved. No expected-failure conversion, silent skip or green gate claim is permitted.

One old safety assertion is corrected under an explicit owner domain decision: `cancelled-payment-ledger` previously required zero receipt entries after cancellation. The owner instructed: “Do not erase legitimate cash or automatically reinterpret old financial records.” The synthetic invoice has an actual Cash receipt of 20. The corrected assertion requires that receipt to remain 20 and that the cancelled invoice be excluded from active receivables. This strengthens the accounting checks instead of removing the receipt. Original failing results are preserved in `test/premerge/safety-*.json`; the independent `cancel-restore-accounting` test remains unchanged.

Three previously deferred view defects were repaired without changing their assertions: purchase sorting reads `billNo` through the existing selector contract and exposes sortable headers; audit search applies one filter before pagination and retains typing focus; the party detail controller includes its Transactions tab. Their fresh three-failure baseline is in `test/repairs/before/deferred-views-chromium.json`. Final source-bound verification will report these checks in every engine.

PM repairs and mobile navigation use synthetic fixtures only. Stored opening balances, discounts, invoice numbering and historical bytes are not rewritten to satisfy tests.
