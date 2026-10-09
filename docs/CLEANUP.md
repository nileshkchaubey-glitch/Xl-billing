# Source cleanup and refactor

Reviewed `main` at `fa371cd9197dc71f050a65cee05a4fdb223b02c9`. It contained one 527,359-byte HTML file and no separate stylesheet, modules or tests. The file had 15 script blocks and 9 style blocks, followed by successive override patches.

## Confirmed defects addressed

| Original defect | Replacement |
| --- | --- |
| `v6patch` contained unescaped nested template literals; its whole script failed parsing | Valid ES modules with a syntax check for every JS file |
| Global navigation and billing functions were repeatedly reassigned by later patches | One controller and one implementation of each domain operation |
| A rate-popup helper private to one closure was called from another patch | History rendered by the invoice component and handled through delegated actions |
| The last-party price badge contained escaped template expressions | Escaped, computed history output; tests cover backdated/cancelled bills and item identity |
| Last prices depended on array order/name matches | Date-based, party/unit/brand-aware lookup, indexed once per immutable workspace |
| Shell append commands leaked into the HTML | Minimal HTML shell; no patch script or command text |
| JSONBin whole-snapshot push/pull could overwrite newer device changes | PostgreSQL revision checks, row lock, safe retry operation IDs |
| The supplied Sheets example did not implement the reads the app expected | Optional authenticated reporting export, with the database as source |
| Frontend settings asked for integration master credentials | Publishable key + user JWT only; Google OAuth secrets remain in the function |
| Backup omitted activity history; spreadsheet exports dropped photos | Full JSON backup includes audit, photos, payments and unknown legacy fields |
| Fixed invoice grids and unrelated mobile selector patches caused overflow | Responsive invoice rows, phone cards, bottom navigation, sticky save actions |
| Partial escaping left user text unsafe in HTML | A shared HTML escape function and literal-safe CSV/Sheets exports |

The replacement removes the superseded patches, learning/tutorial content, inline styles/handlers, JSONBin integration and legacy unauthenticated Apps Script instructions. The old source remains available in Git history. Generated origins do not explain the defects; the observable cause was accumulated, conflicting patches.

## Workflow continuity

| Existing workflow | Current location |
| --- | --- |
| Wholesale bills, previous bills and bulk amount entries | Sale invoices → New sale / Bulk / previous bills |
| Supplier purchases and optional bill photos | Purchase bills → New purchase |
| Party balances and histories | Parties → Ledger |
| Receipt/payment-out and settlement discount | Payment in / Payment out → Record payment |
| Packing, brand, item movement and last rate | Invoice editor / Reports |
| Dispatch and undo dispatch | Bill details; status filters in Sale invoices |
| Cancellation and restoration | Bill details; Cancelled filter |
| Retail entries | Retail sales |
| Data export, JSON restore and Excel master import | Data & sync |
| Activity history | Activity log |
| Shop details, invoice defaults and print fields | Settings |

Records are archived or cancelled rather than hard-deleted. Existing amounts, opening balances, embedded payments, custom fields and unknown fields are migrated. Where old bills have a paid amount exceeding the recorded payment list, the difference becomes a labelled migration payment. Invalid dates, duplicate IDs and malformed datasets fail visibly; migration does not overwrite the original browser keys.

## Implementation choices

The frontend uses native ES modules and DOM event delegation, avoiding a framework/package migration during the data repair. Feature renderers are separate from financial rules and persistence. Large lists are paginated, reports paginate item totals, and historical price searches are indexed. These structural changes reduce repeated work; no device performance benchmark is claimed.

The Vyapar reference is the business workflow described in its [official sales/purchase overview](https://vyaparapp.in/free/sale-purchase-software) and [transaction reports documentation](https://vyaparapp.in/guides/how-to-check-transaction-reports-in-vyapar-app). This is an original responsive UI following that workflow, rather than a pixel reproduction or use of Vyapar assets.
