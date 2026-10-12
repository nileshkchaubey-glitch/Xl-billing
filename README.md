# Xl-billing

**Phase A stabilization is complete on this branch.** See
[STABILIZATION_REPORT.md](docs/STABILIZATION_REPORT.md) for the fixed defects and
actual failing/passing evidence. `npm run test:stabilization` checks Phase A;
`npm run test:foundation` tracks P0-6/P0-7 separately. Storage recovery and complete
backup/restore are not implemented here yet. The earlier audit describes PR #5
before these fixes and is preserved as historical evidence.

One self-contained offline-capable billing HTML app. This branch is a **draft
critical hotfix**, not a fully finalized production release. The live app has
not been changed. Read [remaining risks](docs/RISK_REGISTER.md) before considering
an upgrade. Data lives in each browser's localStorage and belongs to its URL/file
origin; changing that address does not move records.

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
Optional sync remains legacy opt-in functionality, not verified safe by this draft.

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

Keep independent daily exported backups outside the browser and keep older copies.
Restore only in a separate test profile until complete backup/restore verification
is delivered. Use one master device and one tab; stale-tab protection is pending.
Legacy exports omit audit and can include credentials, so treat backup files as private.

- [Owner guide](docs/OWNER_GUIDE.md) and [20-minute test rehearsal](docs/OWNER_SMOKE_TEST.md)
- [Verification and command outputs](docs/VERIFICATION.md)
- [Every minor-check status](docs/MINOR_CHECKS.md)
- [Architecture](docs/ARCHITECTURE.md) and [baseline inventory](docs/ARCHITECTURE_BASELINE.md)
- [Decisions](docs/DECISIONS.md), [migration status](docs/MIGRATION.md), [changelog](docs/CHANGELOG.md)
- [Known limitations](docs/KNOWN_LIMITATIONS.md) and [ranked risks](docs/RISK_REGISTER.md)

The existing app shortcuts remain. PIN dialog: Enter confirms, Escape cancels,
Tab/Shift+Tab stay within the dialog. A complete keyboard-first redesign is pending.
