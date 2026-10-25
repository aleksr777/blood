import { expect, it } from 'vitest';
import { getFormContentKey } from './form-content';

it('does not create a duplicate form just because a history suggestion is remembered', () => {
  const original = {
    previousTransfusions: 'Ручной анамнез',
    recipientProfileSnapshot: { previousTransfusions: 'Ручной анамнез' },
  };
  expect(
    getFormContentKey({
      ...original,
      previousTransfusionsSuggestedText: 'Сформированная сводка',
      recipientProfileSnapshot: {
        ...original.recipientProfileSnapshot,
        previousTransfusionsSuggestedText: 'Сформированная сводка',
      },
    }),
  ).toBe(getFormContentKey(original));
  expect(getFormContentKey({ ...original, previousTransfusions: 'Изменённый анамнез' })).not.toBe(
    getFormContentKey(original),
  );
});
