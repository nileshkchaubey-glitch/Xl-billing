# Asia/Kolkata Business Calendar Acceptance

The self-contained application now configures the business calendar explicitly as
`Asia/Kolkata` through `BUSINESS_TIME_ZONE`. It uses `Intl.DateTimeFormat` with an
explicit timezone, calendar and numbering system, so the device timezone cannot
change a business date. There is no remote time service or runtime dependency.

Business-date defaults, both dashboard current-month calculations, startup month
bounds and both outstanding-aging overrides use the same calendar. October 2026
bounds are `2026-10-01` and `2026-10-31`. Aging measures calendar-day differences;
unsupported historical dates are not normalized into another date. The sales
list continues to show all dates initially, as established by its existing v16
workflow; manually selected month bounds remain inclusive.

Fresh unsaved settings derive the displayed financial year using the existing
April-to-March convention. Saved financial year, invoice prefix, counters and
invoice numbering logic are unchanged, including at April and January boundaries.
This change does not introduce financial-year resets or numbering series rules.

Audit and `createdAt` timestamps remain UTC ISO timestamps. Newly created quick
parties now also receive UTC `createdAt`; historical date-only fields remain
unchanged. Audit presentation and cancellation timeline dates use the business
timezone without changing their stored UTC timestamps. Startup does not migrate
or rewrite historical records.

## Test Evidence

Before implementation, the four new Node acceptance tests failed because the
application had no explicit business calendar helpers. Real **New Invoice →
Save** at 00:30 IST stored `2026-09-30` instead of `2026-10-01` in Chromium with
Asia/Kolkata, America/Los_Angeles and Pacific/Auckland device timezones. The
October dashboard counted September (`₹100.00` instead of `₹200.00`). A historical
August 31 invoice appeared as 30 days old instead of 31 on October 1 IST.

After implementation, all 44 existing Node tests and the four new calendar tests
passed. Sixty browser acceptance cases passed: 20 each in Chromium, Firefox and
WebKit. The source-bound, compact results are in
[`test/review/business-date-evidence.json`](../test/review/business-date-evidence.json).

Browser cases save invoices through the real navigation and Save button at
00:30 and 23:30 IST, March 31 / April 1 and December 31 / January 1, each with
three device timezones. They verify stored dates, UTC timestamps, unchanged
numbering and saved financial year, purchase month bounds, retail/purchase dates,
inclusive October filters and current-month dashboard totals. Additional cases
verify calendar aging, supplier/settlement/payment-out/bulk date defaults,
UTC quick-party timestamps and preservation of historical bytes. All data was
synthetic in fresh browser contexts against loopback servers.

The parcel-entry VM check passed. Lint reported zero errors and 143 warnings.
The complete browser regression suite will be reported independently by the
follow-up PR; this report claims only the calendar acceptance cases above.

## Limits

Asia/Kolkata is the explicit configured business timezone; this change does not
add a timezone-selection UI. Business dates rely on the device clock providing
an accurate instant. Historical unsupported dates are preserved and are not
automatically repaired. Existing report-policy limitations are separate from
the calendar corrections.
