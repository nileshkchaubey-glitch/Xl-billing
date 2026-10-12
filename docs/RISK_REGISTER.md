# Remaining risks, ranked

| Rank | Risk | Likelihood | Mitigation / required work |
| --- | --- | --- | --- |
| 1 | Storage full can leave invoice/counter/audit inconsistent or report success incorrectly | High as data grows | P0-6; independent daily exported backups; do not deploy this draft |
| 2 | Backup omits audit, secrets policy/checksum/preview/snapshot are missing | High | P0-7; retain old backups and test restore only in a separate profile |
| 3 | Working Delete still permanently removes records and can break party/item references | High on deletion | P1-4; backup before delete; implement Recycle Bin/archive |
| 4 | Existing startup migrations can rewrite records without a recoverable snapshot | Medium | Snapshot/verify/idempotence/rollback before any migration release |
| 5 | Two tabs / double submission can overwrite records or counters | Medium | P1-6/P1-12; single tab, single master device |
| 6 | Unescaped HTML/print text can execute imported malicious text | Medium | P1-3; full XSS payload suite and safe print DOM |
| 7 | Optional sync/backup can expose credentials or overwrite records | Medium | P0-7/P2-7; leave sync disabled pending tests |
| 8 | Historical payment mismatch, float noise, discounts or untested allocation path corrupt balances | Medium | P1-1/2/5/13; independent reconciliation, no automatic guessing |
| 9 | Duplicate imported numbers or reused deleted numbers remain possible | Medium | P0-5/P0-6 import-wide checks, reservation ledger and repair preview |
| 10 | UTC dates, unverified PDFs/hardware, accessibility and performance affect daily use | Medium | P1-7/8/11 plus cross-device/printer/performance rehearsal |
