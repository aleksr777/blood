import type {
  ProtocolRecord,
  ProtocolValuesRecord,
  RegistrationRecord,
} from './database-types';

export const RECIPIENT_PROFILE_FIELDS = [
  'recipientBirthDate',
  'department',
  'medicalRecordNumber',
  'roomNumber',
  'recipientAbo',
  'recipientRh',
  'recipientAntigens',
  'recipientAntigenC',
  'recipientAntigenc',
  'recipientAntigenCw',
  'recipientAntigenE',
  'recipientAntigene',
  'recipientAntigenK',
  'recipientAntigenk',
  'alloimmuneAntibodies',
  'alloimmuneAntibodyStatus',
  'alloimmuneAntibodyDescription',
  'previousTransfusionsStatus',
  'previousTransfusions',
  'previousReactionsStatus',
  'previousReactions',
  'individualSelectionHistoryStatus',
  'individualSelectionHistory',
];

export const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ');

export const normalizeKey = (value: string) =>
  normalizeName(value).toLocaleLowerCase('ru-RU');

export const parseValues = (value: string): ProtocolValuesRecord => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  } catch {
    return {};
  }
};

const GENERATED_TRANSFUSION_HISTORY_FIELDS = new Set([
  'previousTransfusionsStatus',
  'previousTransfusions',
]);

export const profileFromValues = (values: ProtocolValuesRecord) => {
  const hasGeneratedTransfusionHistory = Boolean(
    values.previousTransfusionsAutoText?.trim(),
  );

  return Object.fromEntries(
    RECIPIENT_PROFILE_FIELDS.flatMap((field) => {
      if (
        hasGeneratedTransfusionHistory &&
        GENERATED_TRANSFUSION_HISTORY_FIELDS.has(field)
      ) {
        return [];
      }

      return values[field] ? [[field, values[field]]] : [];
    }),
  );
};

export const mergeProfileValues = (
  current: ProtocolValuesRecord,
  values: ProtocolValuesRecord,
): ProtocolValuesRecord => {
  const next = profileFromValues(current);
  const hasGeneratedTransfusionHistory = Boolean(
    values.previousTransfusionsAutoText?.trim(),
  );

  RECIPIENT_PROFILE_FIELDS.forEach((field) => {
    if (!(field in values)) return;
    if (
      hasGeneratedTransfusionHistory &&
      GENERATED_TRANSFUSION_HISTORY_FIELDS.has(field)
    ) {
      return;
    }

    const value = values[field];
    if (value) next[field] = value;
    else delete next[field];
  });

  return next;
};

export const mapProtocol = (row: Record<string, unknown>): ProtocolRecord => ({
  id: Number(row.id),
  recipientId: Number(row.recipientId),
  values: parseValues(String(row.valuesJson)),
  createdAt: Number(row.createdAt),
  updatedAt: Number(row.updatedAt),
});


export const mapRegistration = (row: Record<string, unknown>): RegistrationRecord => ({
  id: Number(row.id),
  recipientId: Number(row.recipientId),
  values: parseValues(String(row.valuesJson)),
  createdAt: Number(row.createdAt),
  updatedAt: Number(row.updatedAt),
});
