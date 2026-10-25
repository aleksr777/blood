import { expect, it } from 'vitest';
import { formatHistoryValue, formatObstetricHistory } from './recipient-history-model';

it('prints a manual addition immediately after inserted history without rewriting saved data', () => {
  const generated = '23.10.2026 — Отмытые эритроциты, 300 мл';
  const manual = 'Ручное дополнение\n\nЕщё один пункт';
  for (const separator of ['\n', '\n\n', '\r\n\r\n\r\n']) {
    const values = {
      previousTransfusionsStatus: 'had',
      previousTransfusionsAutoText: generated,
      previousTransfusions: `${generated}${separator}${manual}`,
    };
    const original = { ...values };
    expect(formatHistoryValue(values, 'previousTransfusionsStatus', 'previousTransfusions')).toBe(
      `${generated}\n${manual}`,
    );
    expect(values).toEqual(original);
  }
});

it('keeps intentional paragraphs in manual history and other history fields', () => {
  const text = 'Первый пункт\n\nВторой пункт';
  for (const [statusName, textName] of [
    ['previousTransfusionsStatus', 'previousTransfusions'],
    ['previousReactionsStatus', 'previousReactions'],
    ['individualSelectionHistoryStatus', 'individualSelectionHistory'],
  ]) {
    expect(
      formatHistoryValue({ [statusName]: 'had', [textName]: text }, statusName, textName),
    ).toBe(text);
  }
});

it.each(['0', '00', ' 0 '])('prints natural obstetric statements for explicit zero %s', (zero) => {
  const values = {
    recipientPregnanciesCount: zero,
    recipientBirthsCount: zero,
    recipientSpontaneousAbortionsCount: zero,
  };
  const original = { ...values };
  expect(formatObstetricHistory(values)).toBe(
    'Беременностей не было; Родов не было; Самопроизвольных абортов в анамнезе не было',
  );
  expect(values).toEqual(original);
});

it('keeps positive counts and separately entered newborn history with mixed zero values', () => {
  expect(
    formatObstetricHistory({
      recipientPregnanciesCount: ' 2 ',
      recipientBirthsCount: '1',
      recipientSpontaneousAbortionsCount: '0',
      recipientHemolyticDiseaseNewbornHistory: 'Да',
    }),
  ).toBe(
    'Количество беременностей: 2; Количество родов: 1; ' +
      'Самопроизвольных абортов в анамнезе не было; ' +
      'Гемолитическая болезнь новорождённого в анамнезе: Да',
  );
});

it('does not treat missing obstetric data as zero or infer other history from no pregnancies', () => {
  expect(formatObstetricHistory({})).toBe('');
  expect(
    formatObstetricHistory({
      recipientPregnanciesCount: '',
      recipientBirthsCount: ' ',
      recipientSpontaneousAbortionsCount: '',
    }),
  ).toBe('');
  expect(formatObstetricHistory({ recipientPregnanciesCount: '0' })).toBe('Беременностей не было');
});

it('preserves unrecognized stored count text and an explicit negative newborn history', () => {
  expect(
    formatObstetricHistory({
      recipientPregnanciesCount: 'неизвестно',
      recipientHemolyticDiseaseNewbornHistory: 'Нет',
    }),
  ).toBe(
    'Количество беременностей: неизвестно; ' +
      'Гемолитическая болезнь новорождённого в анамнезе: Нет',
  );
});
