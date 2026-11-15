import { expect, it } from 'vitest';
import { printPageLabel } from './print-page-label';

it('uses a common print label for one-page and multi-page forms', () => {
  expect(printPageLabel(1, 1)).toBe('Печать страницы');
  expect(printPageLabel(1, 2)).toBe('Печать страницы 1');
  expect(printPageLabel(2, 2)).toBe('Печать страницы 2');
  expect(printPageLabel(3, 3)).toBe('Печать страницы 3');
});
