import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
const listFiles = (directory, prefix = '') =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${prefix}${entry.name}`;
    return entry.isDirectory() ? listFiles(join(directory, entry.name), `${path}/`) : [path];
  });

const files = listFiles(dist).filter((file) => file !== 'sw.js').sort();
const digest = createHash('sha256');
for (const file of files) {
  digest.update(file);
  digest.update(readFileSync(join(dist, file)));
}

const cacheName = `blood-static-${digest.digest('hex').slice(0, 16)}`;
const paths = ['./', ...files.filter((file) => file !== 'index.html')];
const worker = readFileSync(join(root, 'scripts/offline-worker.mjs'), 'utf8');
writeFileSync(
  join(dist, 'sw.js'),
  `const CACHE_NAME = ${JSON.stringify(cacheName)};\n` +
    `const PRECACHE = ${JSON.stringify(paths)};\n` +
    worker,
);
console.log(`Prepared ${paths.length} files for offline use (${cacheName}).`);
