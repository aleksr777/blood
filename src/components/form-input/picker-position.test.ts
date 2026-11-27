// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { getPickerPosition } from './picker-position';

afterEach(() => vi.restoreAllMocks());

it('keeps a calendar inside the viewport when the input is near the lower right edge', () => {
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(320);
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(600);
  const anchor = document.createElement('button');
  vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
    left: 278,
    right: 306,
    top: 540,
    bottom: 568,
  } as DOMRect);
  expect(getPickerPosition(anchor, 288, 330)).toEqual({ top: 206, left: 24 });
});
