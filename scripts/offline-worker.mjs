/* global CACHE_NAME, PRECACHE */
const CACHE_PREFIX = 'blood-static-';
const APP_ROOT = self.registration.scope;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE.map((path) => new URL(path, APP_ROOT).href)),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (names) => {
      await Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    }),
  );
});

const findCachedResponse = async (cache, request) => {
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  if (request.mode === 'navigate') return cache.match(APP_ROOT);
  return undefined;
};

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(APP_ROOT))
    return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok) return response;
        return (await findCachedResponse(cache, request)) ?? response;
      } catch (error) {
        const cached = await findCachedResponse(cache, request);
        if (cached) return cached;
        throw error;
      }
    }),
  );
});
