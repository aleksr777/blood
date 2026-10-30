import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { createServer } from 'vite';

it('serves every development icon link from the app base exactly once', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const server = await createServer({
    root,
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    logLevel: 'silent',
  });
  try {
    const base = server.config.base;
    expect(base).toBe('/blood/');
    const html = await server.transformIndexHtml(
      base,
      readFileSync(new URL('../index.html', import.meta.url), 'utf8'),
    );
    const links = [...html.matchAll(/<link\b[^>]*>/g)]
      .filter(([tag]) => /\brel="(?:icon|apple-touch-icon|mask-icon|manifest)"/.test(tag))
      .map(([tag]) => tag.match(/\bhref="([^"]+)"/)![1]);
    const metadata = [...html.matchAll(/<meta\b[^>]*>/g)]
      .filter(([tag]) => /\bname="msapplication-(?:TileImage|config)"/i.test(tag))
      .map(([tag]) => tag.match(/\bcontent="([^"]+)"/)![1]);
    expect(links.length).toBeGreaterThan(0);
    expect(metadata).toHaveLength(2);
    for (const href of [...links, ...metadata]) {
      const url = new URL(href, `http://localhost:5173${base}`);
      expect(url.pathname, href).toMatch(/^\/blood\//);
      expect(url.pathname, href).not.toContain('/blood/blood/');
      const file = new URL(`../public/${url.pathname.slice(base.length)}`, import.meta.url);
      expect(existsSync(file), href).toBe(true);
      expect(statSync(file).size, href).toBeGreaterThan(0);
    }
  } finally {
    await server.close();
  }
}, 15000);
