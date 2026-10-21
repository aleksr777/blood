import { RECIPIENT_PROFILE_FIELDS } from '../../storage/sqlite/recipient-data';
import type { ProtocolValues } from './protocol-types';

const CURRENT_RECIPIENT_FIELDS = [
  'recipientName',
  'recipientId',
  ...RECIPIENT_PROFILE_FIELDS,
] as const;

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
