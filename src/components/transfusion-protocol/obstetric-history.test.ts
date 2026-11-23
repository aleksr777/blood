import { expect, it } from 'vitest';
import { formatObstetricHistory, hasNoPregnancies } from './obstetric-history';
import type { ProtocolValues } from './protocol-types';

it('prints each known count as a separate statement', () => {
  expect(
    formatObstetricHistory({
      recipientPregnanciesCount: '2',
      recipientBirthsCount: '1',
      recipientSpontaneousAbortionsCount: '1',
      recipientHemolyticDiseaseNewbornHistory: 'Было',
    }),
  ).toBe(
    'Количество беременностей в анамнезе - 2. Количество родов в анамнезе - 1. ' +
      'Количество самопроизвольных абортов в анамнезе - 1. ' +
      'В анамнезе была гемолитическая болезнь новорождённого.',
  );
});

it('prints the requested statements for absent events', () => {
  expect(
    formatObstetricHistory({
      recipientPregnanciesCount: '3',
      recipientBirthsCount: '0',
      recipientSpontaneousAbortionsCount: 'Не было',
      recipientHemolyticDiseaseNewbornHistory: 'Нет',
    }),
  ).toBe(
    'Количество беременностей в анамнезе - 3. Родов не было. ' +
      'Самопроизвольных абортов не было.',
  );
  expect(
    formatObstetricHistory({
      recipientPregnanciesCount: '3',
      recipientBirthsCount: '1',
      recipientHemolyticDiseaseNewbornHistory: 'Не было',
    }),
  ).toBe(
    'Количество беременностей в анамнезе - 3. Количество родов в анамнезе - 1. ' +
      'Гемолитической болезни новорождённого в анамнезе не было.',
  );
});

it('prints individual unknown choices only for active fields', () => {
  const unknown = {
    recipientPregnanciesCount: 'Не известно',
    recipientBirthsCount: 'Не известно',
    recipientSpontaneousAbortionsCount: 'Не известно',
    recipientHemolyticDiseaseNewbornHistory: 'Не известно',
  };
  expect(formatObstetricHistory(unknown)).toBe(
    'Количество беременностей - не известно. Количество родов - не известно. ' +
      'Количество самопроизвольных абортов - не известно.',
  );
  expect(formatObstetricHistory({ ...unknown, recipientBirthsCount: '2' })).toBe(
    'Количество беременностей - не известно. Количество родов в анамнезе - 2. ' +
      'Количество самопроизвольных абортов - не известно. ' +
      'Наличие гемолитической болезни новорождённого в анамнезе - не известно.',
  );
});

it.each(['0', '00', ' 0 ', 'Не было'])(
  'omits all inactive dependent fields for zero pregnancies %j',
  (zero) => {
    const values = Object.freeze({
      recipientPregnanciesCount: zero,
      recipientBirthsCount: '2',
      recipientSpontaneousAbortionsCount: '1',
      recipientHemolyticDiseaseNewbornHistory: 'Было',
    });
    expect(hasNoPregnancies(values)).toBe(true);
    expect(formatObstetricHistory(values)).toBe('Беременностей не было');
    expect(values.recipientBirthsCount).toBe('2');
  },
);

it.each([undefined, '', ' ', '0', 'Не известно'])(
  'hides newborn history when births are inactive: %j',
  (births) => {
    const values: ProtocolValues = {
      recipientPregnanciesCount: '2',
      ...(births === undefined ? {} : { recipientBirthsCount: births }),
    };
    expect(
      formatObstetricHistory({ ...values, recipientHemolyticDiseaseNewbornHistory: 'Да' }),
    ).not.toContain('Гемолитическая болезнь');
  },
);

it('keeps legacy numeric values readable without changing saved records', () => {
  const values = Object.freeze({
    recipientPregnanciesCount: '01',
    recipientBirthsCount: '02',
    recipientSpontaneousAbortionsCount: ' 05 ',
  });
  expect(formatObstetricHistory(values)).toBe(
    'Количество беременностей в анамнезе - 1. Количество родов в анамнезе - 2. ' +
      'Количество самопроизвольных абортов в анамнезе - 5.',
  );
  expect(values.recipientPregnanciesCount).toBe('01');
  expect(formatObstetricHistory({ recipientPregnanciesCount: '-1' })).toBe(
    'Количество беременностей в анамнезе - -1.',
  );
});
