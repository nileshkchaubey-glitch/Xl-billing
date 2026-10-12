# Xl-billing

Browser-based billing application. The app is maintained in `index.html` and
stores billing data in browser localStorage.

Live app: https://nileshkchaubey-glitch.github.io/Xl-billing/

## Development environment

Use Node.js 24 LTS (see `.nvmrc`) and npm.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, normally http://localhost:5173.
The server listens on all interfaces for cloud workspace previews.
On a phone, use the workspace's forwarded preview URL; localhost refers to
the phone itself and will not reach the cloud workspace.

## Verification and build

```sh
npm test
npm run build
npm run preview
```

The existing invoice regression checks run using Node.js. The build produces
`dist/` with the `/Xl-billing/` base path for GitHub Pages. The production preview
normally runs at http://localhost:4173/Xl-billing/.
`qa/mobile.html` provides the existing mobile QA page.

GitHub Pages can continue serving the root `index.html`; using the local build
does not change the deployed site or its publishing configuration.

## Data and optional integrations

No environment variables, backend, database server, or API keys are required
for the core app. Optional JSONBin and Google Sheets sync are configured through
the app's settings using your own accounts.

Browser storage is separate for each origin and browser. Development and
production do not share billing records automatically. Use the app's backup
export/import or configured cloud sync when moving records between devices.
Do not commit real billing exports or integration credentials to this repository.
