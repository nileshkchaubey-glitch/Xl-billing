# Plan A A1a verification

Date: 2026-10-14 (Asia/Kolkata). Status: **local A1a checks passed; ready for limited Draft PR review. Production release readiness is unverified**.

The owner approved A1a source inventory, documentation, synthetic historical fixtures, baseline evidence tooling and a read-only CI job. Work is isolated on `codex/xl-plan-a-a1a`, based on main `3855c6ab21de64fdc9e28116fcd0f770304eef66`. The attachment's broader execution handoff is a proposed specification, not authorization for later runtime work.

The production contract is exact preservation of all 15 baseline files, including `index.html`, the six original QA scripts, two existing QA guides, the mobile QA HTML and five existing workflows. The new development scripts operate only on pinned source, code-defined synthetic fixtures and disposable test repositories. No normal application startup, browser profile, billing data, JSONBin or Apps Script is accessed.

## Tools and installations

| Tool | Source and use | Evidence / limitation |
| --- | --- | --- |
| Cloud Environment runtime skill | [SKILL.md](skill://plugin_connector_1p_c5b7d5df5d7081918f2c4be5a633ed5d/cloud-environment-runtime/SKILL.md); read the skill/network reference and checked observed environment readiness | Connected, current/enforced network policy; no extra connection or configuration requested. |
| Existing GitHub connector and Git CLI | Read latest main, prepare isolated branch and publish the authorized Draft PR | No merge, deployment or main update is authorized. |
| Node 22.23.3 | Official [Linux x64 archive](https://nodejs.org/dist/v22.23.3/node-v22.23.3-linux-x64.tar.xz), verified against official [SHA-256 list](https://nodejs.org/dist/v22.23.3/SHASUMS256.txt) | Archive SHA-256 `df450af89261115ef9f9e3830c3eeb2cc9213b63c720b1af623cb5dcbe2e02de`; 31,001,304 bytes. Installed only under a temporary tool directory, with no global replacement. Same version pinned in new CI. |
| Built-in Node modules | Assertions, crypto, filesystem and subprocesses for development verification | No npm dependency, backend, paid service or additional plugin installation. |
| Existing GitHub Actions | Checkout `11d5960a326750d5838078e36cf38b85af677262`; setup-node `49933ea5288caeca8642d1e84afbd3f7d6820020`; upload-artifact `ea165f8d65b6e75b540449e92b4886f43607fa02` | Public official tag SHAs checked before pinning. New workflow uses contents-read permission and actual proposed head, with persisted checkout credentials disabled. |

## Before evidence

Before new A1a tooling execution, all six unchanged existing QA scripts passed with Node `v22.23.3` on the pinned source. `index.html` SHA-256 remained `d5fbcd1a47a5bf6e8d2ec735b561f46108e3c905878ba301acd322040b52b70a`. These are isolated Map/DOM/VM snippet checks, not full browser initialization or production safety verification.

| Existing command | Before result |
| --- | --- |
| `node qa/verify-backup-import.cjs` | PASS, exit 0 |
| `node qa/verify-complete-backup.cjs` | PASS, exit 0 |
| `node qa/verify-invoice-entry.cjs` | PASS, exit 0 |
| `node qa/verify-invoice-payment-safety.cjs` | PASS, exit 0 |
| `node qa/verify-pagination.cjs` | PASS, exit 0 |
| `node qa/verify-payment-ledger-pagination.cjs` | PASS, exit 0 |

## Completed candidate checks

| Check | Actual local result | Scope |
| --- | --- | --- |
| All six unchanged QA scripts, through the new baseline runner | PASS; all exit 0 | Exact baseline application/test bytes; synthetic snippets only. |
| `verify-historical-fixtures.cjs` | PASS; 15 grouped checks, exit 0; codecInputSmoke PASS | Determinism, linked synthetic IDs/roles, openings, preserved ambiguous histories/discounts/aliases, format wrappers, exact raw strings, sizes, private metadata and independent compatible V4/V1 input. Production safety remains UNVERIFIED; restore acceptance remains NOT_TESTED. |
| `verify-evidence-runner.cjs` | PASS; 14 controls, exit 0 | Disposable synthetic Git repositories and fake QA only; no real application initialization. |
| Original source preservation | PASS; all 15 original files match immutable Git blobs | `index.html` and all original tests/workflows/guides/mobile HTML unchanged. The runner also rejects a modified script paired with an edited manifest. |
| Source references and local links | PASS | Pinned paths/line bounds and local Markdown fragments checked. Inventory includes all 89 direct mutation-token lines and distinguishes runtime, replaced and tutorial code. |
| Independent review | Prior CI/provenance findings resolved; no unresolved blocker in the completed review scope | The reviewer separately inspected source preservation, mixed-fixture classification, privacy and read-only CI. Final compatible-input additions and final-head checks were reviewed by the primary agent; the review agent's final per-head re-review did not complete. |
| New CI definition | Static review passed | Immutable official action SHAs, Node 22.23.3, actual PR head, contents-read only, no persisted checkout credentials, finite timeouts, failure artifacts. Hosted execution is a separate per-head result. |

The baseline report records the actual checked-out commit and before/after hashes for all 15 original and 12 A1a source files, plus fixture seed/count/byte/digest metadata. It requires a clean tree by default, matches the explicit expected head, and records the triggering GitHub event SHA separately because a PR event may identify a synthetic merge. It never treats VM snippets as a security sandbox or as full runtime verification.

Local precommit verification explicitly used `--allow-dirty`; it passed with dirty provenance recorded. The final clean-head run and hosted workflow bind the complete proposed head in their machine-readable `summary.json`. Exact head/hash evidence belongs in that generated report; this source document does not embed a self-referential final commit ID or claim a hosted result before GitHub returns it. The PR's checks and owner handoff provide the hosted outcome.

## Failure evidence and corrections

| Observation/control | Evidence and final behavior |
| --- | --- |
| Initial fixture privacy assertion | Actual exit 1: one of 13 grouped checks failed. The broad expression falsely matched safe `synthetic` scope and numeric `largePayloadChars` metadata. Narrowed it to record identifiers/raw field names; the revised suite passed, with no raw records in CLI output. No privacy leak was observed. |
| PR merge SHA versus checked-out head | Static review found the initial runner incorrectly required `GITHUB_SHA` to equal the proposed head. Corrected contextual versus checkout provenance; a differing synthetic event SHA now passes while a wrong explicit expected head fails before QA. |
| Editable manifest binding | Static review found initial hashes were not bound to baseline Git objects. Added raw `git cat-file` verification with replacement objects disabled. The altered-QA-plus-altered-manifest control now fails preflight. |
| Actual child failure and timeout | Fake QA exit 7 is retained as failed; timeout is retained as timed_out. Reports/log metadata survive both failures; subsequent safe fixed checks retain their own outcomes. |
| Dirty, missing or changing evidence source | Default dirty tree, unavailable baseline, changed original/new source and changed HEAD are failed outcomes. Explicit local dirty mode remains labelled; it is not clean CI evidence. |
| Production CLI refusal | Actual CLI exit 1 and persisted failed summary for wrong expected head/unavailable baseline. Not-run checks remain notrun. A local invocation with a stale expected SHA was also refused before any QA, then rerun successfully against the actual head. |
| Privacy and child environment | Raw sentinel diagnostics omitted; only byte counts/digests and reviewed fixed PASS text retained. Node preload flags and inherited test-secret values do not reach child QA. |

These controls verify development evidence tooling. They do not reproduce or fix the current production financial/storage defects. No old-writer failure was rerun or converted into a passing safety test here.

## Synthetic scale evidence

Default seed: `169484326`. These are code-defined invoice counts with linked synthetic collections, 32,768-character large-note/photo metadata input and deliberately varied historical shapes. Metrics are measured raw **value** UTF-8 bytes and serialized development snapshot bytes, not origin occupancy, free localStorage capacity, a complete V1 file size or an owner-data measurement.

| Invoices | Purchases | Retail | Raw value UTF-8 bytes | Serialized snapshot UTF-8 bytes |
| --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 559 | 1,209 |
| 86 | 22 | 29 | 258,096 | 270,742 |
| 500 | 125 | 167 | 631,384 | 698,139 |
| 2,000 | 500 | 667 | 1,983,363 | 2,246,019 |
| 5,000 | 1,250 | 1,667 | 4,687,936 | 5,342,452 |

Missing-store and present-empty fixtures are distinct. There are 20 invoice and nine purchase case shapes, including the separate historical scalar supplier `total500/paid20/discount10/balance470` case. Opening/alias/independent-discount hypotheses are explicitly labelled; they are not claimed as proven current-main acceptance. A separate fresh-literal compatible fixture provides three invoices with absent, empty and matching histories plus nonempty purchase/retail/audit sections and signed masters. Hash-pinned isolated factories accept it through V4 parsing and V1 decoding without storage/browser/network port access; no mixed history is filtered or normalized, and no restore or normal bootstrap is performed. Default scale summaries/hashes remained unchanged. Raw fixture snapshots and generated V1/V4 wrappers are not committed as bulky artifacts or advertised as verified restorations.

## Reproduce and inspect evidence

Reproduction commands, using Node 22.23.3 and a clean candidate checkout:

```sh
node qa/plan-a/verify-historical-fixtures.cjs
node qa/plan-a/verify-evidence-runner.cjs
node qa/plan-a/historical-fixtures.cjs
node qa/plan-a/verify-baseline.cjs --evidence-dir /absolute/new/evidence-directory --expected-head ACTUAL_CANDIDATE_SHA
```

Evidence output must be an empty directory outside the repository. Local precommit development can explicitly use `--allow-dirty`; it is not equivalent to the clean-head CI gate. A runner result covers only its recorded checks, not separately invoked harnesses or proposed future acceptance criteria. The [new workflow](../.github/workflows/plan-a-baseline.yml) runs both harnesses separately, then the six-script baseline; a harness failure still fails the job even if baseline scripts pass. It uploads evidence on failure and does not store raw fixture/customer records in artifacts.

## Unimplemented work and release limitations

No diagnostics UI, cloud quarantine, immutable filesystem generations, integrity adapter, journal, restore workflow or automatic backup was implemented. A1b and A2–A6 remain separately scoped and approval-pending. The proposed [test matrix](PLAN_A_TEST_MATRIX.md) distinguishes these acceptance gates from A1a characterization.

The [current risk review](PLAN_A_RISK_TRACEABILITY.md) remains applicable: read errors collapse into empty defaults, immediate migrations can rewrite history, writes are multi-key, financial/PIN/XSS/print/date issues need real characterization and separately approved repairs, and an older noncooperating writer cannot be made transactional through localStorage alone. Old PR #10 evidence does not certify current main.

Full Chromium/Firefox/WebKit runs, actual locked startup and recovery, native file dialogs, physical printing, owner-device checks, independent-copy retrieval and production cutover are **not run**. A1a cannot certify production release readiness. The owner retains merge approval; no merge or deployment is performed.
