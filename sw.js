const CACHE = 'xl-billing-shell-v2-1';
const ASSETS = ['./', './index.html', './styles/app.css', './src/main.js', './src/domain.js', './src/ui.js', './src/storage.js', './src/cache.js', './src/cloud.js', './src/export.js', './src/print.js', './src/features/invoice.js', './src/features/lists.js', './src/features/dialogs.js', './src/features/settings.js', './manifest.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('xl-billing-shell-') && key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !ASSETS.some(asset => new URL(asset, self.registration.scope).pathname === url.pathname)) return;
  // Network-first assets avoid pinning an old application after a deployment.
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy))); }
    return response;
  }).catch(() => caches.match(event.request).then(response => response || Response.error())));
});
