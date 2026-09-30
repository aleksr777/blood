import { getDatabase, type SqliteDatabase } from './database';
import type { ProtocolValuesRecord } from './database-types';
import { normalizeKey, normalizeName, profileFromValues } from './recipient-data';

export const upsertRecipient = (
  db: SqliteDatabase,
  values: ProtocolValuesRecord,
  recipientId: number | null,
) => {
  const fullName = normalizeName(values.recipientName ?? '');
  if (!fullName) throw new Error('Укажите ФИО реципиента.');

  const now = Date.now();
  const bind = {
    $fullName: fullName,
    $normalizedName: normalizeKey(fullName),
    $profile: JSON.stringify(profileFromValues(values)),
    $now: now,
  };

  if (recipientId !== null) {
    const existing = db.exec({
      sql: 'SELECT id FROM recipients WHERE id = $id',
      bind: { $id: recipientId },
      rowMode: 'object',
      returnValue: 'resultRows',
    }) as Array<{ id: number }>;
    if (!existing[0]) throw new Error('Выбранная карточка реципиента удалена. Выберите пациента заново.');

    db.exec({
      sql: `
        UPDATE recipients
        SET full_name = $fullName, normalized_name = $normalizedName,
          profile_json = $profile, updated_at = $now
        WHERE id = $id
      `,
      bind: { ...bind, $id: recipientId },
    });
    return recipientId;
  }

  db.exec({
    sql: `
      INSERT INTO recipients
        (full_name, normalized_name, birth_date, profile_json, created_at, updated_at)
      VALUES ($fullName, $normalizedName, '', $profile, $now, $now)
    `,
    bind,
  });
  const rows = db.exec({
    sql: 'SELECT last_insert_rowid() AS id',
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ id: number }>;
  return Number(rows[0].id);
};
