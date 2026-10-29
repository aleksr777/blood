import { RECIPIENT_PROFILE_FIELDS } from '../storage/sqlite/recipient-data';
import type { BloodRequestRecordKind } from '../storage/sqlite/database-types';
import { REAGENT_DEFAULT_FIELDS } from './reagents';
import { getFormContentKey } from './form-content';

export type DocumentContentKind = 'protocol' | 'registration' | BloodRequestRecordKind;

const recipientAndReusableFields = new Set<string>([
  ...RECIPIENT_PROFILE_FIELDS,
  ...REAGENT_DEFAULT_FIELDS,
  'recipientId',
  'sourceRecipientId',
  'recipientName',
  'recipientAge',
  'recipientAboRh',
  'recipientPhenotype',
  'recipientProfileSnapshot',
  'obstetricHistory',
  'transfusionHistory',
  'autoValues',
  'previousTransfusionsAutoText',
  'previousTransfusionsSuggestedText',
]);

const withoutDefaultErythrocytes = (values: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(values).filter(
      ([name, value]) =>
        !(['componentGroup', 'indicationComponent'].includes(name) && value === 'erythrocytes'),
    ),
  );

const hasRegistrationRows = (rows: unknown) => {
  if (typeof rows !== 'string') return false;
  try {
    const parsed: unknown = JSON.parse(rows);
    return (
      Array.isArray(parsed) &&
      parsed.some(
        (row) =>
          row &&
          typeof row === 'object' &&
          typeof row.protocolId === 'number' &&
          Number.isFinite(row.protocolId),
      )
    );
  } catch {
    return false;
  }
};

export const hasDocumentContent = (
  kind: DocumentContentKind,
  values: Record<string, unknown>,
): boolean => {
  if (kind === 'registration') return hasRegistrationRows(values.registrationTransfusionRows);

  let content = Object.fromEntries(
    Object.entries(values).filter(([name]) => !recipientAndReusableFields.has(name)),
  );
  if (kind === 'individual-selection-direction') {
    content = withoutDefaultErythrocytes(content);
    const indications = content.indicationValues;
    if (indications && typeof indications === 'object' && !Array.isArray(indications)) {
      content.indicationValues = withoutDefaultErythrocytes(indications as Record<string, unknown>);
    }
  }
  return getFormContentKey(content) !== '{}';
};
