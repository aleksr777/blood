import { expect, it } from 'vitest';
import { buildRegistrationTransfusionRow } from './registration-transfusion-table';

it.each([
  [undefined, ''],
  ['', ''],
  ['   ', ''],
  ['не указан', ''],
  ['-10', ''],
  ['250', '0,25'],
  ['350,5', '0,351'],
  ['0', '0'],
])('converts only a specified valid volume %j to liters %j', (amountMl, expected) => {
  const row = buildRegistrationTransfusionRow({
    id: 1,
    recipientId: 1,
    createdAt: 1,
    updatedAt: 1,
    values: amountMl === undefined ? {} : { amountMl },
  });
  expect(row.amountLiters).toBe(expected);
});
