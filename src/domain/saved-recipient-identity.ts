const identityFields = new Set([
  'recipientId',
  'sourceRecipientId',
  'recipientName',
  'recipientBirthDate',
  'recipientAge',
  'medicalRecordNumber',
]);

export const isSavedRecipientIdentityField = (name: string) => identityFields.has(name);

const profileOf = (values: Record<string, unknown>): Record<string, unknown> => {
  const profile = values.recipientProfileSnapshot;
  return profile && typeof profile === 'object' && !Array.isArray(profile)
    ? (profile as Record<string, unknown>)
    : {};
};

export const preserveSavedRecipientIdentity = <T extends Record<string, unknown>>(
  original: T,
  updated: T,
): T => {
  const next: Record<string, unknown> = { ...updated };
  for (const name of identityFields) {
    if (Object.prototype.hasOwnProperty.call(original, name)) next[name] = original[name];
    else delete next[name];
  }
  if (original.recipientProfileSnapshot || updated.recipientProfileSnapshot) {
    next.recipientProfileSnapshot = preserveSavedRecipientIdentity(
      profileOf(original),
      profileOf(updated),
    );
  }
  return next as T;
};
