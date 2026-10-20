import { clearCurrentIndicationsForRecipient } from './current-indications';
import { clearCurrentRecipientIfMatches } from './current-recipient';
import { loadProtocolDraft, saveProtocolDraft } from './protocol-draft';
import { loadRegistrationDraft, saveRegistrationDraft } from './registration-draft';
import { RECIPIENT_PROFILE_FIELDS } from '../sqlite/recipient-data';
import type { ProtocolValuesRecord } from '../sqlite/database-types';

const COMPONENT_REQUEST_STORAGE_KEY = 'blood:component-request-direction-draft';
const INDIVIDUAL_SELECTION_STORAGE_KEY = 'blood:individual-selection-direction-draft';

const recipientValueFields = new Set<string>([
  'recipientId',
  'recipientName',
  'recipientAge',
  ...RECIPIENT_PROFILE_FIELDS,
  'previousTransfusionsAutoText',
  'indications',
  'selectionStatus',
  'selectionOrganization',
  'selectionDate',
  'responsiblePerson',
  'compatibilityConclusion',
  'confirmedRecipientAboResult',
  'planeTestResult',
  'biologicalTestResult',
  'complicationsStatus',
  'symptoms',
  'severity',
  'registrationTransfusionRows',
]);

const recipientMonitoringPrefixes = [
  'beforeBp',
  'beforePulse',
  'beforeTemperature',
  'beforeUrine',
  'hour1Bp',
  'hour1Pulse',
  'hour1Temperature',
  'hour1Urine',
  'hour2Bp',
  'hour2Pulse',
  'hour2Temperature',
  'hour2Urine',
];

const isRecipientLinkedProtocolField = (name: string) =>
  recipientValueFields.has(name) ||
  name.startsWith('recipient') ||
  name.startsWith('indication') ||
  recipientMonitoringPrefixes.includes(name);

export const clearRecipientLinkedValues = (
  values: ProtocolValuesRecord,
  recipientId: number,
): ProtocolValuesRecord => {
  if (Number(values.recipientId) !== recipientId) return values;

  return Object.fromEntries(
    Object.entries(values).filter(
      ([name]) => !isRecipientLinkedProtocolField(name),
    ),
  );
};

const requestRecipientFields = [
  'sourceRecipientId',
  'recipientAboRh',
  'recipientPhenotype',
  'recipientName',
  'recipientAge',
  'department',
  'medicalRecordNumber',
  'diagnosis',
  'transfusionHistory',
  'obstetricHistory',
  'recipientSex',
  'individualSelectionIndications',
] as const;

export const clearRecipientLinkedRequestDraft = <T extends object>(
  draft: T,
  recipientId: number,
  kind: 'component-request' | 'individual-selection-direction',
): T => {
  const source = draft as Record<string, unknown>;
  if (Number(source.sourceRecipientId) !== recipientId) return draft;

  const next: Record<string, unknown> = { ...source };

  requestRecipientFields.forEach((field) => {
    if (field in next) next[field] = '';
  });

  next.recipientProfileSnapshot = {};
  next.autoValues = {};
  next.indicationValues =
    kind === 'individual-selection-direction'
      ? { indicationComponent: 'erythrocytes' }
      : {};

  return next as T;
};

const clearStoredRequestDraft = (
  storageKey: string,
  recipientId: number,
  kind: 'component-request' | 'individual-selection-direction',
) => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;

    const draft = parsed as Record<string, unknown>;
    if (Number(draft.sourceRecipientId) !== recipientId) return;

    const cleared = clearRecipientLinkedRequestDraft(draft, recipientId, kind);
    window.localStorage.setItem(storageKey, JSON.stringify(cleared));
    window.localStorage.removeItem(`${storageKey}:saved-record-id`);
  } catch (error) {
    console.error('Не удалось очистить текущий бланк удалённого реципиента:', error);
  }
};

export const clearDeletedRecipientFromCurrentForms = async (
  recipientId: number,
) => {
  const [protocolDraft, registrationDraft] = await Promise.all([
    loadProtocolDraft(),
    loadRegistrationDraft(),
  ]);

  const protocolLinked =
    Number(protocolDraft.values.recipientId) === recipientId;
  const registrationLinked =
    Number(registrationDraft.values.recipientId) === recipientId;

  await Promise.all([
    protocolLinked
      ? saveProtocolDraft({
          values: clearRecipientLinkedValues(
            protocolDraft.values,
            recipientId,
          ),
          protocolRecordId: null,
          updatedAt: Date.now(),
        })
      : Promise.resolve(),
    registrationLinked
      ? saveRegistrationDraft({
          values: clearRecipientLinkedValues(
            registrationDraft.values,
            recipientId,
          ),
          registrationRecordId: null,
          updatedAt: Date.now(),
        })
      : Promise.resolve(),
  ]);

  clearStoredRequestDraft(
    COMPONENT_REQUEST_STORAGE_KEY,
    recipientId,
    'component-request',
  );
  clearStoredRequestDraft(
    INDIVIDUAL_SELECTION_STORAGE_KEY,
    recipientId,
    'individual-selection-direction',
  );

  clearCurrentIndicationsForRecipient(recipientId);
  clearCurrentRecipientIfMatches(recipientId);

  return {
    protocolLinked,
    registrationLinked,
  };
};
