# Blocked operations and unsupported assumptions

PR #10's strict final owner gate still fails `older-writer-read-write-race` in all three engines. A noncooperating old writer can change bytes between validation and `setItem`; localStorage has no compare-and-swap. No supported workaround or atomicity claim is made. The owner must review the explicit supported-client contract and remaining device/profile checks in [BLOCKER_REPAIR_VERIFICATION.md](BLOCKER_REPAIR_VERIFICATION.md) before any personally approved transition.

Locked recovery refuses missing/default/corrupt current PIN credentials, stale proof or preview, ambiguous candidate histories, unresolved adoption journals and foreign transaction bytes. Raw export remains available when readable, including without Web Locks. See [RECOVERY_FOLLOWUP_REPORT.md](RECOVERY_FOLLOWUP_REPORT.md) for reviewed restore gates and exact limitations.

Development is not stopped by the historical audit. Conflicting nonempty payment histories remain unchanged; payment mutation and ordinary restore refuse them rather than inventing receipts. Structurally valid conflicts can still be archived in a complete private backup. Malformed collections, executable stored identifiers, contradictory journals and foreign storage changes retain raw recovery material for review.

A pending journal after failed rollback blocks new writes until verified recovery. Denied browser reads cannot be exported until storage access is restored. Browsers without usable Web Locks fail closed for billing writes. Older versions do not cooperate with the lock protocol; close them before further changes.

Native folder picking/permission is unavailable on many mobile/Firefox/WebKit configurations. Manual private downloads and reminders remain available. Automatic backups cannot run while the app is closed, and browser/device loss is not repaired by browser-local storage.

No record-level production reconciliation was attempted. Real owner records and arbitrary historical assumptions require separate review, not an automatic repair.
