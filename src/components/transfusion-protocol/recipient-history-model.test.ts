import { expect, it } from 'vitest';
import { formatHistoryValue } from './recipient-history-model';

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
