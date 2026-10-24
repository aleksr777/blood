import { formatRecipientAge } from '../transfusion-protocol/recipient-demographics';
import { formatRecipientAntigens } from '../transfusion-protocol/recipient-examination-model';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';

export const updateSavedRequestProfile = <
  T extends {
    recipientProfileSnapshot: ProtocolValues;
    autoValues: Partial<Record<string, string>>;
  },
>(
  draft: T,
  changes: ProtocolValues,
  createdAt?: number,
): T => {
  const profile = { ...draft.recipientProfileSnapshot, ...changes };
  const patch: ProtocolValues = {};
  for (const field of [
    'recipientName',
    'recipientSex',
    'department',
    'medicalRecordNumber',
    'diagnosis',
  ]) {
    if (changes[field] !== undefined) patch[field] = changes[field];
  }
  if (changes.recipientAbo !== undefined || changes.recipientRh !== undefined) {
    patch.recipientAboRh = [profile.recipientAbo, profile.recipientRh].filter(Boolean).join(' ');
  }
  if (Object.keys(changes).some((field) => field.startsWith('recipientAntigen'))) {
    patch.recipientPhenotype = formatRecipientAntigens(profile);
  }
  if (changes.recipientBirthDate !== undefined) {
    patch.recipientAge = formatRecipientAge(
      profile.recipientBirthDate,
      createdAt ? new Date(createdAt).toISOString().slice(0, 10) : undefined,
    );
    profile.recipientAge = patch.recipientAge;
  }
  return {
    ...draft,
    ...patch,
    recipientProfileSnapshot: profile,
    autoValues: { ...draft.autoValues, ...patch },
  };
};
