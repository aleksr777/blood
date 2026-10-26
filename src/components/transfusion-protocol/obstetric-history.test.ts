import { expect, it } from 'vitest';
import { formatObstetricHistory } from './obstetric-history';

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
    `${count} ${pregnancies} в анамнезе; Роды в анамнезе были ${count} ${times}; ` +
      `${count} ${abortions} в анамнезе`,
  );
});

it.each([
  ['Да', 'Гемолитическая болезнь новорождённых в анамнезе отмечалась'],
  ['Нет', 'Гемолитической болезни новорождённых в анамнезе не было'],
  [' ДА ', 'Гемолитическая болезнь новорождённых в анамнезе отмечалась'],
  [' нет ', 'Гемолитической болезни новорождённых в анамнезе не было'],
  ['неизвестно', 'Гемолитическая болезнь новорождённых в анамнезе: неизвестно'],
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
    '1 беременность в анамнезе; Роды в анамнезе были 2 раза; ' +
      '5 самопроизвольных абортов в анамнезе',
  );
  expect(values.recipientPregnanciesCount).toBe('01');
});

it.each(['-1', '1.5', '1e1', '9007199254740993'])(
  'retains unrecognized earlier count %s as entered',
  (value) => {
    expect(formatObstetricHistory({ recipientPregnanciesCount: value })).toBe(
      `Количество беременностей: ${value}`,
    );
  },
);
