const CACHE_NAME = "blood-static-a8669bea2dc27941";
const PRECACHE = ["./","apple-touch-icon.png","assets/database.worker-2MKA7NC3.js","assets/index-CCWxbZ4o.css","assets/index-bOWlb3Sn.js","assets/sqlite3-Con_VOcu.wasm","assets/sqlite3-opfs-async-proxy-Ck-yCayi.js","assets/sqlite3-worker1-CykUr7IN.js","browserconfig.xml","favicon.ico","favicon.svg","icons/apple-touch-120.png","icons/apple-touch-152.png","icons/apple-touch-167.png","icons/blood-16.png","icons/blood-192.png","icons/blood-32.png","icons/blood-48.png","icons/blood-512.png","icons/blood-96.png","icons/blood-maskable-192.png","icons/blood-maskable-512.png","icons/mstile-150.png","icons/mstile-310.png","icons/mstile-310x150.png","icons/mstile-70.png","safari-pinned-tab.svg","site.webmanifest"];
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
