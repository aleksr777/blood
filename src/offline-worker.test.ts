import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';

it('starts from cached assets after the network is disconnected', async () => {
  const listeners = new Map<string, (event: unknown) => void>();
  const stored = new Map<string, Map<string, string>>();
  const root = 'https://example.test/blood/';
  const cacheName = 'blood-static-current';
  stored.set('blood-static-old', new Map());
  const cacheStorage = {
    open: async (name: string) => {
      let entries = stored.get(name);
      if (!entries) {
        entries = new Map();
        stored.set(name, entries);
      }
      const cache = entries;
      return {
        addAll: async (urls: string[]) => {
          urls.forEach((url) => cache.set(url, url));
        },
        match: async (request: { url: string } | string) => {
          const url = typeof request === 'string' ? request : request.url;
          return cache.get(url.split('?')[0]);
        },
      };
    },
    keys: async () => [...stored.keys()],
    delete: async (name: string) => stored.delete(name),
  };
  let claimed = false;
  const source = readFileSync(new URL('../scripts/offline-worker.mjs', import.meta.url), 'utf8');
  runInNewContext(
    `const CACHE_NAME = '${cacheName}'; const PRECACHE = ['./', 'assets/app.js', 'assets/sqlite.wasm'];\n${source}`,
    {
      URL,
      caches: cacheStorage,
      fetch: () => Promise.reject(new Error('Network is disconnected')),
      self: {
        registration: { scope: root },
        location: { origin: 'https://example.test' },
        clients: {
          claim: async () => {
            claimed = true;
          },
        },
        addEventListener: (name: string, listener: (event: unknown) => void) => {
          listeners.set(name, listener);
        },
      },
    },
  );

  const run = async (name: string, event: Record<string, unknown> = {}) => {
    let response: Promise<unknown> | undefined;
    listeners.get(name)?.({
      ...event,
      waitUntil: (promise: Promise<unknown>) => {
        response = promise;
      },
      respondWith: (promise: Promise<unknown>) => {
        response = promise;
      },
    });
    return response;
  };

  await run('install');
  await run('activate');
  expect(claimed).toBe(true);
  expect(stored.has('blood-static-old')).toBe(false);
  expect(stored.get(cacheName)?.size).toBe(3);
  await expect(
    run('fetch', { request: { method: 'GET', mode: 'navigate', url: `${root}archive` } }),
  ).resolves.toBe(root);
  await expect(
    run('fetch', { request: { method: 'GET', mode: 'cors', url: `${root}assets/sqlite.wasm` } }),
  ).resolves.toBe(`${root}assets/sqlite.wasm`);
});
