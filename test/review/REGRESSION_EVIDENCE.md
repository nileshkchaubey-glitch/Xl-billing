# Existing regression coverage rerun during the audit

Executed on the unchanged PR #5 HTML, original head `aa34ef9e476d6256f48d7ead8d3870413b5d65c9`. All records/profiles were synthetic.

HTML SHA-256: `2b8a3fcd530c3ad2022f4a3e4e2536c0959e32270c6bbf21ca4eee722b257c3c`.

Command:

```sh
XL_REPORT=/tmp/xl-audit-existing-suite.json npm test -- --grep-invert 'visual evidence'
npm run lint
npm run build
```

Actual output excerpt:

```text
PASS: parcel/open-box calculation, decimals, immediate totals, invalid inputs, legacy quantities, settings preservation.
✔ P0-5 case-insensitive numbers include cancelled records and scan maximum (0.984848ms)
✔ P0-5 two batches and stale counters cannot generate duplicates (seed 20261012) (23.407242ms)
✔ P0-4 random payments and replacements preserve paid and balance (seed 20261012) (131.090906ms)
✔ all embedded scripts parse without compilation errors (8.524301ms)
ℹ tests 4
ℹ pass 4
ℹ fail 0
63 passed (52.6s)
143 problems (0 errors, 143 warnings)
Built dist/index.html: self-contained static copy; no runtime dependencies.
```

Playwright report statistics: `{"duration": 52595.965, "expected": 63, "flaky": 0, "skipped": 0, "startTime": "2026-10-12T06:44:59.761Z", "unexpected": 0}`. Build HTML is byte-identical to the source. The capture-only case was excluded in every engine: 21 functional cases x 3 engines = 63. This leaves the earlier 38 screenshots and pinned raw artifacts untouched. The four unit/property cases and preserved VM QA also passed.

The independent safety gate reports **3 passes, 24 failures, zero harness errors per engine**, exits 1, and blocks Release 2. A normal regression pass is not a safety approval. Full original and pre-P0-4 targeted comparisons are included alongside the three current-engine JSON reports. There are no physical-device, printer, physical-crash or successful recovery guarantees.
