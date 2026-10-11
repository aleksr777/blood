import type { RecipientRecord } from '../../storage/repositories/recipients';
import type { ProtocolValues } from './protocol-types';

export const PROFILE_FIELDS = [
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
] as const;

export const recipientValues = (
  fullName: string,
  recipient?: RecipientRecord,
): ProtocolValues => ({
  recipientName: fullName,
  recipientId: recipient ? String(recipient.id) : '',
  ...Object.fromEntries(
    PROFILE_FIELDS.map((field) => [field, recipient?.profile[field] ?? '']),
  ),
});


const CURRENT_RECIPIENT_FIELDS = [
  'recipientName',
  'recipientId',
  'department',
  'medicalRecordNumber',
  ...PROFILE_FIELDS,
] as const;

export const currentRecipientValues = (values: ProtocolValues): ProtocolValues =>
  Object.fromEntries(
    CURRENT_RECIPIENT_FIELDS.flatMap((field) =>
      values[field] !== undefined && values[field] !== '' ? [[field, values[field]]] : [],
    ),
  );
