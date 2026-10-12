# Changelog

## Release 1 draft — critical hotfix checkpoint (unreleased)

No production deployment or merge. Full release acceptance remains partial; see
VERIFICATION.md and KNOWN_LIMITATIONS.md. No finalized release tag is assigned.

| ID | Change and reason | Files | User-visible effect |
| --- | --- | --- | --- |
| Phase 0 | Tag exact baseline, generate architecture/handler inventory and synthetic fixture tooling | docs, scripts, test | Reviewable evidence; no live data accessed |
| P0-1 | Replace malformed PIN inline handlers, require non-default PIN, salt/hash using WebCrypto, guard invoice/purchase/party/item/payment/retail deletion | index.html, tests | Deletion can be confirmed; Cancel/Escape work; default PIN cannot delete |
| P0-1 | Move 29 free-text handler arguments into escaped data attributes and fix quoted input values | index.html, tests | Apostrophes, quotation marks and ampersands work in tested party selection/settlement |
| P0-2 | Expose shared cancellation/deletion predicates and pagination/print/audit helpers | index.html | Seeded Parties, Party Detail, Settlement, Pending and Transaction Log no longer hit missing helper names |
| P0-3 | Restore pagination, size and sorting on seven lists; preserve per-list session state; keep full filtered summaries | index.html, tests | Users can reach records after row 20 and select 20/50/100 rows |
| P0-4 | Reject excess payment/discount before writing; recompute paid and balance; prevent invoice edit from conflicting with recorded payments; audit only changed records | index.html, payment tests | Tested invalid attempts leave records/audit unchanged |
| P0-5 | Generate numbers by scanning existing maximum/counters and block duplicate typed old-bill numbers | index.html, numbering tests | Repeated old-bill batches and tested typed duplicates do not create duplicate numbers |
| P1-14 | Remove shell command/heredoc text leaked into the body | index.html | Shell paths no longer appear in the app |
| Verification | Unit/property tests, three browser engines, offline file origin, 38 synthetic screenshots, five mutation cases, test-only CI | test, scripts, workflow, test-results | Reproducible verification without deployment |

### Removed

- The unused broken `v15CheckPin`/`v15PinConfirm` string-handler implementation and plaintext-PIN Settings input are replaced by the explicit guarded PIN flow.
- Three stray shell text lines (`cat`, heredoc marker, `echo`) are removed.
- Obsolete "Showing 100" truncation text is removed after transaction pagination is introduced.
- No app page, invoice field, billing collection or tutorial has been removed. Legacy hard deletion and baseline migrations remain pending data-safety work.

## Releases 2–4

Not implemented at this checkpoint. No migration, refactor, new inventory/GST/PWA
feature, hosting setup or finalized release tag is claimed.
