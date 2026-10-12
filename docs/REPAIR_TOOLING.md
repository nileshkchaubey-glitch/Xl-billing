# Repair tooling and installation record

Authority: [owner tool authorization #6128158502](https://github.com/nileshkchaubey-glitch/Xl-billing/pull/9#issuecomment-6128158502). All tooling is limited to isolated cloud development and synthetic CI profiles. No production installation, paid account, additional account permission, real-record access or mandatory runtime service is required.

## Existing tools reused

| Tool | Observed version / source | Purpose and implications |
| --- | --- | --- |
| Node / npm | 24.19.0 / 11.9.0, managed image | Node fixtures, financial/property tests and reproducible package-lock installs. Development only. |
| Playwright | 1.64.0, npm lockfile with registry integrity | Real browser UI, failure injection, touch navigation, focus/ARIA and offline checks. No new package installation in the repair workspace. |
| Browser engines | Chromium 156.0.8078.4 revision 1248; Firefox 157.0 revision 1555; WebKit 27.2 revision 2370 | Pinned by Playwright `browsers.json`; actual disposable launches verified. These are synthetic automation engines, not actual owner phones. |
| fast-check | 4.10.2, npm lockfile | Property and accounting checks, development only. |
| ESLint / Acorn / Vite | 10.12.0 / 8.19.0 / 8.3.4, npm lockfile | Existing lint, script parsing and standalone build. Build does not certify all HTML/accessibility. |
| Poppler | Native `/usr/bin/pdftotext` and `/usr/bin/pdfinfo`, 25.03.0 | Inspect actual generated PDF text and pages. Use absolute paths: the managed PATH contains a separate `pdfinfo` override. No physical printer certification. |
| OpenSSL | 3.5.7, managed image | Ephemeral loopback TLS for same-origin upgrade tests. Temporary synthetic keys are deleted. |
| Cloud environment runtime skill | Installed skill, read without installing another plugin | Confirm enforced network policy/readiness; never read credential values. No additional account connection. |

Other direct packages remain locked and unchanged: `@eslint/js` 10.0.1, `acorn-walk` 8.3.5, `globals` 17.13.0 and `html-validate` 11.16.2. Package sources are the npm registry, recorded with integrity hashes in `package-lock.json`.

The inherited temporary browser library fallback is documented in [ENVIRONMENT.md](ENVIRONMENT.md). Actual launches and functional checks are required; skipped static host validation is not proof of browser functionality. The repair does not ship those libraries or add a runtime dependency.

## CI preparation

Existing CI uses `npm ci` and the lockfile-pinned Playwright installer with official browser distributions/system packages. PDF verification additionally checks for the native Poppler utilities; if absent it installs `poppler-utils` through the runner's configured official Ubuntu package repository. The workflow records `dpkg-query` version and native utility versions in its logs. The distribution package is matched to the Ubuntu runner rather than an unavailable cross-distribution exact version; its observed version is retained in final CI evidence. No remote shell installer is used.

No additional skill, plugin, npm dependency or browser was installed locally for these repairs. Reusing the already available tools avoids changing the application data model or offline contract. Any CI installation result is reported separately from local reuse in the final verification report.
