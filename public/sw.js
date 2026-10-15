/*
 * Master Chess service worker (offline play, spec Phase 5).
 * - Pages and RSC payloads: network first, cached copy when offline.
 * - Build assets, engine, puzzles, icons: cache first (they are immutable or versioned).
 * Bump VERSION to drop old caches after a format change.
 */
const VERSION = 'v1';
const PAGES = `mc-pages-${VERSION}`;
const ASSETS = `mc-assets-${VERSION}`;

/** Warmed on install so the main screens and the engine work offline right away. */
const PRECACHE_PAGES = ['/', '/learn', '/practice', '/practice/quiz', '/play', '/play/bot', '/play/local', '/profile', '/history'];
const PRECACHE_ASSETS = ['/engine/stockfish-19-lite-single.js', '/engine/stockfish-19-lite-single.wasm', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const pages = await caches.open(PAGES);
      await Promise.all(PRECACHE_PAGES.map((url) => pages.add(url).catch(() => undefined)));
      const assets = await caches.open(ASSETS);
      await Promise.all(PRECACHE_ASSETS.map((url) => assets.add(url).catch(() => undefined)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([PAGES, ASSETS]);
      for (const key of await caches.keys()) if (!keep.has(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

const isAsset = (url) =>
  url.pathname.startsWith('/_next/static/') ||
  url.pathname.startsWith('/engine/') ||
  url.pathname.startsWith('/puzzles/') ||
  url.pathname.startsWith('/icons/') ||
  /\.(?:woff2?|png|svg|ico|webp)$/.test(url.pathname);

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    const hit = (await cache.match(request)) ?? (request.mode === 'navigate' ? await cache.match('/') : undefined);
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/_vercel/')) return;
  event.respondWith(isAsset(url) ? cacheFirst(request) : networkFirst(request));
});
