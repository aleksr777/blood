import { expect, it } from 'vitest';
import { getHemaconDateOrderWarning } from './hemacon-dates';

it.each([
  ['2026-10-26', '2026-10-26'],
  ['2026-10-27', '2026-10-26'],
])('warns when collection %s is not before expiration %s', (collectionDate, expirationDate) => {
  expect(getHemaconDateOrderWarning({ collectionDate, expirationDate })).toContain(
    'должна быть раньше',
  );
});

it.each([
  ['2026-10-25', '2026-10-26'],
  ['', '2026-10-26'],
  ['2026-10-26', ''],
  ['', ''],
  ['2026-02-30', '2026-02-28'],
  ['не дата', '2026-10-26'],
])(
  'does not warn for valid order or incomplete dates: %s, %s',
  (collectionDate, expirationDate) => {
    expect(getHemaconDateOrderWarning({ collectionDate, expirationDate })).toBe('');
  },
);
