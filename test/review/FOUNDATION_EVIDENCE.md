# Foundation test-first evidence

All fixtures are synthetic. No owner's browser profile, business records or connected storage were opened.

- `b33aaba`: initial storage acceptance tests were added before implementation; 11 failed because the storage factory did not exist.
- Storage core development added three failing read-overlap/observer probes before correcting them. The final 16 core cases pass, including real child-process interruption, rollback failure and corrupt recovery material.
- Application integration: Chromium initially had 9 failed / 1 passed storage browser cases. After integration the same ten cases pass in all three engines (30 cases).
- The pre-adaptation regression run had 127 passed / 17 failed because older tests assumed synchronous actions or used unscoped fixture writes. Assertions were retained, fixture writes were scoped and actions awaited; the adapted run passed 144 cases.
- `8b4dc70`: six complete-backup codec tests were added before the codec; all six failed. The implemented codec passes all six.
- Nine backup browser cases failed against the unwired backup UI. Initial integration additionally caught a PIN dialog obscured by the preview. After fixing the stacking order, all nine pass in Chromium, Firefox and WebKit (27 cases).
- Expanded workflow coverage includes successful commits plus failed-write/retry controls for purchase entry/bulk, supplier payments, settlements, standalone/edit payments, retail, CSV, column preferences, compact mode and settings. The first run found a fixture typo (`s-shop` instead of the application's `s-name`), not a production defect; its six setup failures are not counted as implementation evidence.
- The original restore-partial-write audit probe expected immediate rollback despite a persistent injected quota failure. It now checks a visible failed restore, retained journal when needed, blocked writes and exact original bytes after fresh startup, matching the explicitly recoverable storage contract. No success is claimed while recovery is pending.

Final source hashes, phase gates and browser counts are recorded in the foundation report and committed JSON evidence. Archived audit results describe their historical source, not the current release.

- P0-8 began after checkpoint `b817937`: eight automatic-backup unit probes failed before implementation, then passed. A malformed remembered timestamp additionally failed in Node and Chromium before normalization was implemented; all nine unit probes and 21 automatic-backup browser cases then passed.
- A further Chromium failure showed that complete export wrongly used restore-level financial acceptance. Export now archives structurally valid conflicting histories unchanged while restore continues to reject unsupported financial assumptions. Its before/after probe is part of the final regression suite.
- A final storage-boundary probe failed because the writer allowed more than the recovery reader's 10,000 keys. The writer now rejects that batch before staging/persisting anything; the added case passes and exact original bytes remain intact.
- The existing v5 cloud `ts` header first failed codec validation, then passed after compatibility was restored. A real app preview/PIN flow with mocked remote responses passes in all three engines. Positive and negative party opening balances are included in exact-byte codec fixtures.
