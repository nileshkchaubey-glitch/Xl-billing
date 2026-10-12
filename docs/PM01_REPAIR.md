# PM-01 purchase-number compatibility repair

PM-01 is resolved for the documented supplier/year contract below. This isolated repair starts at PR #9 head `5d3fb7991586d7acef84d49cdd26a003b290d912`, on `codex/xl-pm-supplier`. Authority is [owner comment #6128013121](https://github.com/nileshkchaubey-glitch/Xl-billing/pull/9#issuecomment-6128013121). This report does not declare the assembled release ready: other PM blockers, policy limitations and final exact-head CI remain the parent repair's responsibility.

## Policy and preservation

Purchase `billNo` is a supplier-issued reference, compared case-insensitively after trimming for duplicate detection. The stored spelling is never normalized or changed. Its identity scope is the purchase's **saved nonempty `partyId` and April–March financial year derived from its saved ISO business `date`**. The same supplier may reuse a reference in another financial year; distinct saved supplier IDs may use the same reference in one year, including when their display names match. Settings FY, invoice series and UTC `createdAt` are irrelevant to this purchase identity. Sales numbering remains globally unique under its existing rules; no counter, prefix, series or reset behavior changes.

Display names are not stable identities. The validator never merges suppliers by name, invents an ID, selects today's date for an old record, or changes historical vendor references. A renamed/deleted master does not erase the saved supplier identity in a historical purchase. New or changed nonempty supplier links in ordinary writes must refer to an existing supplier/both master; missing legacy master type retains the established both-type default. Historical unchanged links and fully reviewed imported histories remain portable even when a master was removed. A saved ID is a scope identifier, not proof of the supplier's authenticity or the origin of a backup.

Records with an unknown supplier or missing saved date are retained. A unique reference does not require fabricated metadata. Two colliding references are unambiguous only if their known supplier IDs differ or their known years differ. Otherwise missing identity/year produces a specific **ambiguous purchase** refusal. A known identical supplier/year produces a specific **duplicate purchase** refusal. The owner must resolve ambiguous source history locally; this repair provides no automatic renaming, identity inference or bypass.

An existing ambiguous pair may remain byte-identical during unrelated ordinary edits and can be exported as a private archive. Changing either conflicting purchase is refused. Full backup decode, raw adoption and restore validate the complete candidate and refuse the ambiguity, retaining original business and coordination bytes. Archive export alone does not establish that an ambiguous history is restorable.

`validateXLTransaction` applies the same comparison to ordinary creation, bulk/import transaction preflight, private/legacy decode, locked adoption and restore. Full-batch validation happens before journal or business writes. The recovery UI keeps its existing export proof, checksum/schema/accounting validation, current PIN, preview and explicit confirmation gates.

## Before/after evidence

The unchanged independent owner assertions reproduced both failures on the PR #9 runtime: second-supplier P-1 creation was refused, and complete private backup decode rejected two supplier-linked P-1 purchases. Exact original bytes remained intact on refusal. [Before Chromium evidence](../test/repairs/pm01/before-chromium.json) records source SHA-256 `37cb3c09b5d165768666d3ccefae9478b10f08a7dc20f1dcc219cad91e596933`; the prior final report retains matching failures in Firefox/WebKit.

Test-first commit `2e92674a3c7d0087e66ac91abe468b998f906640` adds 17 synthetic cases. Before the repair, 2 passed and 15 failed; these include newly required specific diagnostic assertions as well as incorrect workflow acceptance/refusal. They are not 15 distinct corruption incidents. No assertion was removed, skipped, converted to expected failure, or changed to obtain a pass. [Node comparison](../test/repairs/pm01/node-before-after.json) lists each case and the exact test/source hashes.

Fix commit `50a41c84f99bda23f4d240143410a9170578977c` has runtime SHA-256 `f3c11c74d19136ba544cde0c5f758199a8b3b3c6f929347bc89d689d16cc3811`.

| Verification | Actual result |
| --- | --- |
| New supplier identity/backup/recovery Node cases | 17 pass, 0 fail, 0 skip |
| Original 63 Node cases plus the new 17 | 80 pass, 0 fail, 0 skip |
| Parcel/open-box VM | PASS, existing assertions retained |
| Unchanged creation and private decode owner probes | 2 pass/0 fail/0 harness errors per Chromium, Firefox and WebKit |
| Locked multi-supplier adoption and private restore | PASS in synthetic storage port; wrong PIN/unconfirmed choice preserve bytes; approved recovery reopens successfully |
| Ambiguous candidate adoption/restore and mixed bulk batch | Refused with exact original business/coordination bytes retained |
| Complete assembled browser suite, lint/build and GitHub CI | Not performed by this isolated subtask; required in parent final verification |

[Chromium](../test/repairs/pm01/after-chromium.json), [Firefox](../test/repairs/pm01/after-firefox.json) and [WebKit](../test/repairs/pm01/after-webkit.json) reports bind both unchanged owner probes to the committed fix SHA. The original owner probe labelled backup-restore checks private encode/decode; the added Node tests also exercise actual locked apply/reopen, not merely decoding.

Commands:

```sh
node --test --test-reporter=tap test/foundation/supplier-identity.test.cjs
node qa/verify-invoice-entry.cjs
node --test --test-reporter=tap test/unit/*.test.cjs test/foundation/*.test.cjs
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 \
LD_LIBRARY_PATH=/tmp/xl-browser-libs/root/usr/lib/x86_64-linux-gnu \
XL_PREMERGE_BROWSER=chromium \
XL_PREMERGE_ONLY=different-supplier-bill-number,different-supplier-backup-restore \
XL_PREMERGE_REPORT=/tmp/pm01-committed-after-chromium.json npm run test:premerge
# Repeat the same independent owner command with firefox and webkit.
```

No dependency, plugin, paid service or runtime backend was installed or introduced for PM-01. The existing Node/VM, Acorn and Playwright tools were sufficient. Browser-library fallback is existing isolated development tooling, not an application dependency. All records, PINs and ports are synthetic. Main, live storage, hosting, merge controls and parent PRs were not changed.

The owner still controls resolution of ambiguous historical identities/dates, local-profile compatibility and device acceptance. This repair does not authenticate vendor identity, certify real records, change the older-client/localStorage concurrency contract, guarantee physical durability, or certify physical hardware.
