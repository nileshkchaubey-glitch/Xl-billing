# Known limitations

Phase A and P0-6/P0-7/P0-8 are implemented on isolated draft branches. The old audit stop was superseded by explicit authorization and the passing phase gates. See [foundation report](FOUNDATION_REPORT.md), [blocked operations](WORK_BLOCKED.md) and [unimplemented work](WORK_UNIMPLEMENTED.md).

The recoverable localStorage protocol is not a multi-key atomic transaction or a physical-durability guarantee. Extra journal quota is required. Failed rollback retains a journal and blocks writes; startup recovers before rendering records. Older application versions can bypass browser locks, so their writes cannot be fully prevented.

Complete private backups include audit, settings and credentials. Manual downloads cannot be proven saved by the app. Automatic backups require an opted-in browser folder, existing permission and an open app. Unsupported mobile/browser environments use manual backups and reminders. Folder handles and device-specific status do not move in a portable backup.

Conflicting financial histories are preserved rather than repaired automatically. Hard deletion and deferred view/report issues remain. Physical devices, native folder selection on every mobile browser, print hardware, accessibility and full performance budgets are not verified. Legacy HTML diagnostics still fail; lint warnings remain. No finalized release tag, merge or deployment was performed.
