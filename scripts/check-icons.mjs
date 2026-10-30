import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

// These repository-owned files only need tag names and quoted attributes, not a DOM.
// Keep the predev check runnable with Node alone, before dependencies are installed.
const tags = (markup) =>
  [
    ...markup
      .replace(/<!--[\s\S]*?-->/g, '')
      .matchAll(/<([a-z][\w:-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi),
  ].map(([, name, source]) => ({
    name: name.toLowerCase(),
    attributes: Object.fromEntries(
      [...source.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(
        ([, key, doubleQuoted, singleQuoted]) => [key.toLowerCase(), doubleQuoted ?? singleQuoted],
      ),
    ),
  }));
const hasRel = (attributes, rel) => (attributes.rel ?? '').toLowerCase().split(/\s+/).includes(rel);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const directory = process.argv[2] ?? 'public';
const html = readFileSync(
  join(root, directory === 'public' ? 'index.html' : `${directory}/index.html`),
  'utf8',
);
const elements = tags(html.replaceAll('%BASE_URL%', '/'));
const manifestLink = elements.find(
  ({ name, attributes }) => name === 'link' && hasRel(attributes, 'manifest'),
);
assert(manifestLink?.attributes.href, 'Missing application manifest link.');
const origin = 'https://icons.invalid';
const manifestUrl = new URL(manifestLink.attributes.href, origin);
const base = new URL('./', manifestUrl);
const images = new Map();
const read = (url) => {
  assert.equal(url.origin, base.origin, `Unexpected icon origin: ${url}`);
  assert(url.pathname.startsWith(base.pathname), `Icon outside the app path: ${url}`);
  return readFileSync(
    join(root, directory, decodeURIComponent(url.pathname.slice(base.pathname.length))),
  );
};

const pngSize = (bytes, name) => {
  assert(
    bytes.length >= 33 && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')),
    `${name}: invalid PNG header`,
  );
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR', `${name}: missing IHDR`);
  const size = `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
  const compressed = [];
  let ended = false;
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    assert(offset + length + 12 <= bytes.length, `${name}: truncated PNG chunk`);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') compressed.push(bytes.subarray(offset + 8, offset + 8 + length));
    if (type === 'IEND') {
      ended = true;
      break;
    }
    offset += length + 12;
  }
  assert(ended && compressed.length > 0, `${name}: incomplete PNG image`);
  assert(inflateSync(Buffer.concat(compressed)).length > 0, `${name}: empty PNG pixels`);
  return size;
};

const icoSizes = (bytes, name) => {
  assert(bytes.length >= 6, `${name}: empty or truncated ICO header`);
  assert.equal(bytes.readUInt16LE(0), 0, `${name}: invalid ICO header`);
  assert.equal(bytes.readUInt16LE(2), 1, `${name}: not an icon file`);
  const count = bytes.readUInt16LE(4);
  assert(count > 0 && bytes.length >= 6 + count * 16, `${name}: missing icon directory`);
  const sizes = [];
  for (let index = 0; index < count; index++) {
    const entry = 6 + index * 16;
    const width = bytes[entry] || 256;
    const height = bytes[entry + 1] || 256;
    const length = bytes.readUInt32LE(entry + 8);
    const offset = bytes.readUInt32LE(entry + 12);
    assert(
      length > 0 && offset >= 6 + count * 16 && offset + length <= bytes.length,
      `${name}: missing bitmap ${index}`,
    );
    const size = `${width}x${height}`;
    assert.equal(pngSize(bytes.subarray(offset, offset + length), `${name} (${size})`), size);
    sizes.push(size);
  }
  return sizes;
};

const verify = (raw, relativeTo = base, sizes = '') => {
  const url = new URL(raw.replaceAll('%BASE_URL%', base.pathname), relativeTo);
  const name = url.pathname;
  const bytes = read(url);
  assert(bytes.length > 0, `${name}: empty image`);
  if (name.endsWith('.png')) {
    const size = pngSize(bytes, name);
    if (sizes)
      assert(sizes.split(/\s+/).includes(size), `${name}: incorrect declared size ${sizes}`);
  } else if (name.endsWith('.ico')) {
    const actual = icoSizes(bytes, name);
    for (const size of sizes.split(/\s+/).filter(Boolean))
      assert(actual.includes(size), `${name}: missing ${size}`);
  } else if (name.endsWith('.svg')) {
    const svg = tags(bytes.toString());
    assert(
      svg.some((tag) => tag.name === 'svg') &&
        svg.some((tag) => tag.name === 'path' && tag.attributes.d?.trim()),
      `${name}: empty SVG drawing`,
    );
  } else throw new Error(`Unknown icon format: ${name}`);
  images.set(name, bytes.length);
};

for (const { name, attributes } of elements) {
  if (
    name === 'link' &&
    ['icon', 'apple-touch-icon', 'mask-icon'].some((rel) => hasRel(attributes, rel))
  )
    verify(attributes.href, base, attributes.sizes ?? '');
}
const manifest = JSON.parse(read(manifestUrl).toString());
for (const icon of manifest.icons) verify(icon.src, manifestUrl, icon.sizes);
const metadata = (key) =>
  elements.find(({ name, attributes }) => name === 'meta' && attributes.name?.toLowerCase() === key)
    ?.attributes.content;
const tile = metadata('msapplication-tileimage');
if (tile) verify(tile);
const configuration = metadata('msapplication-config');
if (configuration) {
  const url = new URL(configuration.replaceAll('%BASE_URL%', base.pathname), base);
  for (const { attributes } of tags(read(url).toString()))
    if (attributes.src) verify(attributes.src, url);
}
assert(images.size > 0, 'No application icons were found.');
console.log(`Verified ${images.size} complete icon images and their references in ${directory}.`);
