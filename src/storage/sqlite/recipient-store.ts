import { getDatabase, type SqliteDatabase } from './database';
import type {
  ProtocolValuesRecord,
  RecipientRecord,
} from './database-types';
import {
  normalizeKey,
  normalizeName,
  parseValues,
  profileFromValues,
} from './recipient-data';

const mapRecipient = (row: Record<string, unknown>): RecipientRecord => ({
  id: Number(row.id),
  fullName: String(row.fullName),
  profile: profileFromValues(parseValues(String(row.profileJson))),
  protocolCount: Number(row.protocolCount ?? 0),
});

const getRecipient = (db: SqliteDatabase, id: number) => {
  const rows = db.exec({
    sql: `
      SELECT r.id, r.full_name AS fullName, r.profile_json AS profileJson,
        COUNT(p.id) AS protocolCount
      FROM recipients r
      LEFT JOIN protocol_records p ON p.recipient_id = r.id
      WHERE r.id = $id
      GROUP BY r.id
    `,
    bind: { $id: id },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<Record<string, unknown>>;
  if (!rows[0]) throw new Error('Реципиент не найден.');
  return mapRecipient(rows[0]);
};

export const searchRecipients = async (query: string) => {
  const db = await getDatabase();
  const value = normalizeKey(query);
  const rows = db.exec({
    sql: `
      SELECT r.id, r.full_name AS fullName, r.profile_json AS profileJson,
        COUNT(p.id) AS protocolCount
      FROM recipients r
      LEFT JOIN protocol_records p ON p.recipient_id = r.id
      WHERE $query = '' OR r.normalized_name LIKE $like
      GROUP BY r.id
      ORDER BY r.full_name
      LIMIT 100
    `,
    bind: { $query: value, $like: `%${value}%` },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<Record<string, unknown>>;
  return rows.map(mapRecipient);
};

export const updateRecipient = async (
  id: number,
  values: ProtocolValuesRecord,
) => {
  const fullName = normalizeName(values.recipientName ?? '');
  if (!fullName) throw new Error('Укажите ФИО реципиента.');

  const db = await getDatabase();
  const normalizedName = normalizeKey(fullName);
  const duplicates = db.exec({
    sql: 'SELECT id FROM recipients WHERE normalized_name = $name AND id <> $id LIMIT 1',
    bind: { $name: normalizedName, $id: id },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ id: number }>;
  if (duplicates[0]) throw new Error('Реципиент с таким ФИО уже существует.');

  db.exec({
    sql: `
      UPDATE recipients
      SET full_name = $fullName, normalized_name = $name,
        profile_json = $profile, updated_at = $now
      WHERE id = $id
    `,
    bind: {
      $fullName: fullName,
      $name: normalizedName,
      $profile: JSON.stringify(profileFromValues(values)),
      $now: Date.now(),
      $id: id,
    },
  });
  return getRecipient(db, id);
};

export const removeRecipient = async (id: number) => {
  const db = await getDatabase();
  db.exec({ sql: 'DELETE FROM protocol_records WHERE recipient_id = $id', bind: { $id: id } });
  db.exec({ sql: 'DELETE FROM recipients WHERE id = $id', bind: { $id: id } });
};
