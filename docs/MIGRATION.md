# Migration and rollback status

Startup does not migrate or rewrite historical business records. Read/display fallbacks preserve old amount/balance/status shapes. Explicit payment mutation can add optional `openingPaid` metadata without inventing a dated receipt. Legitimate supplier discounts remain separate from paid aggregates. Conflicting histories are preserved for review.

Explicit PIN setup/change replaces a plaintext setting with salt/hash after current-credential validation. Default 1234 cannot authorize deletion. This is not an invoice migration.

The storage journal records exact before/after raw strings and a checked revision marker. Recovery runs before app reads; it rolls back an uncommitted operation or rolls forward a committed marker. A browser storage revision is internal and not imported from portable backups. No localStorage multi-key atomicity or physical crash durability is claimed.

Complete private backups preserve compatible raw values, audit, preferences and credentials. Legacy v4/v5 files require all six original collection/settings fields and are previewed without claiming checksum integrity. Restore is PIN guarded and recoverable, with a pre-restore download request. Unsupported conflicts cannot be repaired by assumption. A raw recovery package preserves damaged bytes/journals for review.

Rolling HTML back to an older application does not reverse business actions. Older copies do not recognize the new recovery protocol and can bypass locks. Keep independent copies and use isolated rehearsal profiles; no production rollback, migration or record access was performed here.
