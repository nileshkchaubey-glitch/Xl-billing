# Stored vendor bill text in payment workflows

A stored vendor bill number could create executable markup in two active payment views: the `openPurPayModal` heading and the `poutLoadBills` table. The independent QA reproduction confirmed the first path on the integrated branch. A new test uses the real Purchase List Pay button and the Payment Out supplier autocomplete to confirm both paths. The payload only toggles a synthetic window flag; no secret, owner profile or real billing record is accessed.

Before the fix, both views inserted one payload image and executed its error handler. The original purchase remained total 500, paid 20 and balance 480, and all business/preference storage bytes remained unchanged. The test returned **0 PASS, 1 FAIL, 0 harness errors**. [Before evidence](../test/payment-security/before-chromium.json).

Test-first commit `9575de7` adds the failing owner probe `stored-purchase-payment-text-xss`. Runtime commit `e8132f32609d1047d6d3316cc5799e3ca3bd35a0` changes exactly two output expressions: both vendor bill references, including their existing ID fallback, pass through the existing `escHtml` function. It does not rewrite stored text, change purchase identities, perform a payment, alter PIN behavior or bypass storage validation. The payout identity/selection work is a separate coordinated change; this repair only escapes display text.

The payment-only bill-number template scan found the other active purchase/payment views already escaped their bill text. Transaction label builders keep plain strings and escape those strings when producing markup. This bounded scan does not claim formal verification of every unrelated HTML path.

Fix source SHA-256: `a7f74be6ff3bc197a0e3ceecff547c6dec29346cd0c0b2a25a6b998311d95a03`. All five focused probes passed on Chromium, Firefox and WebKit: **15 PASS, 0 FAIL, 0 harness errors**. [Chromium](../test/payment-security/after-chromium.json), [Firefox](../test/payment-security/after-firefox.json), [WebKit](../test/payment-security/after-webkit.json).

| Probe | Actual assertion |
| --- | --- |
| Stored purchase payment text | Both real payment views render the complete payload literally; zero injected elements and no handler execution; due 480 and exact raw bytes preserved |
| Real Payment Out | Existing cash 20 plus UPI 12.34 produces paid 32.34 and balance 467.66 |
| Real Purchase Payment | Total 125.50 equals paid 35.50 plus due 90; UPI histories reconcile |
| Edit and PIN reversal | Existing invoice edit, PIN setup/change/current-PIN reversal behavior remains intact |
| Previously repaired packing XSS | Actual invoice view and A4/A5 output still render all payload fields literally with no event execution |

Reproduction for each engine uses an ephemeral loopback server and a fresh synthetic browser context:

```sh
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 \
LD_LIBRARY_PATH=/tmp/xl-browser-libs/root/usr/lib/x86_64-linux-gnu \
XL_PREMERGE_BROWSER=chromium \
XL_PREMERGE_ONLY=stored-purchase-payment-text-xss,real-payment-out,real-purchase-payment,edit-reversal-pin,stored-print-text-xss \
XL_PREMERGE_REPORT=/tmp/xl-payment-xss-after/chromium/report.json \
node scripts/verify-premerge.cjs
```

Repeat with Firefox and WebKit. Lint passed with zero errors and the original 143 warnings. Build and source/output equality passed. No dependency, skill, plugin, paid service or backend was installed for this repair. The parent integration's complete regression and exact-head CI must run on the newly combined source before its merge-readiness decision. No merge, deployment, main modification or real business-data access occurred.
