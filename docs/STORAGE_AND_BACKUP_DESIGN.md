# Recoverable storage and complete backup foundation

The app remains one HTML file with no required network service. The existing `shop4_*` record values retain their formats. Invoice entry, payments, supplier payments, settlement discounts, old-bill entry, CSV import, settings and PIN-guarded deletion use the same storage protocol.

## Guarantees and limits

`localStorage` has no transaction spanning multiple keys. One successful `setItem` changes one value; it does not atomically commit an invoice, its number counter and its audit entry. Browser readback is not proof of physical disk durability. Browser eviction, clearing site data, device loss and power loss can defeat browser storage. Keep independent downloaded or folder backups.

The app stages a logical operation in memory, validates it, writes and reads back a SHA-256-checked recovery journal, applies and verifies its changed keys, writes a revision marker, then verifies journal cleanup. Success UI follows verification. A failed operation restores exact original raw strings. If rollback itself fails, the checked journal remains and further changes are blocked. Startup acquires the writer lock and recovers before application scripts read business records. A pre-marker interruption rolls back; a verified commit marker causes roll-forward. Corrupt, foreign or contradictory recovery material is retained without guessing.

Web Locks coordinate cooperating tabs. A stale tab must reload; simultaneous submissions cannot create duplicate operations. Browsers without usable locks permit reading and raw recovery export but fail closed for writes. An old application copy can ignore locks: revision and snapshot checks detect many such changes, but cannot guarantee prevention. Close old copies before using this version. A lightweight snapshot fingerprint detects ordinary drift; SHA-256 checks journals and backups. Neither is an authentication signature or protection against an attacker who can replace all local data.

The journal stores before and after values of changed collections, requiring extra quota headroom. It never deletes invoices or older backups to free space. Persistent quota errors may prevent immediate rollback; retain the profile and recovery export, then retry in a supported browser. Reads denied by the browser cannot be exported until access is restored.

## Backup contract

The private version 1 envelope includes exact raw `shop4_*` values (including audit, version and unknown compatible keys), column/compact preferences and backup configuration. SHA-256 covers `JSON.stringify({format,version,createdAt,payload})` in that property order; `payload.records` is the sorted array of `{key,value}` pairs. UTF-8 file size is limited to 20 MiB. Backup downloads use compact JSON so the exported size matches the import limit. Internal storage revisions/journals are excluded from a clean backup and included in a separate raw recovery package. Imported content is data and is never evaluated as JavaScript.

The complete private format includes PIN hashes and optional service credentials. Store it privately. Download acknowledgement means the browser was asked to save a file; the app cannot prove where a manual download was saved. A raw recovery package preserves unsupported or corrupted bytes for review and is deliberately rejected by ordinary restore.

Legacy v4/v5 backups require all six original collections/settings fields. Their compatible record fields remain unchanged, including aggregate opening paid amounts and separate supplier discounts. They have no integrity checksum and the preview says so. Partial files, unverifiable checksum additions, unsupported schemas, duplicate IDs/numbers, malformed amounts and inconsistent financial histories cannot be restored. No startup migration or historical repair is performed. Conflicting histories require review; raw recovery export retains them.

Restore validates before mutation, shows counts and format/checksum status, and requires an explicit choice. Replacement of an existing profile requires its current Delete PIN. First-time PIN setup never restores automatically; open the file again after setup. An empty profile can be initialized explicitly. A complete pre-restore backup download is requested before writes. The same recovery journal protects replacement of settings, collections, audit and preferences, including removing keys absent from the backup. Restore does not import the old coordination revision. Reload after a verified restore to refresh all view preferences.

## Verification scope

Only disposable synthetic storage, loopback servers and browser contexts were used. Fault injection covers journal, records, settings, audit, revision marker, rollback, concurrent tabs, corrupt journals and failed restore. Node tests include abrupt child-process exit and fresh-client recovery. Browser tests cover Chromium, Firefox and WebKit, including offline file origin. This does not establish survival of physical power failure, every mobile browser, printing hardware or arbitrary historical data not represented by fixtures.

## Free automatic backups and reminders

Folder backups are opt-in through Settings. The File System Access directory picker requires an explicit click and is chiefly available in Chromium. A folder handle is remembered in IndexedDB in this device/browser profile. On reload, background work only queries existing permission; reconnecting or granting permission requires a click. Unsupported browsers, including many mobile browsers, retain manual private downloads and a seven-day reminder. The app cannot run backups while closed, and background-tab scheduling can be delayed.

Verified changes schedule a debounced full snapshot. Unique timestamp/UUID filenames retain previous files without automatic removal. Success requires write, close and exact file readback; denied permission, disk/write/close/readback failure keeps a visible reminder. New commits arriving during a backup schedule another snapshot. A manual download request is recorded separately from a verified folder write and reminds users to check the saved file. Malformed or future remembered timestamps cannot silence reminders.

Folder handles, permission grants and device-specific backup status are excluded from portable clean backups. They must be selected again on another device; they are not billing records. Status keys use the internal prefix and do not trigger recursive backups or alter invoice revisions. No paid service or mandatory backend is used. Older files accumulate by design; owners manage disk space themselves.

Tests use synthetic folder/file/permission ports and check actual app commit scheduling. They do not open an owner's folder or prove native chooser interaction on every phone/browser. Real API capability on fresh offline file contexts was checked for locks and IndexedDB in all three engines; the native folder picker is available only where the browser implements it.
