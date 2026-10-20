import { RECIPIENT_PROFILE_FIELDS } from '../sqlite/recipient-data';
import type { ProtocolValuesRecord } from '../sqlite/database-types';

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

const recipientMonitoringFields = new Set([
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
]);

const isRecipientLinkedProtocolField = (name: string) =>
  recipientValueFields.has(name) ||
  name.startsWith('recipient') ||
  name.startsWith('indication') ||
  recipientMonitoringFields.has(name);

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
