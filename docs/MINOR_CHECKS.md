# Minor-check status at the hotfix checkpoint

This document records the earlier Release 1 checkpoint. Current Phase A/foundation status and evidence are in [FOUNDATION_REPORT.md](FOUNDATION_REPORT.md).

A passing limited test does not prove the complete checklist requirement. Remaining lines are explicit, not assumed.

| ID | Check | How verified / evidence or reason | Result |
| --- | --- | --- | --- |
| M1 | No stored amount has more than 2 decimals. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| M2 | Displayed == stored == printed == exported (CSV/Excel keep raw numbers). | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| M3 | Large values format correctly in en-IN (₹12,34,567.50) in all places. | Sales summary en-IN INR formatting checked; every UI/export/print surface not verified | PARTIAL |
| M4 | Amount in words correct for 0, 1, 99, 100, 1,000, 1,00,000, 1,23,45,678.50 and paise. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| M5 | Discount greater than subtotal is blocked. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| M6 | Tax on discounted value is consistent between form, saved record, print and reports. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| M7 | Round-off line appears only when enabled and is included in totals/reports. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| M8 | Qty with decimals (kg, litre) works; qty of pieces rejects fractions only if the unit says so. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| M9 | Packs x qty multiplication never changes legacy saved quantities (existing QA script keeps passing). | Existing VM QA: legacy quantities, parcel multiplication and decimals; legacy-qa.log | VERIFIED |
| M10 | Negative numbers can't be typed or pasted into amount fields. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| M11 | `0` rate allowed only with a confirmation ("free item"). | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| D1 | "Today" correct in IST at 00:30 and 23:50. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| D2 | Month/FY boundaries (31 Mar -> 1 Apr, month end) for dashboard/reports/numbering. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| D3 | Date display `dd/mm/yyyy` everywhere; date inputs submit ISO. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| D4 | Filters inclusive of both ends. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| D5 | Backup file names use local time. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| D6 | Invalid/impossible dates rejected. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| D7 | Due date logic and overdue badges use local time. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| T1 | Hindi/Gujarati/emoji text in party/item names saves, searches, prints, exports (CSV opens correctly in Excel: UTF-8 BOM). | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| T2 | Search is case-insensitive, trims spaces, ignores multiple spaces. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| T3 | Long names don't break layouts or print. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| T4 | Every user-visible message is clear English, no raw error text, no "undefined"/"NaN"/"[object Object]" anywhere (scan every page's text). | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| T5 | Consistent terminology (Invoice vs Bill, Party vs Customer). | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| F1 | Required fields marked and validated. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| F2 | Autofocus on page open. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| F3 | Enter/Tab behaviour consistent. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| F4 | Mouse-wheel never changes number fields. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| F5 | Paste of "1,234.50" and "₹ 1234" handled. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| F6 | Reset/Cancel never leaves stale state (edit banner, hidden ids, party-id). | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| F7 | Typing a party name that doesn't exist offers "Add new" and fills phone prompt; hidden party id cleared when the name is edited after selection. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| F8 | Selecting an autocomplete entry by mouse and keyboard behaves the same. | Quoted-party mouse selection verified; comprehensive keyboard characterization not completed | PARTIAL |
| F9 | Row delete/reorder keeps totals right. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| F10 | Unsaved-changes prompt works and does not fire after a successful save. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| L1 | Pagination, sorting, filters, search combine correctly. | 1,200 sales reachability, seven-list size/sort controls; all combinations not tested | PARTIAL |
| L2 | Totals over all filtered rows. | Sales summary verified independently at 1,200 invoices; report-wide reconciliation pending | PARTIAL |
| L3 | Cancelled/deleted excluded or clearly marked consistently. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| L4 | Empty states. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| L5 | CSV export row counts == list counts, quoting of commas/quotes/newlines correct, formulas starting with `=+-@` are neutralized (CSV injection). | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| L6 | Reports date filters work and persist while on the page. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| L7 | Party ledger closing balance == outstanding report == dashboard. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| P1 | A4/A5 fit one page for <= 15 lines; multi-page headers repeat. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| P2 | No popup-blocker dependence. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| P3 | Print settings respected. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| P4 | Cancelled invoices print with a "CANCELLED" watermark or are blocked. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| P5 | PDF name sanitized. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| P6 | Print preview matches on-screen invoice. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| P7 | Shop logo/UPI QR optional and absent cleanly. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| I1 | `paid == sum(payments.amount)`. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| I2 | `balance == round2(total - paid)`, `0 <= paid <= total`. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| I3 | Invoice numbers unique per series, never reused. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| I4 | Every `partyId`/`itemId` resolves or the record is archived. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| I5 | Audit log has an entry for every create/edit/cancel/delete/restore/payment. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| I6 | Counts after backup->restore identical. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| I7 | No collection contains duplicate ids. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| I8 | Soft-deleted records excluded everywhere. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| I9 | Stock (if enabled) == opening + in - out for each item. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| I10 | No record has `NaN`, `Infinity`, `null` in a numeric field. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| S1 | Quota failure is loud and lossless. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| S2 | Storage meter accurate within 5%. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| S3 | `storage.persist()` result shown. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| S4 | Backup includes every `shop4_*` key and a valid checksum. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| S5 | Restore preview counts correct; pre-restore snapshot downloaded. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| S6 | Corrupt/truncated/huge/non-JSON/wrong-schema files rejected with no changes. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| S7 | Auto-backup folder permission lifecycle (granted, revoked, folder deleted) handled. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| S8 | Backup reminder escalation timings. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| S9 | Two tabs open: stale save blocked. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| S10 | URL/origin change warning ("No data found on this address - restore a backup"). | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| X1 | XSS payload suite passes everywhere (UI, print, CSV preview, imported backup). | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| X2 | PIN is hashed; default PIN forced to change; settings change requires old PIN. | PIN setup/hash/default rejection tested; old-PIN changes and full settings policy need more coverage | PARTIAL |
| X3 | No network request is made by default (Playwright `page.on('request')` assertion: only the page itself). | Offline file-origin test in three engines sees no outgoing HTTP requests; optional sync configurations not tested | PARTIAL |
| X4 | CSP present and doesn't break features. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| X5 | Secrets excluded from backups/exports/audit. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| X6 | `rel="noopener noreferrer"` on every external link. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| X7 | No `eval`/`new Function`/`document.write` in app code (print iframe uses safe DOM APIs). | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| X8 | Third-party endpoints (Sheets, JSONBin) are opt-in with explicit warning. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| R1 | Budgets at 5,000 invoices (Chromium, throttled 4x CPU): page render <= 100 ms, search keystroke <= 50 ms, save <= 150 ms, dashboard <= 150 ms, reports <= 300 ms, cold load <= 1.5 s. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| R2 | 20,000-invoice stress doesn't freeze the UI (>50 ms long tasks reported). | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| R3 | No layout thrash on item-row typing; no full re-render of the item table on every keystroke (focus is preserved). | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| A1 | All inputs have labels; modals have role=dialog, aria-modal, focus trap, return focus. | PIN dialog labels, role, modal state, focus cycle and Escape are tested; other modals not audited | PARTIAL |
| A2 | Colour contrast >= 4.5:1 for text. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| A3 | Everything operable by keyboard. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| A4 | axe-core run on every page: zero serious/critical violations. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| A5 | Zoom 200% usable. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| C1 | Chromium, Firefox, WebKit (Playwright) green. | 66 hotfix/characterization browser tests green; the whole requested journey inventory is incomplete | PARTIAL |
| C2 | Windows Chrome at 1366x768 and 1920x1080; Android Chrome 360-414 px; iOS Safari. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| C3 | Works from `file://` and from the GitHub Pages URL. | file:// offline startup passes in three engines; the live GitHub Pages app was not upgraded/tested | PARTIAL |
| C4 | Works offline after first load (P2-5). | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
| H1 | `npm ci && npm test` works from a clean clone. | Fresh detached checkout: npm ci, 66 browser tests + unit/legacy QA, lint and build pass; fresh-checkout.log | VERIFIED |
| H2 | README with: purpose, how to run, test, build, deploy, backup/restore, architecture, shortcuts. | README covers setup/build/testing and backup cautions; complete shortcut redesign and deploy rehearsal out of scope | PARTIAL |
| H3 | `docs/OWNER_GUIDE.md` in very simple English with screenshots (daily routine: open app, enter bills, end-of-day backup). | OWNER_GUIDE has synthetic desktop/mobile screenshots; data-safety workflow still incomplete | PARTIAL |
| H4 | `CHANGELOG.md` with every change. | docs/CHANGELOG.md lists each delivered work item and removals | VERIFIED |
| H5 | License/secret scan clean (gitleaks-style grep). | Targeted credential-pattern scan returns no matches; no full gitleaks/license audit | PARTIAL |
| H6 | No console errors/warnings in any flow. | Seeded page/report crawl records no pageerror/console.error; all flows and warnings not inventoried | PARTIAL |
| H7 | Git tags per release: `v1.0.0-hotfix`, `v1.1.0-data-safety`, `v2.0.0-clean`, `v2.1.0-features`. | Not covered by this hotfix; relevant later release/acceptance tests remain pending. | NOT VERIFIED |
