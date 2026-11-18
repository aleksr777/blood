import { normalizeComponentUnitNumber } from './protocol-hemacon';

// Recipient identity is checked separately. These fields only track editing/autofill.
const TRACKING_FIELDS = new Set([
  'recipientId',
  'sourceRecipientId',
  'requestDateTimeExplicit',
  'autoValues',
  'previousTransfusionsAutoText',
  'previousTransfusionsSuggestedText',
]);

// An explicit empty radio value can differ from a missing field: missing fields
// may use a default or infer a legacy selection from retained details.
export const DEFAULTED_RADIO_FIELDS = new Set([
  'selectionStatus',
  'complicationsStatus',
  'confirmedRecipientAboResult',
  'confirmedDonorAboResult',
  'planeTestResult',
  'biologicalTestResult',
]);

const LEGACY_RADIO_TEXT: Record<string, string> = {
  alloimmuneAntibodyStatus: 'alloimmuneAntibodies',
  previousTransfusionsStatus: 'previousTransfusions',
  previousReactionsStatus: 'previousReactions',
  individualSelectionHistoryStatus: 'individualSelectionHistory',
};

const normalizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') return value.replace(/\r\n?/g, '\n').trim() || undefined;
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.length ? value.map((item) => normalizeValue(item) ?? null) : undefined;
  }
  if (typeof value !== 'object') return value;

  const entries = Object.entries(value)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .flatMap(([key, item]) => {
      if (key === 'previousTransfusionsSuggestedText') return [];
      const legacyText = (value as Record<string, unknown>)[LEGACY_RADIO_TEXT[key]];
      if (
        item === '' &&
        (DEFAULTED_RADIO_FIELDS.has(key) || (typeof legacyText === 'string' && legacyText.trim()))
      )
        return [[key, '']];
      const normalized = normalizeValue(item);
      return normalized === undefined ? [] : [[key, normalized]];
    });
  return entries.length ? Object.fromEntries(entries) : undefined;
};

export const getFormContentKey = (values: Record<string, unknown>) => {
  const content = Object.fromEntries(
    Object.entries(values).filter(([key]) => !TRACKING_FIELDS.has(key)),
  );
  if (typeof content.componentUnitNumber === 'string') {
    content.componentUnitNumber = normalizeComponentUnitNumber(content.componentUnitNumber);
  }
  if (typeof content.registrationTransfusionRows === 'string') {
    try {
      const rows: unknown = JSON.parse(content.registrationTransfusionRows);
      if (Array.isArray(rows)) content.registrationTransfusionRows = rows;
    } catch {
      // Keep malformed data distinct rather than confusing it with an empty table.
    }
  }
  return JSON.stringify(normalizeValue(content) ?? {});
};
