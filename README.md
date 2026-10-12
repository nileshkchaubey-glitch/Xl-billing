# Xl-billing

**Phase A stabilization and P0-6/P0-7/P0-8 are implemented on isolated draft branches.**
See [FOUNDATION_REPORT.md](docs/FOUNDATION_REPORT.md) for current verification,
[storage and backup contracts](docs/STORAGE_AND_BACKUP_DESIGN.md) and
[STABILIZATION_REPORT.md](docs/STABILIZATION_REPORT.md) for Phase A.
The original PR #5 audit is retained as historical evidence.

One self-contained offline billing HTML app; no required backend, API key or paid
service. Main and the live app have not changed. Drafts are stacked for review,
with no merge or deployment. Data belongs to its browser URL/file origin;
changing the address does not move records.

## Run

Double-click `index.html` to open it from disk, without Node, a server or internet.
For development, install Node.js 24 LTS and use:

```sh
npm ci
npm run dev
```

Vite prints the development URL, normally http://localhost:5173. A phone needs a
forwarded workspace URL; the phone's localhost cannot reach the cloud workspace.
No backend, database, environment file or API key is required for core billing.
Optional sync remains owner-configured legacy functionality; no live accounts were tested.

## Tests and build

```sh
npm ci
npx playwright install --with-deps chromium firefox webkit
npm test
npm run lint
npm run build
npm run mutations
npm run test:baseline
npm run htmlcheck
```

`npm test` runs the preserved parcel VM checks, node:test properties and three
browser engines. `test:baseline` intentionally fails on original baseline bugs;
`mutations` expects all five recreated critical defects to be caught.
Lint no-undef errors must be zero, but legacy unused/redeclare warnings remain.
HTML validation currently reports legacy markup errors and exits nonzero; it is
an honest diagnostic, not a passed acceptance check.

Build copies `index.html` to `dist/index.html`. Both files contain all runtime
code and can be opened directly offline. The test-only CI workflow does not deploy.
This task does not change hosting or instruct production deployment.

If browser installation cannot install system libraries in this managed workspace,
see [environment notes](docs/ENVIRONMENT.md). A clean standard CI uses the command
above and does not need the workspace's temporary-library fallback.

## Data and documentation

Keep complete private backups outside the browser and keep older files. Settings
supports opt-in free automatic folder backups in compatible browsers, plus manual
downloads and reminders elsewhere. Folder backups run while the app is open.
Restore validates the file, shows a preview, requires the current PIN when replacing
a profile, and requests a pre-restore download. Conflicting historical records are
preserved for review. See [remaining risks](docs/RISK_REGISTER.md).

- [Owner guide](docs/OWNER_GUIDE.md) and [20-minute test rehearsal](docs/OWNER_SMOKE_TEST.md)
- [Verification and command outputs](docs/VERIFICATION.md)
- [Every minor-check status](docs/MINOR_CHECKS.md)
- [Architecture](docs/ARCHITECTURE.md) and [baseline inventory](docs/ARCHITECTURE_BASELINE.md)
- [Decisions](docs/DECISIONS.md), [migration status](docs/MIGRATION.md), [changelog](docs/CHANGELOG.md)
- [Known limitations](docs/KNOWN_LIMITATIONS.md) and [ranked risks](docs/RISK_REGISTER.md)

The existing app shortcuts remain. PIN dialog: Enter confirms, Escape cancels,
Tab/Shift+Tab stay within the dialog. A complete keyboard-first redesign is pending.
