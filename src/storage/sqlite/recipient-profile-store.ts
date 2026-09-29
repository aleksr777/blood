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
  if (!fullName) throw new Error('Укажите ФИО реципиента.');

  const normalizedName = normalizeKey(fullName);
  const existing = db.exec({
    sql: 'SELECT id FROM recipients WHERE normalized_name = $name LIMIT 1',
    bind: { $name: normalizedName },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ id: number }>;
  const now = Date.now();

  if (existing[0]) {
    db.exec({
      sql: `
        UPDATE recipients
        SET full_name = $fullName, profile_json = $profile, updated_at = $now
        WHERE id = $id
      `,
      bind: {
        $fullName: fullName,
        $profile: JSON.stringify(profileFromValues(values)),
        $now: now,
        $id: existing[0].id,
      },
    });
    return Number(existing[0].id);
  }

  db.exec({
    sql: `
      INSERT INTO recipients
        (full_name, normalized_name, birth_date, profile_json, created_at, updated_at)
      VALUES ($fullName, $normalizedName, '', $profile, $now, $now)
    `,
    bind: {
      $fullName: fullName,
      $normalizedName: normalizedName,
      $profile: JSON.stringify(profileFromValues(values)),
      $now: now,
    },
  });
  const rows = db.exec({
    sql: 'SELECT last_insert_rowid() AS id',
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ id: number }>;
  return Number(rows[0].id);
};
