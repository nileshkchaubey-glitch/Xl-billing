# Stabilization evidence

Before runtime fixes, the isolated branch at d07729e ran `node scripts/review-release1.cjs --group=stabilization`: 12 failed, 0 passed, 0 harness errors. Full source-bound observations are in stabilization-before-chromium.json. Five new historical accounting unit cases also fail before their helpers exist; command output was captured in /tmp/xl-historical-before.log. Future storage/backup acceptance is separate and is not claimed implemented.

After the accounting fix: five targeted browser probes passed (legacy payments, separate purchase discount, discount-only settlement, settlement precision and payout precision). Five historical unit cases plus the existing 1,000-sequence payment property passed. The preserved parcel VM check also passed. Inputs with fractional paise are rejected before mutation; openingPaid stores an undated aggregate only on an explicit action. Startup/read/PIN/XSS fixes and foundation work are still outstanding.
