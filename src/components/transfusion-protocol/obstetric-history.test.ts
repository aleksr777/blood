import { expect, it } from 'vitest';
import { formatObstetricHistory, hasNoPregnancies } from './obstetric-history';
import type { ProtocolValues } from './protocol-types';

it.each([
  ['1', ['беременность', 'раз', 'самопроизвольный аборт']],
  ['2', ['беременности', 'раза', 'самопроизвольных аборта']],
  ['4', ['беременности', 'раза', 'самопроизвольных аборта']],
  ['5', ['беременностей', 'раз', 'самопроизвольных абортов']],
  ['11', ['беременностей', 'раз', 'самопроизвольных абортов']],
  ['12', ['беременностей', 'раз', 'самопроизвольных абортов']],
  ['14', ['беременностей', 'раз', 'самопроизвольных абортов']],
  ['21', ['беременность', 'раз', 'самопроизвольный аборт']],
  ['22', ['беременности', 'раза', 'самопроизвольных аборта']],
  ['25', ['беременностей', 'раз', 'самопроизвольных абортов']],
  ['31', ['беременность', 'раз', 'самопроизвольный аборт']],
  ['99', ['беременностей', 'раз', 'самопроизвольных абортов']],
] as const)('uses natural Russian count forms for %s', (count, [pregnancies, times, abortions]) => {
  const values = Object.freeze({
    recipientPregnanciesCount: count,
    recipientBirthsCount: count,
    recipientSpontaneousAbortionsCount: count,
  });
  expect(formatObstetricHistory(values)).toBe(
    `В анамнезе ${count} ${pregnancies}. Роды — ${count} ${times}. ` +
      `${count} ${abortions} в анамнезе.`,
  );
});

it.each([
  ['Да', 'Гемолитическая болезнь новорождённых отмечалась.'],
  ['Нет', 'Гемолитическая болезнь новорождённых не отмечалась.'],
  [' ДА ', 'Гемолитическая болезнь новорождённых отмечалась.'],
  [' нет ', 'Гемолитическая болезнь новорождённых не отмечалась.'],
  ['неизвестно', 'Сведения о гемолитической болезни новорождённых неизвестны.'],
  ['', ''],
  [' ', ''],
])('formats explicit newborn history %j without guessing missing data', (value, expected) => {
  expect(formatObstetricHistory({ recipientHemolyticDiseaseNewbornHistory: value })).toBe(expected);
});

it('formats padded counts without changing stored values', () => {
  const values = Object.freeze({
    recipientPregnanciesCount: '01',
    recipientBirthsCount: '02',
    recipientSpontaneousAbortionsCount: ' 05 ',
  });
  expect(formatObstetricHistory(values)).toBe(
    'В анамнезе 1 беременность. Роды — 2 раза. ' + '5 самопроизвольных абортов в анамнезе.',
  );
  expect(values.recipientPregnanciesCount).toBe('01');
});

it.each(['-1', '1.5', '1e1', '9007199254740993'])(
  'retains unrecognized earlier count %s as entered',
  (value) => {
    expect(formatObstetricHistory({ recipientPregnanciesCount: value })).toBe(
      `Количество беременностей: ${value}.`,
    );
  },
);

it.each(['0', '00', ' 0 '])('omits all dependent history for explicit zero %j', (zero) => {
  const values = Object.freeze({
    recipientPregnanciesCount: zero,
    recipientBirthsCount: '2',
    recipientSpontaneousAbortionsCount: '1',
    recipientHemolyticDiseaseNewbornHistory: 'Да',
  });
  expect(hasNoPregnancies(values)).toBe(true);
  expect(formatObstetricHistory(values)).toBe('Беременностей не было');
  expect(values.recipientBirthsCount).toBe('2');
});

it.each([undefined, '', ' ', '1', '99', 'неизвестно'])(
  'does not interpret pregnancy count %j as no pregnancies',
  (value) => {
    const values: ProtocolValues = value === undefined ? {} : { recipientPregnanciesCount: value };
    expect(hasNoPregnancies(values)).toBe(false);
  },
);

it('collapses four explicit unknown values but keeps partial unknown information', () => {
  const unknown = {
    recipientPregnanciesCount: 'Не известно',
    recipientBirthsCount: 'Не известно',
    recipientSpontaneousAbortionsCount: 'Не известно',
    recipientHemolyticDiseaseNewbornHistory: 'Не известно',
  };
  expect(formatObstetricHistory(unknown)).toBe('Не известен');
  expect(formatObstetricHistory({ ...unknown, recipientBirthsCount: '3' })).toBe(
    'Количество беременностей неизвестно. Роды — 3 раза. ' +
      'Количество самопроизвольных абортов неизвестно. ' +
      'Сведения о гемолитической болезни новорождённых неизвестны.',
  );
});
