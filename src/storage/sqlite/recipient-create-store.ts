import { getDatabase } from './database';
import type { RecipientRecord } from './database-types';
import { normalizeKey, normalizeName } from './recipient-data';

export const createRecipient = async (fullNameValue: string): Promise<RecipientRecord> => {
  const fullName = normalizeName(fullNameValue);
  if (!fullName) throw new Error('Укажите ФИО реципиента.');

  const db = await getDatabase();
  const normalizedName = normalizeKey(fullName);
  const duplicates = db.exec({
    sql: 'SELECT id FROM recipients WHERE normalized_name = $name LIMIT 1',
    bind: { $name: normalizedName },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ id: number }>;
  if (duplicates[0]) throw new Error('Реципиент с таким ФИО уже существует.');

  const now = Date.now();
  db.exec({
    sql: `
      INSERT INTO recipients
        (full_name, normalized_name, birth_date, profile_json, created_at, updated_at)
      VALUES ($fullName, $normalizedName, '', $profile, $now, $now)
    `,
    bind: {
      $fullName: fullName,
      $normalizedName: normalizedName,
      $profile: JSON.stringify({ recipientName: fullName }),
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
    profile: { recipientName: fullName },
    protocolCount: 0,
  };
};
