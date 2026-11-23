// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AdaptiveRuledField } from '../blood-requests/adaptive-ruled-field';
import sentenceStyles from '../ruled-text/sentence-wrapped-text.module.css';
import directionStyles from '../blood-requests/individual-selection-direction.module.css';
import { HistoryBlock } from './first-page-blocks-secondary';
import { formatObstetricHistory } from './obstetric-history';

afterEach(cleanup);

it('keeps each formatted sentence together in the protocol and direction measurements', () => {
  const values = {
    recipientSex: 'Женский',
    recipientPregnanciesCount: '2',
    recipientBirthsCount: '1',
    recipientSpontaneousAbortionsCount: '0',
    recipientHemolyticDiseaseNewbornHistory: 'Не было',
  };
  const text = formatObstetricHistory(values);
  const { container } = render(
    <>
      <table>
        <HistoryBlock values={values} part="main" onOpenBlock={vi.fn()} />
      </table>
      <AdaptiveRuledField label="Акушерский анамнез у женщин:" value={text} wrapSentences />
    </>,
  );
  const selector = `.${sentenceStyles.sentence}`;
  const protocol = container.querySelector('.row-obstetric-history .cell-value');
  const direction = container.querySelector(`.${directionStyles.adaptiveSingleValue}`);
  const measure = container.querySelector(`.${directionStyles.adaptiveMeasureValue}`);
  expect(protocol?.textContent).toBe(text);
  expect(direction?.textContent).toBe(text);
  expect(measure?.textContent).toBe(text);
  for (const element of [protocol, direction, measure]) {
    const sentences = Array.from(element?.querySelectorAll(selector) ?? []);
    expect(sentences).toHaveLength(4);
    expect(sentences.every((sentence) => sentence.textContent?.endsWith('.'))).toBe(true);
  }
});
