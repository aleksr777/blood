import { getDatabase, type SqliteDatabase } from './database';
import type { ProtocolValuesRecord } from './database-types';
import {
  normalizeKey,
  normalizeName,
  profileFromValues,
} from './recipient-data';

export const upsertRecipient = (
  db: SqliteDatabase,
  values: ProtocolValuesRecord,
) => {
  const fullName = normalizeName(values.recipientName ?? '');
  const birthDate = values.recipientBirthDate ?? '';
  if (!fullName || !birthDate) {
    throw new Error('Укажите ФИО и дату рождения реципиента.');
  }

  const normalizedName = normalizeKey(fullName);
  const now = Date.now();
  db.exec({
    sql: `
      INSERT INTO recipients
        (full_name, normalized_name, birth_date, profile_json, created_at, updated_at)
      VALUES ($fullName, $normalizedName, $birthDate, $profile, $now, $now)
      ON CONFLICT(normalized_name, birth_date) DO UPDATE SET
        full_name = excluded.full_name,
        profile_json = excluded.profile_json,
        updated_at = excluded.updated_at
    `,
    bind: {
      $fullName: fullName,
      $normalizedName: normalizedName,
      $birthDate: birthDate,
      $profile: JSON.stringify(profileFromValues(values)),
      $now: now,
    },
  });

  const rows = db.exec({
    sql: 'SELECT id FROM recipients WHERE normalized_name = $name AND birth_date = $birthDate',
    bind: { $name: normalizedName, $birthDate: birthDate },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ id: number }>;
  return Number(rows[0].id);
};
