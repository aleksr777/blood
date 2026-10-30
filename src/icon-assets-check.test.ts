import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../', import.meta.url));
let fixture: string;

beforeEach(() => {
  fixture = mkdtempSync(join(tmpdir(), 'blood-icon-check-'));
  mkdirSync(join(fixture, 'scripts'));
  cpSync(join(root, 'scripts/check-icons.mjs'), join(fixture, 'scripts/check-icons.mjs'));
  cpSync(join(root, 'public'), join(fixture, 'public'), { recursive: true });
  cpSync(join(root, 'index.html'), join(fixture, 'index.html'));
});

afterEach(() => rmSync(fixture, { recursive: true, force: true }));

const check = (directory?: string) =>
  spawnSync(process.execPath, ['scripts/check-icons.mjs', ...(directory ? [directory] : [])], {
    cwd: fixture,
    encoding: 'utf8',
    timeout: 10000,
  });

it('checks all source icons without installed packages', () => {
  const result = check();
  expect(result.error).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain('Verified 19 complete icon images');
});

it('checks built icon references under the app base without installed packages', () => {
  cpSync(join(fixture, 'public'), join(fixture, 'dist'), { recursive: true });
  const html = readFileSync(join(fixture, 'index.html'), 'utf8').replace(/="\//g, '="/blood/');
  writeFileSync(join(fixture, 'dist/index.html'), html);
  const result = check('dist');
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain('Verified 19 complete icon images');
});

it('rejects an empty favicon instead of silently accepting it', () => {
  writeFileSync(join(fixture, 'public/favicon.ico'), '');
  const result = check();
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('favicon.ico: empty image');
});

it('checks Windows tile references as well as HTML and manifest icons', () => {
  rmSync(join(fixture, 'public/icons/mstile-310x150.png'));
  const result = check();
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('mstile-310x150.png');
});

it('rejects truncated PNG pixels', () => {
  const path = join(fixture, 'public/icons/blood-16.png');
  writeFileSync(path, readFileSync(path).subarray(0, 33));
  const result = check();
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('blood-16.png: incomplete PNG image');
});

it('does not mistake a commented-out SVG path for a drawing', () => {
  writeFileSync(
    join(fixture, 'public/favicon.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg"><!-- <path d="M0 0h1v1z"/> --></svg>',
  );
  const result = check();
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('favicon.svg: empty SVG drawing');
});
