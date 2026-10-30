import { expect, it } from 'vitest';
import { getProtocolHemaconWarning } from './protocol-hemacon';
import { completeProtocolDates } from '../test-fixtures/protocol';

const complete = {
  componentName: 'Эритроцитная взвесь',
  componentUnitNumber: '761022 000456 36',
  donorAbo: 'A(II)',
  ...completeProtocolDates,
};

it.each([
  ['collectionDate', 'дату заготовки гемакона'],
  ['expirationDate', 'дату окончания срока годности гемакона'],
  ['requestDateTime', 'дату и время подачи заявки'],
  ['transfusionDate', 'дату трансфузии'],
  ['startTime', 'время начала трансфузии'],
  ['endTime', 'время окончания трансфузии'],
])('requires %s even with complete hemacon data', (name, label) => {
  for (const value of ['', '   ']) {
    const warning = getProtocolHemaconWarning({ ...complete, [name]: value });
    expect(warning).toContain(label);
    expect(warning).not.toContain('• наименование компонента');
    expect(warning.split('•')).toHaveLength(2);
  }
});

it.each([
  ['collectionDate', '2026-02-30'],
  ['expirationDate', '01.11.2026'],
  ['transfusionDate', '0000-01-01'],
  ['requestDateTime', '2026-10-02'],
  ['requestDateTime', '2026-02-30T08:00'],
  ['requestDateTime', '2026-10-02T25:00'],
  ['startTime', '24:00'],
  ['endTime', '09:60'],
])('does not unlock actions with an invalid %s: %s', (name, value) => {
  expect(getProtocolHemaconWarning({ ...complete, [name]: value })).not.toBe('');
});

it('unlocks only with all required values, including midnight and leap-day dates', () => {
  expect(getProtocolHemaconWarning(complete)).toBe('');
  expect(
    getProtocolHemaconWarning({
      ...complete,
      collectionDate: '2024-02-29',
      requestDateTime: '2026-10-02T00:00',
      startTime: '00:00',
    }),
  ).toBe('');
});
