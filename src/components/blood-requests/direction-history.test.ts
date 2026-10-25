import { expect, it } from 'vitest';
import { formatHistoryValue } from '../transfusion-protocol/recipient-history-model';
import {
  generatedDirectionHistory,
  hasStructuredObstetricHistory,
  restoreDirectionHistory,
} from './direction-history';

it('restores the three fields from an earlier generated summary without losing punctuation or line breaks', () => {
  const restored = restoreDirectionHistory(
    {},
    'Трансфузии: первая; вторая\nтретья; Реакции и осложнения: реакция; подробности; Индивидуальный подбор: в 2020 году',
  );
  expect(restored).toEqual({
    previousTransfusionsStatus: 'had',
    previousTransfusions: 'первая; вторая\nтретья',
    previousReactionsStatus: 'had',
    previousReactions: 'реакция; подробности',
    individualSelectionHistoryStatus: 'had',
    individualSelectionHistory: 'в 2020 году',
  });
});

it.each([
  ['Трансфузий не было.', 'none', 'Не было'],
  ['Не известно.', 'unknown', 'Не известно'],
])('restores a previous status from %s', (summary, status, display) => {
  const restored = restoreDirectionHistory({}, summary);
  expect(restored.previousTransfusionsStatus).toBe(status);
  expect(formatHistoryValue(restored, 'previousTransfusionsStatus', 'previousTransfusions')).toBe(
    display,
  );
});

it('keeps explicit structured values, including cleared values, ahead of an earlier summary', () => {
  const original = { previousTransfusionsStatus: '', previousTransfusions: '' };
  expect(restoreDirectionHistory(original, 'Трансфузии: устаревший текст')).toBe(original);
});

it('does not guess a clinical status from unrecognized legacy text', () => {
  const original = { recipientSex: 'Женский' };
  expect(restoreDirectionHistory(original, 'Произвольная запись прежней версии')).toBe(original);
});

it('distinguishes explicitly cleared obstetric fields from a legacy snapshot without those fields', () => {
  expect(hasStructuredObstetricHistory({ recipientPregnanciesCount: '' })).toBe(true);
  expect(hasStructuredObstetricHistory({ recipientSex: 'Женский' })).toBe(false);
});

it('retains only document-local generated history without overriding other shared recipient fields', () => {
  expect(generatedDirectionHistory({ previousTransfusions: 'Ручная запись' })).toEqual({});
  const source = {
    previousTransfusionsAutoText: 'Сформированный текст',
    previousTransfusionsStatus: 'none',
    previousTransfusions: 'Сформированный текст',
    previousReactions: 'Общие сведения о реакции',
  };
  expect(generatedDirectionHistory(source)).toEqual({
    previousTransfusionsAutoText: source.previousTransfusionsAutoText,
    previousTransfusionsStatus: 'none',
    previousTransfusions: source.previousTransfusions,
  });
  expect(source.previousReactions).toBe('Общие сведения о реакции');
});
