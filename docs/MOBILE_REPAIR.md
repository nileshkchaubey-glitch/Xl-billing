# Mobile workflow reachability repair

This follow-up starts from PR #9 commit `5d3fb7991586d7acef84d49cdd26a003b290d912`. Its scope is the owner-required mobile workflow repair. No business records, storage formats, PIN rules, numbering rules or desktop workflow handlers are changed.

## Failure evidence

The original independent owner probe `mobile-workflow-reachability-390` failed: New Purchase, Previous Bills, Items, Parties and Payment Ledger were all unreachable through visible mobile navigation. The desktop counterpart passed. The probe remains unchanged in `scripts/verify-premerge.cjs`.

Before implementation, the new independent `scripts/verify-mobile.cjs` gate produced one desktop pass, four mobile failures and zero harness errors in Chromium. The failures establish that the mobile workflow entrypoints did not exist. Baseline application SHA-256: `37cb3c09b5d165768666d3ccefae9478b10f08a7dc20f1dcc219cad91e596933`.

## Implementation

Home now has a visible mobile-only Business workflows panel. Native buttons reach all 14 sidebar page workflows, including purchases, historical bills, masters, payment ledgers, transactions and data tools. Payment In and Payment Out open their existing modal workflows directly. The five existing bottom navigation destinations remain in place and use native buttons with active `aria-current` state, keyboard focus outlines, 48-pixel minimum control height and safe-area spacing. Desktop sidebar navigation remains available. Navigation controls are hidden when printing.

The shortcut panel has two flexible columns with wrapping labels. No extra runtime library, backend, service, plugin or paid dependency was added. It continues to work within the self-contained offline HTML application.

## Verification

The focused synthetic browser gate passes five cases in each of Chromium, Firefox and WebKit: 15 passes, zero failures and zero harness errors. Application SHA-256 for these tests: `ea72b13c0547902f6687ebb1a4c43bcb0c18824c1bb2a0d9ff138c2fcd689e90`.

| Case | Evidence |
| --- | --- |
| Real touch navigation at 390 pixels | Every one of the 14 Home page shortcuts is visible, has at least a 44-pixel measured touch target, and opens the corresponding real page through `tap()`. Navigation preserves stored business bytes. |
| Payment In and Payment Out at 390 pixels | Existing modals receive focus; a synthetic cash receipt changes invoice paid/due from 20/80 to 25/75; a synthetic supplier payment changes purchase paid/due from 20/480 to 30/470. Both use the real Save controls. |
| Keyboard navigation at 390 pixels | Tab reaches the next workflow button; Enter and Space open purchase/item pages; Home retains an accurate active ARIA state. No business bytes change. |
| Navigation layout at 320 pixels | All shortcut controls fit within the viewport, meet the minimum measured touch size and have no panel horizontal overflow. Both navigation regions are hidden in print media. |
| Desktop at 1366 pixels | The mobile shortcuts and bottom bar stay hidden; the existing sidebar reaches the five required workflows. |

Run the focused gate once per browser:

```sh
XL_MOBILE_BROWSER=chromium node scripts/verify-mobile.cjs
XL_MOBILE_BROWSER=firefox node scripts/verify-mobile.cjs
XL_MOBILE_BROWSER=webkit node scripts/verify-mobile.cjs
```

Each invocation starts its own ephemeral loopback server and disposable synthetic profile, blocks external network requests and writes source/runner hashes, commit identity and observations into `test-results/mobile/<browser>.json`. It also captures the synthetic Home viewport. The runner never visits a deployed site or uses a real browser profile. Before/after investigation evidence is available in `/tmp/xl-mobile-before` and `/tmp/xl-mobile-after` in the isolated workspace; final integrated CI should retain its source-bound artifacts.

`npm run lint` passes with zero errors and 143 inherited warnings. `npm run build` produces the self-contained static HTML copy. The complete integrated regression run remains the responsibility of the final verification gate after these changes are combined with the other repairs.

## Remaining limits

These are browser touch and keyboard simulations, not verification on physical Android/iOS devices or their native keyboards, download dialogs or print dialogs. The layout check covers the new navigation panel; it does not certify every inherited form/table layout on every screen size. There is no new menu with separate focus-trap behavior. Physical safe-area behavior still requires owner device checks. These limits do not hide failures from either independent gate.
