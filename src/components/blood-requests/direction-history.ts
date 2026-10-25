import {
  HISTORY_STATUS,
  TRANSFUSION_HISTORY_FIELDS,
} from '../transfusion-protocol/recipient-history-model';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';

export const generatedDirectionHistory = (values: ProtocolValues): ProtocolValues =>
  values.previousTransfusionsAutoText?.trim()
    ? {
        previousTransfusionsAutoText: values.previousTransfusionsAutoText,
        previousTransfusionsStatus: values.previousTransfusionsStatus ?? '',
        previousTransfusions: values.previousTransfusions ?? '',
      }
    : {};

export const hasStructuredDirectionHistory = (values: ProtocolValues) =>
  TRANSFUSION_HISTORY_FIELDS.some(
    ({ statusName, textName }) =>
      values[statusName] !== undefined || values[textName] !== undefined,
  );

export const hasStructuredObstetricHistory = (values: ProtocolValues) =>
  [
    'recipientPregnanciesCount',
    'recipientBirthsCount',
    'recipientSpontaneousAbortionsCount',
    'recipientHemolyticDiseaseNewbornHistory',
  ].some((field) => values[field] !== undefined);

// Earlier directions stored one generated summary. Keep its original text and
// restore the separate fields only when the summary has that known format.
export const restoreDirectionHistory = (values: ProtocolValues, summary = ''): ProtocolValues => {
  if (hasStructuredDirectionHistory(values) || !summary.trim()) return values;

  const parts = summary.split(/;\s+(?=Реакции и осложнения: |Индивидуальный подбор: )/u);
  const restored: ProtocolValues = {};
  const prefixes = ['Трансфузии: ', 'Реакции и осложнения: ', 'Индивидуальный подбор: '];
  const used = new Set<number>();

  for (const [partIndex, part] of parts.entries()) {
    const index = prefixes.findIndex((prefix) => part.startsWith(prefix));
    const fieldIndex = index === -1 && partIndex === 0 ? 0 : index;
    if (fieldIndex < 0 || used.has(fieldIndex)) return values;
    const { statusName, textName } = TRANSFUSION_HISTORY_FIELDS[fieldIndex];
    const text = index === -1 ? part.trim() : part.slice(prefixes[index].length).trim();
    const normalized = text.toLocaleLowerCase('ru-RU');

    if (
      normalized === 'трансфузий не было.' ||
      normalized === 'не было' ||
      normalized === 'не проводился'
    ) {
      restored[statusName] = HISTORY_STATUS.none;
    } else if (normalized === 'не известно.' || normalized === 'не известно') {
      restored[statusName] = HISTORY_STATUS.unknown;
    } else if (index !== -1 && text) {
      restored[statusName] = HISTORY_STATUS.had;
      restored[textName] = text;
    } else {
      return values;
    }
    used.add(fieldIndex);
  }

  return { ...values, ...restored };
};
