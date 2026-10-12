# Architecture at the hotfix checkpoint

This document records the earlier Release 1 checkpoint. Current Phase A/foundation status and evidence are in [FOUNDATION_REPORT.md](FOUNDATION_REPORT.md).

`index.html` remains the executable app, with embedded CSS and classic scripts.
The historical patch/wrapper structure is retained; see the complete syntactic
inventory in ARCHITECTURE_BASELINE.md. Earlier functions are often called by later
wrappers and must not be deleted just because a later assignment exists.

Shared record predicates, number selection, payment validation, HTML attribute
escaping and list view state live near the data layer. The v13 pagination helpers,
v10 print settings and v15 audit helper are exposed for later patch blocks.
The final invoiceFastEntry block still owns parcel multiplication and preserves
legacy final quantities; its existing VM regression test remains unchanged.

Storage remains synchronous browser localStorage through DB.get/set/del with
shop4_ keys. **This checkpoint does not supply atomic storage, durable journaling,
quota handling, complete backups or a migration engine.** The original baseline
migrations still run. Do not assume this is safe for a production upgrade.

Future storage adaptation should place all reads/writes, revisions, transactional
commits, backup snapshots and schema validation behind one adapter. A Tauri or
Electron version can keep the record/view modules while replacing that adapter
with SQLite. Preserve legacy import decoding separately from persistence; do not
rewrite originals while merely viewing them.

The test server serves the unmodified HTML. Vite is development-only; `npm run
build` copies the same self-contained file into dist. Browser tests run with
synthetic data. CI runs tests/builds only and has no deployment permissions/workflow.
