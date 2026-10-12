# PM-07 printing repair

PM-07 is resolved for the tested software layouts. Short A5 invoices produce two complete copies on one A4 page. The application measures the actual printable content in an isolated, temporary document before choosing this layout. The cut line does not add height, and the two 148mm containers leave a 1mm page-rounding allowance. Both width and height must fit.

When the complete invoice does not fit a half page, a persistent notice in the invoice modal and a notice in the print preview explain that A4 layout will include every line and total. The output contains one complete copy with normal A4 pagination, repeated table headings and no fixed-height or hidden-overflow container. It does not pretend that a long invoice still fits two-up. A failed measurement visibly refuses printing; the existing A4 Print button remains available. A blocked popup also receives a visible error. These paths do not modify invoices, histories, settings or counters.

## Actual failure and passing evidence

The test commits precede the runtime repair. The expanded baseline run uses exact PR #9 application bytes at `5d3fb7991586d7acef84d49cdd26a003b290d912` (SHA-256 `37cb3c09b5d165768666d3ccefae9478b10f08a7dc20f1dcc219cad91e596933`) and retains the original four print assertions. Before the repair, Chromium produced **2 PASS, 5 FAIL, 0 harness errors**: a short two-copy invoice occupied two pages, the 40-line A5 geometry exposed only 12 complete lines, and the 80 wrapped-label PDF contained only nine distinct labels and no total or balance. The measurement-denial test still opened the old print window. [Before report](../test/pm07/before-chromium.json).

Runtime repair commit `c120ee2c365be87551ae07ffd9c1d2d7f991e917` has application SHA-256 `0e344a4e8d6618df1091ad2f33ae422739e1e050343195bc25170c7f1accfa52`. All seven probes passed on **Chromium, Firefox and WebKit: 21 PASS, 0 FAIL, 0 harness errors**. Reports bind the source hash and tested commit: [Chromium](../test/pm07/after-chromium.json), [Firefox](../test/pm07/after-firefox.json), [WebKit](../test/pm07/after-webkit.json).

| Probe | Passing evidence |
| --- | --- |
| Original A4, 1 and 40 lines | Every line remains present; A4 behavior preserved |
| Original A5, 1 line | Two complete copies, one A4 PDF page |
| Original A5, 40 lines | Complete A4 fallback, two PDF pages; all 40 distinct labels, TOTAL and BALANCE DUE extracted |
| Four-line A5, both copies | Eight label occurrences, two totals and two balances, one A4 PDF page |
| 80 wrapped long labels | Visible A4 fallback; all 80 distinct labels, total and balance extracted across three pages; no hidden overflow |
| Layout measurement denied | Zero print windows opened, visible refusal, exact storage bytes preserved |

[PDF evidence](../test/pm07/pdf-evidence.json) records PDF hashes, native extracted content and independent page counts. PDFs remain disposable test artifacts, not generated repository bundles. The original owner probes were not weakened. New probes check both copies, wrapped long content, visible fallback and a failed measurement. The new probes also compare original and final business/preference storage bytes.

Reproduction, using a distinct report directory for each engine:

```sh
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 \
LD_LIBRARY_PATH=/tmp/xl-browser-libs/root/usr/lib/x86_64-linux-gnu \
XL_PREMERGE_BROWSER=chromium \
XL_PREMERGE_ONLY=print-A4-1,print-A4-40,print-A5-1,print-A5-40,print-A5-two-copies,print-A5-wrapped-80,print-A5-measurement-refused \
XL_PREMERGE_REPORT=/tmp/xl-pm07-final/chromium/report.json \
node scripts/verify-premerge.cjs
```

Repeat with Firefox and WebKit. These standalone probes use ephemeral loopback servers and synthetic profiles and do not use the shared full-regression server. Lint passed with **0 errors and the original 143 warnings**. The build succeeded and `cmp index.html dist/index.html` confirmed the self-contained output.

## Tools and limitations

No runtime dependency, backend, plugin, paid service or additional skill was introduced. Existing Playwright 1.64.0 and the configured temporary Linux browser libraries were used. Native ELF binaries `/usr/bin/pdftotext` and `/usr/bin/pdfinfo`, both Poppler **25.03.0**, read actual generated Chromium PDF bytes; absolute paths avoid the managed PATH override of `pdfinfo`. The tests require official distribution Poppler utilities in CI, installed as `poppler-utils`. No production application component requires these development tools.

Chromium provides browser PDF generation. Firefox and WebKit passed complete-content, layout, fallback and failure assertions; native PDF generation in those engines was not exercised by this runner. Physical printers, browser print-dialog settings, mobile native print facilities and paper calibration remain **NOT VERIFIED**. The full combined regression and final exact-head CI belong to the parent integration verification; the scoped report does not claim those have already passed. No merge, deployment, main modification or real billing-data access occurred.

## Adversarial width and stored-text follow-up

Additional review found that both the existing normal A4 print and the new complete A4 fallback could still lose long unbroken text horizontally. A synthetic reference field was 1,500 characters long; the fallback body was 718 pixels wide while its scroll width exceeded 11,000 pixels. The native PDF lacked its endpoint. A stronger two-paper fixture included long unbroken address, bank, terms, notes and custom-field values. Both probes failed before repair, with exact stored bytes preserved. [Width before evidence](../test/pm07/width-before-chromium.json).

Printable text now wraps anywhere when necessary, and flex children can shrink. A scoped printable-content wrapper keeps the invoice header's metadata column readable while its shop/address column wraps. No hidden overflow or text truncation is introduced, and no stored text is rewritten. Runtime header/width repair `a8a01dd9f135b2c64af4b3c5b2b4fd13f35573e1` has source SHA-256 `ea65b50bd2bd9dbaf2222cad496a167dd25d868a3f66ee5f3fc14c21d66509a6`. The expanded nine-probe printing matrix passed all three engines: **27 PASS, 0 FAIL, 0 harness errors**. [Chromium width report](../test/pm07/width-after-chromium.json) and the Firefox/WebKit counterparts bind that source. Native raw glyph order checks all five beginning/end markers without interleaving neighboring columns, and separate native word coordinates must stay inside every physical PDF page. Strict browser width checks also remain mandatory; PDF text presence alone cannot certify visible output.

A separate adversarial review used capacity-boundary invoices, one exceptionally long wrapped row, large address/custom/notes/45-line terms, one unbroken reference and sequential different invoices. [Chromium edge review](../test/pm07/edge-review-chromium.json) and the Firefox/WebKit counterparts record actual observations at the header/width source above. Four through six lines fit two-up in all engines; seven fit in Chromium/WebKit and safely fell back in Firefox; eight safely fell back in all engines. Chromium PDFs remained one page at these boundaries. The oversized single-row PDF spans six pages and retains both endpoint labels and financial totals. The dynamic-fields PDF spans three pages and retains all four checked endpoints and totals. All tested half-page layouts remain unclipped, all fallback bodies remain within page width, and all printing operations preserve stored bytes. Viewing the next short invoice removes the previous fallback notice and restores two-up output. These are synthetic software observations, not a physical-printer certificate.

That review also confirmed **stored-text XSS** in the actual invoice view: raw packing-summary names/types and a fallback packing type created three executable image elements. A safe payload only toggled a synthetic window flag. It executed in the actual view and generated A4/A5 documents while the original stored records remained unchanged. [XSS before evidence](../test/pm07/xss-before-chromium.json) records the real failure, not an expected pass.

Runtime fix `193eb4f2d0a862d533504dea02ac55e5b2eb1b4c` changes exactly two render expressions: the complete packing-summary line and the fallback packing type pass through the existing HTML escaping function. Colour was already rendered using `textContent` and is independently checked as literal text. Intended static markup remains active; imported names/types/colours remain exact stored strings. The fix source SHA-256 is `2e0b6de76fedfed78b98ba702d61db50f4ebb790e608aa829b79f62b2636a978`.

The final ten-probe print/security matrix passed **30 cases across Chromium, Firefox and WebKit, with zero failures and zero harness errors**. [Chromium final scoped report](../test/pm07/xss-after-chromium.json), [Firefox](../test/pm07/xss-after-firefox.json) and [WebKit](../test/pm07/xss-after-webkit.json) verify no payload event execution, zero injected payload elements, all four payload strings rendered literally, total 80 and exact raw-byte preservation in the actual view and both generated print layouts. WebKit's first fixed-delay test observed colour before its existing asynchronous renderer had finished; test commit `381b402facfa356f1c2a0b2e77e0b59a2aed87c3` waits for that actual colour-render sentinel with a bounded timeout before running the same strict assertions. It does not change runtime bytes or turn a failed assertion into an expected pass. The final WebKit report binds that test commit and the same runtime hash as Chromium/Firefox.

Final scoped lint again passed with zero errors and the original 143 warnings; build and source/output equality passed. No additional dependency was installed. The parent integration must rerun its complete regression and exact-head CI after these newly confirmed fixes; results obtained before the XSS/width repair do not certify the final source. Physical printer/native mobile printing remains **NOT VERIFIED**.
