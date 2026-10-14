# Plan A2 — JSONBin quarantine verification

Date: 2026-10-14 (Asia/Kolkata). Status: **local A2 acceptance passed; exact-head provenance, independent final review and CI are separate final gates recorded in the Draft PR. No release or merge approval.**

Authorization: [Issue 19](https://github.com/nileshkchaubey-glitch/Xl-billing/issues/19). Base main: `ed583b697ea1ebdb6041c30f76fa4984c972f713`. All issue text, comments (none at first read), Plan A inventory/risk/backlog/test/diagnostic contracts and A1a/A1b evidence were read before implementation. Coordinator owns repository edits and commits; separate agents audit source, security/privacy and QA.

## Scope and behavior

The three original `cloudPush`, `cloudPull` and `createNewBin` bodies are replaced in place with storage-independent fixed-text refusal. Direct calls return `false`; no settings/credentials, confirmation, provider request, storage write, audit or reload is required. Native disabled buttons and a polite live status replace setup/success guidance. The cloud-specific credential inputs and load/save wrapper are removed; no stored credentials are deleted, trimmed or rotated.

Google Apps Script remains active and unchanged. Its winning Push uploads settings including preserved credentials; its Pull can overwrite matching master fields and add audit records. Both UI and this report explicitly identify that remaining risk. This change does not implement Google Drive integration or claim all cloud sync is disabled.

## Evidence contract

Original [A1a manifest](../qa/plan-a/baseline-source.json) remains unchanged against Git commit `3855c6a`. The original full-index hash `d5fbcd1a47a5bf6e8d2ec735b561f46108e3c905878ba301acd322040b52b70a` is retained, not regenerated. Default A1a/A1b modes still reject a changed index. Explicit `--runtime-revision qa/plan-a2/runtime-revision.json` authorizes only this Issue 19 revision and checks immutable base bytes, four bounded source regions, exact candidate bytes and unchanged code outside those regions. Only the A1b VM entry hash gate gains that explicit mode; its 14 diagnostic groups and standalone page are unchanged. Both backup scripts remain byte-identical. The remaining 14 original files and six original QA scripts retain their original pins. This is a diff/provenance guard, not a security sandbox.

Candidate index SHA-256: `4e1e6bdb46d8a42a51e4c60da107514c2b3de7146ad4d3f862840af6e9e52d7d`. Exact final commit, source/test hashes, clean/dirty state and actual outcomes come from per-head machine evidence.

## Actual before evidence

- On base main, the six original QA, 15 fixture groups, 14 evidence-runner controls and 14 A1b VM diagnostic groups passed. These are snippet/synthetic checks.
- Independent ordinary Chromium/Firefox startup with complete synthetic settings, current version and stable historical records initialized final wrappers without requests, page errors or startup writes.
- Each of the three original JSONBin globals attempted one JSONBin request in both engines with populated synthetic credentials. All six attempts were intercepted and aborted before provider contact. The new isolated quarantine suite initially exited 1 with 30 failing assertions out of 40; it now passes 40.
- A post-implementation replay of immutable base HTML through the final hardened quarantine suite also exits 1: 33 of 40 assertions fail. The additional failures reflect stricter hostile-DOM forbidden-access checks, not a different baseline. Replay evidence is separate from the original test-first observation.

## Candidate acceptance

Local candidate results are listed below. The final clean-head rerun, CI URLs/artifact verification and independent exact-head verdict are recorded in the Draft PR after this document's commit. This document does not substitute local results for those final gates.

| Gate | Actual local result |
| --- | --- |
| Original six QA scripts, explicit A2 revision | 6 passed |
| Historical synthetic fixture groups | 15 passed |
| Original evidence-runner controls | 14 passed |
| Read-only diagnostics VM groups | 14 passed |
| A2 revision validation controls | 11 passed |
| JSONBin quarantine VM/static assertions | 40 passed |
| Full ordinary application A2 browser gates | 27 passed across Chromium, Firefox and WebKit |
| Existing A1b browser diagnostics | 9 passed across the three engines |
| Independent real invoice, receipt and print UI smoke | 18 passed: three stages on base and candidate in each engine |

The full-script browser run separately records three `OBSERVED_UNSAFE_STARTUP` results for existing migration writes with missing-version historical fixtures. They are unresolved observations, excluded from the 27 acceptance passes. No external request or page error occurred in the passing full-script run.

Earlier browser failures are retained outside the repository: the backup test initially selected a Settings file input that does not exist; it now uses the real sidebar import input. Independent billing smoke initially raced the application's existing delayed focus timers in Firefox. A later full rerun failed on Firefox baseline, and an instrumented repeat failed on WebKit candidate at Item autocomplete selection. Independent tracing identified the existing V13 missing-phone prompt: it steals focus 80ms after party selection, during fast item entry. The final harness preserves that missing-phone fixture, waits for the actual quick-phone focus callback, then fills/selects the item once. No forced click, input retry, billing function stub or financial source change is used. Failed matrix runs remain failures, separate from passing synchronized runs. The committed billing harness enforces a nonzero exit on any failed stage, browser error or external request.

The A1b default entry hash gate also failed on changed A2 HTML as designed. Its newly explicit authorized mode passes all 14 diagnostic groups; neither the original hash nor any diagnostic assertion was changed to make it pass. All browser scenarios now fail on any page error or attempted external request, including separately labelled startup observations.

The initial hosted A2 workflow failed configuration validation before running any test: [run 38604710815](https://github.com/nileshkchaubey-glitch/Xl-billing/actions/runs/38604710815) rejected `runner.temp` in job-level `env`. The seven existing workflows passed that head; their green status did not count as a missing A2 pass. The fix sets the evidence directory through `GITHUB_ENV` inside a step, where the runner exists. Official actionlint 1.7.7 independently reproduced the original context error before the fix and validates workflow syntax/expressions afterward. Actual final-head hosted execution remains the separate gate in the PR report.

The browser suite uses all ordinary index scripts, fresh contexts, a loopback test origin and code-defined synthetic histories. Requests outside the exact local allowlist are blocked before navigation. It compares exact key membership/raw strings and attempted writes per blocked action, native/installed UI handlers, empty/absent/populated/whitespace/hostile/typed credentials, confirmations, denied reads, missing elements, settings open/save/cancel and reload. Private V1 export and both V1/V4 imports use real application controls, synthetic data and fresh profiles, with comparisons immediately and after the scheduled reload. The A1b standalone page/browser suite and all VM diagnostic assertions remain unchanged; only its explicit authorized runtime provenance gate is added.

Ordinary Save can legitimately serialize noncanonical settings JSON; the complete canonical fixture must remain byte-identical, while pretty JSON must preserve exact properties/types/presence and every other key. This pre-existing serialization is not attributed to JSONBin quarantine. Original unsafe startup migrations are separately observed and labelled unsafe, never counted as safety passes.

## Independent review and reproducibility

Three independent read-only agents reviewed the winning source chains, security/privacy and QA. They reran the relevant Node gates and found no unresolved A2 application blocker at implementation/test commit `479bb8f77292ab3845489f50ca12c686feb0dce7`. Their recommendations for global browser error/network failure gates, actual V4 UI reload verification and tool-version evidence were implemented. Final exact-head review is explicitly bound to the final proposed commit in the PR report; no earlier review is presented as that result.

Relevant implementation: [guarded globals](../index.html#L2669), [disabled Settings card](../index.html#L2777), [revision guard](../qa/plan-a2/verify-runtime-revision.cjs), [full-script browser gates](../qa/plan-a2/verify-jsonbin-browser.cjs), [real billing UI smoke](../qa/plan-a2/verify-billing-browser.cjs) and [actual-head CI](../.github/workflows/plan-a-jsonbin.yml).

For a clean checkout with the documented test-only Playwright installation, run:

```sh
node qa/plan-a2/verify-runtime-revision-tests.cjs
node qa/plan-a2/verify-jsonbin-quarantine.cjs
node qa/plan-a/verify-evidence-runner.cjs
node qa/plan-a/verify-historical-fixtures.cjs --runtime-revision qa/plan-a2/runtime-revision.json
node qa/plan-a/verify-readonly-diagnostics.cjs --runtime-revision qa/plan-a2/runtime-revision.json
node qa/plan-a/verify-baseline.cjs --runtime-revision qa/plan-a2/runtime-revision.json --expected-head "$(git rev-parse HEAD)" --evidence-dir /tmp/xl-a2-new-evidence
node qa/plan-a2/verify-jsonbin-browser.cjs
node qa/plan-a/verify-diagnostics-browser.cjs
node qa/plan-a2/verify-billing-browser.cjs
```

Use a new evidence directory outside the checkout. The baseline summary records actual commit, clean/dirty state, source/test hashes before and after, original immutable pins, explicit A2 revision and individual original QA exits. Browser reports record source hashes and actual node/Playwright/engine versions. No generated HTML, browser profile, private archive or test-result folder is committed.

## Tooling and limitations

- Applied available Cloud Environment runtime skill and networking instructions. Executor skill discovery returned no additional skills; no unavailable debugging/security/browser skill is claimed. Independent agents and built-in Node tests provide those review/test activities.
- Reused verified isolated official Node 22.23.3 and existing Playwright 1.64.0. Local actual engines: Chromium 156.0.8078.4, Firefox 157.0, WebKit 27.2. No product dependency/package/backend is added. CI installs pinned Playwright and official browser dependencies outside the checkout. Actions use immutable official v7/Node 24 pins with contents-read permission and exact proposed-head checkout. Existing A1b browser CI retains its separately approved Playwright 1.56.1; its results are distinguished from the A2 1.64.0 matrix.
- Installed test-only actionlint 1.7.7 outside the checkout from the official `rhysd/actionlint` release and verified its archive against official SHA-256 checksums: `023070a287cd8cccd71515fedc843f1985bf96c436b7effaecce67290e7e0757`. Its workflow syntax/context checks run; optional external ShellCheck/Pyflakes integrations are disabled, not claimed as performed.
- Local WebKit initially failed a host dependency preflight for GLES. A temporary search-path alias uses the already bundled official WebKit library; local runs explicitly bypass the SDK host preflight but execute actual WebKit assertions. CI uses normal official dependency installation without that override. No functional test assertion is skipped by the local environment adjustment.
- No production profile, invoice/customer data, provider endpoint, key rotation, production migration, Google Drive API, merge or deployment is accessed/performed. Existing migration code is unchanged and its synthetic startup execution is deliberately observed. Existing Apps Script exposure, corrupt-read defaults, startup migrations, nontransactional writes, financial/PIN/XSS/print/date risks remain outside A2. The missing-phone prompt's fast-entry focus stealing is also an existing product limitation, not repaired or certified safe by the synchronized preservation smoke. Physical printers and owner-device/production cutover are not verified.
