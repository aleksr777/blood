import { getDatabase } from './database';
import type { ProtocolValuesRecord, RecipientRecord } from './database-types';
import { normalizeKey, normalizeName, profileFromValues } from './recipient-data';

export const createRecipient = async (
  fullNameValue: string,
  values: ProtocolValuesRecord = {},
): Promise<RecipientRecord> => {
  const fullName = normalizeName(fullNameValue);
  if (!fullName) throw new Error('Укажите ФИО реципиента.');

  const db = await getDatabase();
  const normalizedName = normalizeKey(fullName);
  const now = Date.now();
  const profile: ProtocolValuesRecord = { ...profileFromValues(values), recipientName: fullName };
  db.exec({
    sql: `
      INSERT INTO recipients
        (full_name, normalized_name, birth_date, profile_json, created_at, updated_at)
      VALUES ($fullName, $normalizedName, $birthDate, $profile, $now, $now)
    `,
    bind: {
      $fullName: fullName,
      $normalizedName: normalizedName,
      $birthDate: profile.recipientBirthDate ?? '',
      $profile: JSON.stringify(profile),
      $now: now,
    },
  });
  const rows = db.exec({
    sql: 'SELECT last_insert_rowid() AS id',
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ id: number }>;

  return {
    id: Number(rows[0].id),
    fullName,
    profile,
    protocolCount: 0,
    registrationCount: 0,
    individualSelectionDirectionCount: 0,
    componentRequestCount: 0,
  };
};
