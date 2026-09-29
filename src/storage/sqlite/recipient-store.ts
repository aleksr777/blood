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

const searchDate = (query: string) => {
  const match = query.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : query;
};

const mapRecipient = (row: Record<string, unknown>): RecipientRecord => ({
  id: Number(row.id),
  fullName: String(row.fullName),
  birthDate: String(row.birthDate),
  profile: parseValues(String(row.profileJson)),
  protocolCount: Number(row.protocolCount ?? 0),
});

const getRecipient = (db: SqliteDatabase, id: number) => {
  const rows = db.exec({
    sql: `
      SELECT r.id, r.full_name AS fullName, r.birth_date AS birthDate,
        r.profile_json AS profileJson, COUNT(p.id) AS protocolCount
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
      SELECT r.id, r.full_name AS fullName, r.birth_date AS birthDate,
        r.profile_json AS profileJson, COUNT(p.id) AS protocolCount
      FROM recipients r
      LEFT JOIN protocol_records p ON p.recipient_id = r.id
      WHERE $query = ''
        OR r.normalized_name LIKE $like
        OR r.birth_date LIKE $dateLike
      GROUP BY r.id
      ORDER BY r.full_name, r.birth_date
      LIMIT 100
    `,
    bind: {
      $query: value,
      $like: `%${value}%`,
      $dateLike: `%${searchDate(value)}%`,
    },
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
  const birthDate = values.recipientBirthDate ?? '';
  if (!fullName || !birthDate) {
    throw new Error('Укажите ФИО и дату рождения реципиента.');
  }

  const db = await getDatabase();
  const normalizedName = normalizeKey(fullName);
  const duplicates = db.exec({
    sql: `
      SELECT id FROM recipients
      WHERE normalized_name = $name AND birth_date = $birthDate AND id <> $id
      LIMIT 1
    `,
    bind: { $name: normalizedName, $birthDate: birthDate, $id: id },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ id: number }>;
  if (duplicates[0]) {
    throw new Error('Реципиент с таким ФИО и датой рождения уже существует.');
  }

  db.exec({
    sql: `
      UPDATE recipients
      SET full_name = $fullName, normalized_name = $name, birth_date = $birthDate,
        profile_json = $profile, updated_at = $now
      WHERE id = $id
    `,
    bind: {
      $fullName: fullName,
      $name: normalizedName,
      $birthDate: birthDate,
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
