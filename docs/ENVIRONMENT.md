# Managed workspace environment

Node 24.19.0, npm 11.9.0, Python 3.12.14 are available. Project dependencies are
locked in package-lock.json. Playwright Chromium, Firefox and WebKit are installed.
Development server uses port 5173; isolated test server uses 127.0.0.1:4180.
Run one test invocation at a time to avoid port conflicts.

WebKit's system dependencies could not be installed through `su` in this environment.
Debian packages were downloaded into /tmp/xl-browser-libs and their missing shared
libraries copied into Playwright's GTK/WPE browser-local sys/lib folders. Packages:
libgtk-4-1, libgraphene-1.0-0, libharfbuzz-icu0, libmanette-0.2-0, libhyphen0,
libgles2, libcairo-script-interpreter2, libhidapi-hidraw0, libglvnd0, liblzo2-2.
The browser wrapper sets its own loader path, so a shell-only LD_LIBRARY_PATH was
insufficient. The config recognizes the temporary fallback and skips the static
host dependency lookup, which does not search that bundle for GLES. Actual WebKit
browser launch, offline file origin and test journeys passed.

This temporary environment preparation is not an app runtime dependency and is
not shipped in index.html. For a normal fresh environment use:

```sh
npm ci
npx playwright install --with-deps chromium firefox webkit
npm test
```

Git remotes connect through the user's authorized GitHub connection. Repository-local
commits use the GitHub noreply address; no passwords or access tokens were requested.
