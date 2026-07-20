// EasyWay POS Service Worker
// Strategy:
//   - Navigation (HTML)  → Network-first: always fetch fresh index.html so new
//     deployments are picked up immediately. Fallback to cache only when offline.
//   - Hashed assets (JS/CSS with content-hash in filename) → Cache-first: these
//     are immutable by design (Vite changes the hash when content changes).
//   - API requests → Pass through: never intercepted.
//   - Everything else → Network-first with cache fallback.

const CACHE_VERSION = 'easyway-v3';
const ASSET_CACHE   = `${CACHE_VERSION}-assets`;
const PAGE_CACHE    = `${CACHE_VERSION}-pages`;

// ─── Install ──────────────────────────────────────────────────────────────────
// skipWaiting so the new SW takes over immediately without waiting for all
// tabs to close. Combined with clients.claim() in activate this means users
// get the new version on the very next navigation.
self.addEventListener('install', () => {
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────
// Claim all open clients and delete every cache that belongs to an old version.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('easyway-') && k !== ASSET_CACHE && k !== PAGE_CACHE)
            .map((k) => caches.delete(k))
        )
      ),
    ])
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never intercept API calls — always hit the network.
  if (url.pathname.startsWith('/api/')) return;

  // 2. Navigation requests (loading a page) — network-first.
  //    This guarantees the browser always gets the latest index.html after a
  //    deployment. The SW caches the response for offline fallback only.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(PAGE_CACHE).then((c) => c.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 3. Hashed static assets — cache-first.
  //    Vite appends a content hash (8 hex chars) before the extension, e.g.
  //    /assets/index-B4iRoQ6m.js. These files are immutable: if the content
  //    changes the hash changes, so it's safe to serve forever from cache.
  const isHashedAsset = /\/assets\/[^/]+-[0-9a-zA-Z]{8}\.(js|css|woff2?|ttf|otf|png|jpg|svg|webp)$/.test(url.pathname);
  if (isHashedAsset) {
    event.respondWith(
      caches.open(ASSET_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // 4. Everything else (manifest, icons, fonts) — network-first, cache fallback.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(PAGE_CACHE).then((c) => c.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
