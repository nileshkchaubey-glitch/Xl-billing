# Plan A — future read-only diagnostic contract

Date: 2026-10-14. Status: **contract documented within approved A1a; A1b runtime implementation and launch design approval pending**. A1a adds no diagnostic page/panel, bootstrap gate, localStorage read/write adapter, provider interception, new storage key, metadata persistence or runtime change. This is a future acceptance contract, not a deployed feature.

Baseline: `3855c6ab21de64fdc9e28116fcd0f770304eef66`; `index.html` SHA-256 `d5fbcd1a47a5bf6e8d2ec735b561f46108e3c905878ba301acd322040b52b70a`, 554,923 bytes. The complete [source inventory](PLAN_A_SOURCE_INVENTORY.md), [risk reconciliation](PLAN_A_RISK_TRACEABILITY.md) and [test matrix](PLAN_A_TEST_MATRIX.md) supply source links and acceptance IDs. Actual A1a evidence belongs in [verification](PLAN_A_A1A_VERIFICATION.md) and [baseline-source.json](../qa/plan-a/baseline-source.json).

## Launch boundary requiring separate review

A1b must choose one reviewed design before implementation:

- A self-contained, same-origin static support tool that never loads the application's scripts or initialization. Its offline/self-contained contract, supported origins and file-origin behavior need explicit review. It would be an additional support file; the production application remains self-contained.
- An explicitly approved diagnostic-only gate before every ordinary script/writer and load/navigation/keyboard handler. This changes initialization and needs full browser regression beyond a late panel patch.

A panel appended to ordinary startup cannot meet A-READ-02: V5 runs immediately and V13/V14/V15 can rewrite records before navigation. The pending-import notice is too late to guarantee zero writes. Another path on the same host shares the origin and does not isolate restore; file-origin storage behavior cannot be assumed. Neither launch option is approved or implemented in A1a. A1b must prove the ordinary app's migrations, timers, globals and write-capable handlers do not initialize during a diagnostic-only visit.

## Read-only and zero-network behavior

The diagnostic-only port may enumerate storage membership and read raw values for analysis. It must not call fallback getters that collapse errors into empty/default business data. Its storage observation is read-only: no set/remove/clear, migrations, repair, version advancement, credential rewrite, persistent status, profile identifier, permission handle or backup timestamp. No write probe or quota-fill probe is allowed on a real profile.

A diagnostic visit/revisit/refresh, warning, error, absent status element or direct diagnostic call must make no network request. This includes JSONBin, Apps Script, analytics, fonts, remote images, telemetry and account/credential verification. Provider status is derived only from inspected local configuration/source evidence and is labelled unknown/unverified; the tool must not contact a provider to establish it. The future page must be self-contained and function without downloading dependencies. Test request interception is an independent guard, not a reason to permit hidden requests in the product.

Diagnostic interactions cannot clear storage, import/restore, normalize histories, recalculate and persist paid/balance, rotate/delete credentials, start billing, request directory permission, trigger recurring downloads, connect an account or upload evidence. A4's independent emergency raw-evidence export is a separate scope; no raw or redacted exporter is authorized by this contract.

## Honest states and privacy

| Observation | Required meaning and presentation |
| --- | --- |
| Key absent | Report absence, not a confirmed safe empty billing profile. A new/wrong origin can have no keys. |
| Valid present empty array/object | Distinguish it from absent, JSON `null`, malformed JSON and wrong type. Preserve exact strings. |
| Denied property access/getItem/enumeration | Report denied/partial/unknown coverage; do not invent a count of zero or silently omit it. |
| Malformed JSON, wrong shape, duplicate IDs or unexplained accounting/history | Report incompatible/unexplained state without repair. Do not emit the raw value, parse excerpt, record name or private ID. |
| Profile/device/private mode | Browser profile identity and incognito/private mode are unknown unless reliable evidence exists; do not invent detection or a stable identifier. The visible origin can be reported with privacy-safe formatting. |
| Backup age / independent copy | Unknown without reliable verified evidence. A requested download, local flag, directory permission, pathname or local readback does not prove physical persistence, cloud upload, independent possession or retrieval. |
| Provider configuration | Configuration presence is not verified provider health, off-device backup, quarantine or successful sync. Avoid displaying keys, bin IDs or full private URLs. |

Render all untrusted text/key names using safe text APIs, with explicit bounds and no raw HTML interpolation. Do not show business records, credentials, phone/address/photo/notes, private identifiers or raw exception messages in UI, console, logs, screenshots or CI artifacts. Synthetic secret/error/text sentinels must verify redaction and execution safety. Counts and coarse status must not become a route for private owner content to enter public artifacts.

A complete private recovery backup may contain credentials and audit. Independent emergency raw evidence may contain corrupt/recovery bytes and is not automatically restorable. Any future shareable/redacted diagnostic artifact is explicitly non-restorable and needs a separate content/privacy design; redaction must never be presented as a complete private backup. A1a fixtures/results are synthetic only, with no sanitized owner-export input.

## Required warnings

Warnings must be generic, visible, safe to render and must themselves cause zero writes/requests. They must cover:

- Avoid private/incognito sessions for ongoing billing; the tool cannot reliably detect the mode.
- Do not clear site/browser data or change profile/device/origin without a verified private independent copy and an approved recovery drill.
- Avoid simultaneous editors/tabs and older copies; current source has no cooperative transaction/revision protection and no protection against an old noncooperating writer.
- A requested browser download or passing checksum is not proof of independent backup possession, full accounting correctness or physical durability.
- Denied, corrupt, partial or unexplained evidence requires a hold/review rather than a diagnosis that data is safe. Preserve readable raw state; do not offer Clear Storage as recovery.

Warnings must not falsely claim that A2 quarantine, A4 integrity gating, A5 recovery or an owner device drill exists. Dates can be labelled UTC/IST explicitly; there is no authorized repair of invoice dates, numbering, FY, opening signs or legacy financial semantics.

## Sizes and capacity

Future diagnostics may calculate exact UTF-8 encoded byte length and UTF-16 code-unit metrics of readable raw strings in memory, distinguishing values, key overhead and measured snapshot completeness. Invoice count alone is not storage size. Any `navigator.storage.estimate()` result must be labelled an optional approximate origin-wide estimate: it is not localStorage free space, a quota reservation or a capacity guarantee. Missing/denied/inaccurate estimates remain unknown. Do not allocate filler keys, request persistence or mutate storage to estimate a limit.

Synthetic coverage includes 0/86/500/2,000/5,000 invoices, absent versus present-empty collections, Unicode/surrogate pairs, large notes/photos, historical paid/payment/discount shapes, unknown safe keys, preferences and pending/foreign recovery bytes. These measurements are observations about generated fixtures, not a production size/SLA or a real JSONBin limit measurement.

## A1b acceptance evidence before any release claim

The separately approved implementation must satisfy A-READ-01/02, A-DIAG-PRIVACY-01, A-DIAG-STATUS-01, A-DIAG-SIZE-01 and A-DRILL-ORIGIN-01 from the [test matrix](PLAN_A_TEST_MATRIX.md). Required evidence includes full diagnostic launch/revisit/reload, exact before/after key presence and raw values, zero request/write assertions, denied/corrupt/unknown cases, safe warnings and malicious-text/redaction tests. Test the actual launch in approved browsers with empty disposable contexts and network blocking installed before navigation. Source/runner/fixture hashes and actual candidate commit must accompany the result.

Screenshots document diagnostic UI only; they do not establish accounting, recoverability or durability. Ordinary application bootstrap tests, native devices/files, physical printing, off-device retrieval, quota/eviction/power-loss behavior and private owner drills remain separately scoped and unverified unless their actual evidence is recorded. This contract grants no A1b implementation, merge or deployment approval.
