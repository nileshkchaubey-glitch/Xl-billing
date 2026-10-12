# Release 1 changed-file review

Compared `29aeb20225bccfc653b192651de608491185096c` with `aa34ef9e476d6256f48d7ead8d3870413b5d65c9` (original PR #5 audit scope). All 108 changed paths are accounted for below. No artifacts were deleted during this audit; the earlier brief requested evidence retention. The recommendation is to keep compact reproducible summaries and owner-guide illustrations, and use CI artifact retention for repeated raw output. The new review documents/tests are outside this original 108-file inventory.

| Category | Files | Bytes |
| --- | ---: | ---: |
| Source/tooling/documentation | 32 | 736539 |
| Generated evidence | 75 | 4588791 |
| Generated inventory | 1 | 63267 |

Every JSON was fully parsed, every log fully read, every PNG decoded. Source, config, tests and documentation were read; screenshot visual sampling is distinguished from decoding in the main review. SHA-256 values and source revisions in the new gate evidence bind results to the executable HTML.

| Path | Bytes | Classification | Review / disposition |
| --- | ---: | --- | --- |
| `.github/workflows/tests.yml` | 577 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `.gitignore` | 140 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `.nvmrc` | 3 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `README.md` | 3014 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `docs/ARCHITECTURE.md` | 1677 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `docs/ARCHITECTURE_BASELINE.md` | 32889 | Source/tooling/documentation | Generated but useful baseline map. Retain one pinned representation; it is syntactic, not a runtime call graph. |
| `docs/CHANGELOG.md` | 2887 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `docs/DECISIONS.md` | 3016 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `docs/ENVIRONMENT.md` | 1456 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `docs/KNOWN_LIMITATIONS.md` | 2090 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `docs/MIGRATION.md` | 1308 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `docs/MINOR_CHECKS.md` | 16472 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `docs/OWNER_GUIDE.md` | 1747 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `docs/OWNER_SMOKE_TEST.md` | 1769 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `docs/RISK_REGISTER.md` | 1674 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `docs/VERIFICATION.md` | 18642 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `index.html` | 552087 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `package-lock.json` | 69658 | Source/tooling/documentation | Retain deterministic dependency lock; 138 entries; development dependencies only. |
| `package.json` | 956 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `playwright.config.cjs` | 868 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `scripts/baseline.cjs` | 577 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `scripts/build.cjs` | 206 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `scripts/htmlcheck.cjs` | 584 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `scripts/inventory.cjs` | 3419 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `scripts/lint.cjs` | 953 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `scripts/mutations.cjs` | 1592 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `test-results/baseline.json` | 100960 | Generated evidence | Parsed browser report; {"startTime": "2026-10-12T04:54:46.191Z", "duration": 152281.984, "expected": 2, "skipped": 0, "unexpected": 13, "flaky": 0}. Replace with compact pinned summary. |
| `test-results/baseline.log` | 40554 | Generated evidence | Reviewed all 591 log lines; Error: expect(received).not.toMatch(expected) / 13 failed / 2 passed (2.5m). Move to CI artifacts. |
| `test-results/build.log` | 128 | Generated evidence | Reviewed all 5 log lines; Built dist/index.html: self-contained static copy; no runtime dependencies.. Move to CI artifacts. |
| `test-results/cross-browser-initial.log` | 1867 | Generated evidence | Reviewed all 30 log lines; Error: browserType.launch: / 1 failed / 1 passed (3.8s). Move to CI artifacts. |
| `test-results/e2e.json` | 75345 | Generated evidence | Parsed browser report; {"startTime": "2026-10-12T05:24:23.264Z", "duration": 51422.165, "expected": 66, "skipped": 0, "unexpected": 0, "flaky": 0}. Replace with compact pinned summary. |
| `test-results/fresh-checkout.log` | 24886 | Generated evidence | Reviewed all 258 log lines; 66 passed (51.4s) / ✖ 143 problems (0 errors, 143 warnings) / Built dist/index.html: self-contained static copy; no runtime dependencies.. Move to CI artifacts. |
| `test-results/html-validation.json` | 624526 | Generated evidence | Parsed diagnostic JSON; regenerate with the checked-in command. Move full output to CI artifacts. |
| `test-results/htmlcheck.log` | 138 | Generated evidence | Reviewed all 5 log lines; historical setup/debug evidence; no safety assertion result. Move to CI artifacts. |
| `test-results/legacy-qa.log` | 121 | Generated evidence | Reviewed all 1 log lines; PASS: parcel/open-box calculation, decimals, immediate totals, invalid inputs, legacy quantities, settings preservation.. Move to CI artifacts. |
| `test-results/lint.json` | 72792 | Generated evidence | Parsed diagnostic JSON; regenerate with the checked-in command. Move full output to CI artifacts. |
| `test-results/lint.log` | 15192 | Generated evidence | Reviewed all 152 log lines; ✖ 143 problems (0 errors, 143 warnings). Move to CI artifacts. |
| `test-results/mutation-B1.json` | 8463 | Generated evidence | Parsed browser report; {"startTime": "2026-10-12T05:12:21.502Z", "duration": 30753.983999999997, "expected": 0, "skipped": 0, "unexpected": 1, "flaky": 0}. Replace with compact pinned summary. |
| `test-results/mutation-B1.log` | 3316 | Generated evidence | Reviewed all 50 log lines; Error: locator.click: Test timeout of 30000ms exceeded. / 1 failed. Move to CI artifacts. |
| `test-results/mutation-B2.json` | 9188 | Generated evidence | Parsed browser report; {"startTime": "2026-10-12T05:12:52.895Z", "duration": 937.1419999999999, "expected": 0, "skipped": 0, "unexpected": 1, "flaky": 0}. Replace with compact pinned summary. |
| `test-results/mutation-B2.log` | 2568 | Generated evidence | Reviewed all 41 log lines; Error: page.evaluate: ReferenceError: isCancelled is not defined / 1 failed. Move to CI artifacts. |
| `test-results/mutation-B3.json` | 12503 | Generated evidence | Parsed browser report; {"startTime": "2026-10-12T05:12:54.489Z", "duration": 6417.85, "expected": 0, "skipped": 0, "unexpected": 1, "flaky": 0}. Replace with compact pinned summary. |
| `test-results/mutation-B3.log` | 4110 | Generated evidence | Reviewed all 40 log lines; Error: expect(locator).toBeVisible() failed / Error: element(s) not found / 1 failed. Move to CI artifacts. |
| `test-results/mutation-B4.json` | 17709 | Generated evidence | Parsed browser report; {"startTime": "2026-10-12T05:13:01.545Z", "duration": 1000.2920000000001, "expected": 0, "skipped": 0, "unexpected": 1, "flaky": 0}. Replace with compact pinned summary. |
| `test-results/mutation-B4.log` | 4906 | Generated evidence | Reviewed all 79 log lines; Error: expect(received).toEqual(expected) // deep equality / 1 failed. Move to CI artifacts. |
| `test-results/mutation-B5.json` | 9410 | Generated evidence | Parsed browser report; {"startTime": "2026-10-12T05:13:03.205Z", "duration": 1035.625, "expected": 0, "skipped": 0, "unexpected": 1, "flaky": 0}. Replace with compact pinned summary. |
| `test-results/mutation-B5.log` | 2599 | Generated evidence | Reviewed all 33 log lines; Error: expect(received).toBe(expected) // Object.is equality / 1 failed. Move to CI artifacts. |
| `test-results/mutations.log` | 231 | Generated evidence | Reviewed all 10 log lines; B3: CAUGHT; 1 failing test(s) / B4: CAUGHT; 1 failing test(s) / B5: CAUGHT; 1 failing test(s). Move to CI artifacts. |
| `test-results/p01-handlers-after.log` | 1415 | Generated evidence | Reviewed all 17 log lines; 9 passed (4.0s). Move to CI artifacts. |
| `test-results/p01-quoted-before.log` | 3077 | Generated evidence | Reviewed all 42 log lines; Error: expect(locator).toHaveValue(expected) failed / 1 failed. Move to CI artifacts. |
| `test-results/p01.log` | 1036 | Generated evidence | Reviewed all 14 log lines; 7 passed (3.0s). Move to CI artifacts. |
| `test-results/p02-firefox.log` | 150 | Generated evidence | Reviewed all 2 log lines; Error: http://127.0.0.1:4180 is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.. Move to CI artifacts. |
| `test-results/p03.log` | 466 | Generated evidence | Reviewed all 9 log lines; 2 passed (2.2s). Move to CI artifacts. |
| `test-results/p04.log` | 676 | Generated evidence | Reviewed all 11 log lines; 4 passed (2.0s). Move to CI artifacts. |
| `test-results/p05-single-after.log` | 462 | Generated evidence | Reviewed all 9 log lines; 1 passed (975ms). Move to CI artifacts. |
| `test-results/p05-single-before.log` | 3331 | Generated evidence | Reviewed all 61 log lines; Error: expect(received).toEqual(expected) // deep equality / 1 failed. Move to CI artifacts. |
| `test-results/p05.log` | 450 | Generated evidence | Reviewed all 9 log lines; 2 passed (1.3s). Move to CI artifacts. |
| `test-results/p114.log` | 319 | Generated evidence | Reviewed all 8 log lines; 1 passed (908ms). Move to CI artifacts. |
| `test-results/pin-scope.log` | 4287 | Generated evidence | Reviewed all 51 log lines; Error: expect(locator).toContainText(expected) failed / 1 failed / 7 passed (9.4s). Move to CI artifacts. |
| `test-results/release1-chromium.log` | 1980 | Generated evidence | Reviewed all 22 log lines; 15 passed (6.7s). Move to CI artifacts. |
| `test-results/release1-full.log` | 9486 | Generated evidence | Reviewed all 97 log lines; PASS: parcel/open-box calculation, decimals, immediate totals, invalid inputs, legacy quantities, settings preservation. / 66 passed (53.1s). Move to CI artifacts. |
| `test-results/screenshots/audit-log-1366.png` | 66801 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/audit-log-390.png` | 24342 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/screenshots/dashboard-1366.png` | 174470 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/dashboard-390.png` | 76619 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/screenshots/excel-connect-1366.png` | 136669 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/excel-connect-390.png` | 71451 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/screenshots/github-guide-1366.png` | 179993 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/github-guide-390.png` | 105189 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/screenshots/items-1366.png` | 78130 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/items-390.png` | 30218 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/screenshots/learn-1366.png` | 182568 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/learn-390.png` | 74855 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/screenshots/new-purchase-1366.png` | 89714 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/new-purchase-390.png` | 40208 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/screenshots/new-sale-1366.png` | 111111 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/new-sale-390.png` | 41344 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. Keep this owner-guide illustration or relocate and update its link. |
| `test-results/screenshots/parties-1366.png` | 87305 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/parties-390.png` | 33159 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/screenshots/payments-1366.png` | 175583 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/payments-390.png` | 86247 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/screenshots/prev-bills-1366.png` | 160978 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/prev-bills-390.png` | 66163 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/screenshots/pur-bulk-1366.png` | 147703 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/pur-bulk-390.png` | 64743 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/screenshots/pur-pay-1366.png` | 93896 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/pur-pay-390.png` | 44442 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/screenshots/purchase-list-1366.png` | 96818 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/purchase-list-390.png` | 50040 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/screenshots/reports-1366.png` | 104746 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/reports-390.png` | 54318 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/screenshots/retail-entry-1366.png` | 94962 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/retail-entry-390.png` | 52427 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/screenshots/sales-list-1366.png` | 189564 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. Keep this owner-guide illustration or relocate and update its link. |
| `test-results/screenshots/sales-list-390.png` | 61402 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/screenshots/settings-1366.png` | 88904 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/settings-390.png` | 37568 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/screenshots/txn-log-1366.png` | 180619 | Generated evidence | PNG decodes, 1366 x 768. Move to CI artifacts. |
| `test-results/screenshots/txn-log-390.png` | 74424 | Generated evidence | PNG decodes, 390 x 844. Move to CI artifacts. |
| `test-results/secret-scan.log` | 0 | Generated evidence | Reviewed all 0 log lines; historical setup/debug evidence; no safety assertion result. Move to CI artifacts. |
| `test-results/webkit-setup.log` | 451 | Generated evidence | Reviewed all 9 log lines; 1 passed (3.8s). Move to CI artifacts. |
| `test/baseline-inventory.json` | 63267 | Generated inventory | Parsed all function/handler/key entries; duplicates ARCHITECTURE_BASELINE.md. Regenerate instead of tracking both. |
| `test/e2e/hotfix.spec.cjs` | 11662 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `test/fixtures/shop.cjs` | 1373 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `test/server.cjs` | 402 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `test/unit/numbering.test.cjs` | 1175 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `test/unit/payment.test.cjs` | 1342 | Source/tooling/documentation | Retain; reviewed source or documentation. |
| `test/unit/source.test.cjs` | 324 | Source/tooling/documentation | Retain; reviewed source or documentation. |
