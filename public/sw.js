/* eslint-disable no-restricted-globals */
/**
 * Service worker for Circle.
 *
 * Deliberately hand-written rather than generated, so the caching rules are
 * explicit and auditable. Three rules, in priority order:
 *
 *   1. API and auth traffic      -> never touched. Straight to the network.
 *   2. Navigations (HTML)        -> network first, cached shell as fallback.
 *   3. Same-origin static assets -> stale-while-revalidate.
 *
 * Rule 1 is the important one. This app keeps a JWT in localStorage and reads
 * per-user data from /api/*; caching any of that would risk showing one
 * account another account's books, or serving a stale session. Authenticated
 * responses are never stored.
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `circle-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `circle-assets-${CACHE_VERSION}`;
const OWNED_CACHES = new Set([SHELL_CACHE, ASSET_CACHE]);

const PRECACHE_URLS = ['/', '/index.html', '/favicon.svg', '/offline.html'];
const NEVER_CACHE_PREFIXES = ['/api/', '/auth/callback'];

/* ------------------------------------------------------------------ lifecycle */

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Individually, so one 404 cannot fail the whole install.
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => {})
        )
      );
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from older versions.
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith('circle-') && !OWNED_CACHES.has(n)).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

/**
 * Lets the page trigger activation of a waiting worker, so an update can be
 * applied on the user's command instead of only after every tab closes.
 */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

/* --------------------------------------------------------------- fetch rules */

function isNeverCached(url) {
  return NEVER_CACHE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    // Keep the shell fresh for the next offline launch.
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put('/index.html', response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    return (
      (await cache.match('/index.html')) ||
      (await cache.match('/offline.html')) ||
      new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response.ok && response.type === 'basic') {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => undefined);

  // Serve the cached copy immediately when present; refresh in the background.
  if (cached) {
    void network;
    return cached;
  }

  const response = await network;
  if (response) return response;
  return new Response('', { status: 504 });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only GET is ever cacheable; mutations must always reach the server.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Cross-origin (Open Library covers, Google avatars) is left to the browser.
  if (url.origin !== self.location.origin) return;

  // Rule 1: never intercept API or OAuth traffic.
  if (isNeverCached(url)) return;

  // Rule 2: navigations.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Rule 3: same-origin static assets.
  event.respondWith(staleWhileRevalidate(request));
});
