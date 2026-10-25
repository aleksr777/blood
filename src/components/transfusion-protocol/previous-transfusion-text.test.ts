import { expect, it } from 'vitest';
import {
  combinePreviousTransfusionText,
  splitPreviousTransfusionText,
} from './previous-transfusion-text';

it('round-trips generated and manually entered multiline history without losing whitespace', () => {
  const generated = 'Первая трансфузия\nВторая трансфузия';
  const manual = '\nРучное дополнение; подробности\nЕщё строка  ';
  const combined = combinePreviousTransfusionText(generated, manual);
  expect(
    splitPreviousTransfusionText({
      previousTransfusions: combined,
      previousTransfusionsAutoText: generated,
    }),
  ).toEqual({ generated, manual });
  expect(combinePreviousTransfusionText('', manual)).toBe(manual);
});

it('does not protect or discard a legacy text that no longer contains its generated marker', () => {
  for (const text of ['', 'Отредактированная запись', 'Сводка без разделителя']) {
    expect(
      splitPreviousTransfusionText({
        previousTransfusions: text,
        previousTransfusionsAutoText: 'Сводка',
      }),
    ).toEqual({ generated: '', manual: text });
  }
});

it('recognizes a previously inserted block with no manual addition', () => {
  expect(
    splitPreviousTransfusionText({
      previousTransfusions: 'Сводка',
      previousTransfusionsAutoText: 'Сводка',
    }),
  ).toEqual({ generated: 'Сводка', manual: '' });
});
