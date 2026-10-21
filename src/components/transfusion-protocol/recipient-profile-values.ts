import type { RecipientRecord } from '../../storage/repositories/recipients';
import { RECIPIENT_PROFILE_FIELDS } from '../../storage/sqlite/recipient-data';
import type { ProtocolValues } from './protocol-types';

export const PROFILE_FIELDS = RECIPIENT_PROFILE_FIELDS;

export const recipientValues = (fullName: string, recipient?: RecipientRecord): ProtocolValues => ({
  recipientName: fullName,
  recipientId: recipient ? String(recipient.id) : '',
  ...Object.fromEntries(PROFILE_FIELDS.map((field) => [field, recipient?.profile[field] ?? ''])),
});

const CURRENT_RECIPIENT_FIELDS = ['recipientName', 'recipientId', ...PROFILE_FIELDS] as const;

export const currentRecipientValues = (values: ProtocolValues): ProtocolValues => {
  const generatedHistory = Boolean(values.previousTransfusionsAutoText?.trim());

  return Object.fromEntries(
    CURRENT_RECIPIENT_FIELDS.flatMap((field) => {
      if (
        generatedHistory &&
        (field === 'previousTransfusionsStatus' || field === 'previousTransfusions')
      ) {
        return [];
      }

      return values[field] !== undefined && values[field] !== '' ? [[field, values[field]]] : [];
    }),
  );
};
