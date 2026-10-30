import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'assets/branding/blood-mark.svg'), 'utf8');
const mark = source.match(/<g[\s\S]*<\/g>/)?.[0];
if (!mark) throw new Error('The master SVG must contain the blood-bag mark.');

let convert = 'magick';
try {
  execFileSync(convert, ['-version'], { stdio: 'ignore' });
} catch {
  convert = 'convert';
}
execFileSync(convert, ['-version'], { stdio: 'ignore' });
execFileSync('inkscape', ['--version'], { stdio: 'ignore' });

const output = (name) => join(root, 'public', name);
const temporary = mkdtempSync(join(tmpdir(), 'blood-icons-'));
const temporaryIcon = output(`.favicon-${process.pid}.tmp`);
const render = (args) => execFileSync(convert, args, { stdio: 'pipe' });
const png = (input, size, name) =>
  render([
    input,
    '-filter',
    'Lanczos',
    '-resize',
    `${size}x${size}`,
    '-alpha',
    'off',
    '-strip',
    `PNG24:${output(name)}`,
  ]);

try {
  writeFileSync(
    output('favicon.svg'),
    source.replace(/(<svg[^>]*>)/, '$1\n  <rect width="1024" height="1024" fill="#fff"/>'),
  );
  writeFileSync(
    output('safari-pinned-tab.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">\n  <g transform="scale(0.015625)">${mark.replaceAll('#e60012', '#000')}</g>\n</svg>\n`,
  );

  const master = join(temporary, 'master.png');
  execFileSync('inkscape', [
    output('favicon.svg'),
    '--export-type=png',
    `--export-filename=${master}`,
    '--export-width=2048',
    '--export-background=#fff',
    '--export-background-opacity=1',
  ]);

  for (const size of [16, 32, 48, 96, 192, 512]) png(master, size, `icons/blood-${size}.png`);
  for (const size of [120, 152, 167]) png(master, size, `icons/apple-touch-${size}.png`);
  png(master, 180, 'apple-touch-icon.png');

  const maskable = join(temporary, 'maskable.png');
  render([
    master,
    '-resize',
    '1536x1536',
    '-background',
    'white',
    '-gravity',
    'center',
    '-extent',
    '2048x2048',
    maskable,
  ]);
  for (const size of [192, 512]) png(maskable, size, `icons/blood-maskable-${size}.png`);
  for (const size of [70, 150, 310]) png(master, size, `icons/mstile-${size}.png`);
  render([
    master,
    '-resize',
    '150x150',
    '-background',
    'white',
    '-gravity',
    'center',
    '-extent',
    '310x150',
    '-alpha',
    'off',
    '-strip',
    `PNG24:${output('icons/mstile-310x150.png')}`,
  ]);
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const frames = sizes.map((size) => {
    const path = join(temporary, `icon-${size}.png`);
    render([master, '-filter', 'Lanczos', '-resize', `${size}x${size}`, '-strip', `PNG32:${path}`]);
    const bytes = readFileSync(path);
    if (
      bytes.length < 33 ||
      !bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) ||
      bytes.readUInt32BE(16) !== size ||
      bytes.readUInt32BE(20) !== size
    )
      throw new Error(`Cannot generate the ${size}px ICO bitmap.`);
    return bytes;
  });
  const directory = Buffer.alloc(6 + 16 * frames.length);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(frames.length, 4);
  let offset = directory.length;
  frames.forEach((frame, index) => {
    const entry = 6 + index * 16;
    directory[entry] = sizes[index] % 256;
    directory[entry + 1] = sizes[index] % 256;
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(frame.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += frame.length;
  });
  writeFileSync(temporaryIcon, Buffer.concat([directory, ...frames]));
  renameSync(temporaryIcon, output('favicon.ico'));
  console.log('Generated SVG, ICO, PNG, Apple, maskable and Windows icons from blood-mark.svg.');
} finally {
  rmSync(temporaryIcon, { force: true });
  rmSync(temporary, { recursive: true, force: true });
}
