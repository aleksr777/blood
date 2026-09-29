import type {
  ProtocolRecord,
  ProtocolValuesRecord,
} from './database-types';

const PROFILE_FIELDS = [
  'recipientName',
  'recipientBirthDate',
  'recipientAbo',
  'recipientRh',
  'recipientAntigens',
  'alloimmuneAntibodies',
  'previousTransfusions',
  'previousReactions',
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

export const profileFromValues = (values: ProtocolValuesRecord) =>
  Object.fromEntries(
    PROFILE_FIELDS.flatMap((field) => (values[field] ? [[field, values[field]]] : [])),
  );

export const mapProtocol = (row: Record<string, unknown>): ProtocolRecord => ({
  id: Number(row.id),
  recipientId: Number(row.recipientId),
  values: parseValues(String(row.valuesJson)),
  createdAt: Number(row.createdAt),
  updatedAt: Number(row.updatedAt),
});
