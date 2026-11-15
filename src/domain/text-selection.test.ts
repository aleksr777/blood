import { expect, it } from 'vitest';
import { resolveTextSelectionMode } from './text-selection';

it.each([
  [true, undefined, 'enabled'],
  [false, undefined, 'disabled'],
  [true, 'false', 'disabled'],
  [false, 'true', 'enabled'],
  [true, 'true', 'enabled'],
  [false, 'false', 'disabled'],
] as const)('выбирает режим выделения (dev=%s, override=%s)', (development, override, mode) => {
  expect(resolveTextSelectionMode(development, override)).toBe(mode);
});
