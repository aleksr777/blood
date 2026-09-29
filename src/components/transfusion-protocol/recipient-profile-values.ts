import type { RecipientRecord } from '../../storage/repositories/recipients';
import type { ProtocolValues } from './protocol-types';

const PROFILE_FIELDS = [
  'recipientAbo',
  'recipientRh',
  'recipientAntigens',
  'alloimmuneAntibodies',
  'previousTransfusions',
  'previousReactions',
  'individualSelectionHistory',
] as const;

export const recipientValues = (
  fullName: string,
  recipient?: RecipientRecord,
): ProtocolValues => ({
  recipientName: fullName,
  ...Object.fromEntries(
    PROFILE_FIELDS.map((field) => [field, recipient?.profile[field] ?? '']),
  ),
});
