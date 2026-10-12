# Decisions

- Work in `codex/xl-release-1-hotfix`; never merge or deploy automatically. The current site is being used for real bills. A draft PR is the review boundary.
- The environment setup from the preceding request existed before this brief arrived. Restore the exact `29aeb20` HTML for baseline testing and tag that commit, rather than treating the earlier three-line cleanup as baseline.
- Keep the app as one self-contained HTML file. The development server is optional. Build copies the exact file; no runtime bundler, framework, CDN, hosting configuration or deployment workflow is introduced.
- Use only synthetic fixtures, browser profiles and screenshots. Do not access the owner's live localStorage or financial records.
- Salted SHA-256 uses WebCrypto; save a new non-default PIN on explicit first-delete action, without deleting the selected record. A legacy non-default PIN must be supplied before changing it. Normal page load does not change credentials.
- A PIN discourages accidental deletion; it does not provide protection from someone who can edit the device's localStorage.
- Payments and discounts cannot exceed the rounded remaining balance. There is no customer-advance/credit feature in this release. If an old record's paid value differs from its payment history, block further payment changes instead of guessing how to repair it.
- Keep original stored amounts intact. New payment amounts/balances use round2; this does not claim completion of the separate money normalization/migration item.
- Keep series prefixes; generated numbers scan existing records including cancellations and use saved previous-bill counters. Duplicate repair, import-wide deduplication, atomic counter writes and multi-tab numbering remain data-safety prerequisites.
- Use one page-size/sort state per list in memory. Do not persist view changes to business storage. Sorting and paging preserve full filtered totals.
- Move interpolated free-text event arguments to escaped data attributes. This fixes quoted-name click handlers but is not a complete XSS audit of HTML and printing.
- Run browser engines in isolated profiles. WebKit libraries were unavailable system-wide; download Debian packages into a temporary directory and copy their missing shared libraries into Playwright's browser-local bundle. The static dependency check cannot find libGLES there, so it is skipped only when that local fallback is detected. Actual WebKit launches and journeys run and must pass. CI uses the normal `playwright install --with-deps` path.
- Use the repository-local GitHub noreply commit email to respect the account's email privacy protection. Rewrite only these unpublished task commits before first push; never rewrite main.
- Retain the baseline tutorials, legacy wrappers and QA mobile file for the hotfix. Their cleanup belongs to Release 3 with characterization coverage.
- Do not label unimplemented later releases or incomplete acceptance criteria as finalized. Record each remaining item explicitly.
