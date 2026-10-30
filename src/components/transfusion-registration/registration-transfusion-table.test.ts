import { expect, it } from 'vitest';
import {
  buildRegistrationTransfusionRow,
  parseRegistrationTransfusionRows,
  serializeRegistrationTransfusionRows,
} from './registration-transfusion-table';

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

const row = (id: number, date: string, startTime: string) =>
  buildRegistrationTransfusionRow({
    id,
    recipientId: 1,
    createdAt: 1,
    updatedAt: 1,
    values: {
      transfusionDate: date,
      startTime,
      endTime: '23:59',
      componentUnitNumber: '761022 000456 36',
    },
  });

it('retains starting time and unit number in a registration snapshot, including after parsing', () => {
  const original = row(1, '2026-10-30', '09:00');
  expect(original).toMatchObject({
    transfusionDate: '30.10.2026',
    transfusionTime: '09:00',
    componentUnitNumber: '761022 000456 36',
  });
  expect(
    parseRegistrationTransfusionRows({ registrationTransfusionRows: JSON.stringify([original]) }),
  ).toEqual([original]);
});

it('sorts snapshots across days, months and years, and by start time within a day', () => {
  const rows = [
    row(1, '2026-01-01', '08:00'),
    row(7, '2025-12-31', '23:00'),
    row(3, '2026-01-01', '07:00'),
    row(5, '2026-02-01', '00:00'),
    row(8, '', ''),
  ];
  const values = { registrationTransfusionRows: JSON.stringify(rows) };
  expect(parseRegistrationTransfusionRows(values).map(({ protocolId }) => protocolId)).toEqual([
    7, 3, 1, 5, 8,
  ]);
  expect(
    JSON.parse(serializeRegistrationTransfusionRows(rows)).map(
      (item: { protocolId: number }) => item.protocolId,
    ),
  ).toEqual([7, 3, 1, 5, 8]);
  expect(rows.map(({ protocolId }) => protocolId)).toEqual([1, 7, 3, 5, 8]);
});

it('keeps legacy date-only rows and places unknown dates after known dates', () => {
  const rows = [
    { protocolId: 1, componentName: 'Без даты', transfusionDate: '' },
    { protocolId: 2, componentName: 'Поздний', transfusionDate: '01.02.2026' },
    { protocolId: 3, componentName: 'Ранний', transfusionDate: '31.01.2026' },
  ];
  const parsed = parseRegistrationTransfusionRows({
    registrationTransfusionRows: JSON.stringify(rows),
  });
  expect(parsed.map(({ protocolId }) => protocolId)).toEqual([3, 2, 1]);
  expect(parsed[0].componentName).toBe('Ранний');
  expect(parsed[0]).not.toHaveProperty('componentUnitNumber');
});
