import { getDatabase, type SqliteDatabase } from './database';
import type {
  ProtocolValuesRecord,
  RecipientRecord,
} from './database-types';
import {
  mergeProfileValues,
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
  registrationCount: Number(row.registrationCount ?? 0),
});
const getRecipient = (db: SqliteDatabase, id: number) => {
  const rows = db.exec({
    sql: `
      SELECT r.id, r.full_name AS fullName, r.profile_json AS profileJson,
        (SELECT COUNT(*) FROM protocol_records p WHERE p.recipient_id = r.id) AS protocolCount,
        (SELECT COUNT(*) FROM registration_records rr WHERE rr.recipient_id = r.id)
          AS registrationCount
      FROM recipients r
      WHERE r.id = $id
    `,
    bind: { $id: id },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<Record<string, unknown>>;
  if (!rows[0]) throw new Error('Реципиент не найден.');
  return mapRecipient(rows[0]);
};
export const getRecipientById = async (id: number) => {
  const db = await getDatabase();
  return getRecipient(db, id);
};

export const searchRecipients = async (query: string) => {
  const db = await getDatabase();
  const value = normalizeKey(query);
  const rows = db.exec({
    sql: `
      SELECT r.id, r.full_name AS fullName, r.profile_json AS profileJson,
        (SELECT COUNT(*) FROM protocol_records p WHERE p.recipient_id = r.id) AS protocolCount,
        (SELECT COUNT(*) FROM registration_records rr WHERE rr.recipient_id = r.id)
          AS registrationCount
      FROM recipients r
      WHERE $query = '' OR r.normalized_name LIKE $like
      ORDER BY r.full_name
      LIMIT 100
    `,
    bind: { $query: value, $like: `%${value}%` },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<Record<string, unknown>>;
  return rows.map(mapRecipient);
};
export const findRecipientsByName = async (fullName: string) => {
  const db = await getDatabase();
  const rows = db.exec({
    sql: `
      SELECT r.id, r.full_name AS fullName, r.profile_json AS profileJson,
        (SELECT COUNT(*) FROM protocol_records p WHERE p.recipient_id = r.id) AS protocolCount,
        (SELECT COUNT(*) FROM registration_records rr WHERE rr.recipient_id = r.id)
          AS registrationCount
      FROM recipients r
      WHERE r.normalized_name = $name
      ORDER BY r.updated_at DESC, r.id DESC
    `,
    bind: { $name: normalizeKey(fullName) },
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
  const existingRows = db.exec({
    sql: 'SELECT profile_json AS profileJson FROM recipients WHERE id = $id',
    bind: { $id: id },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ profileJson: string }>;
  if (!existingRows[0]) {
    throw new Error('Выбранная карточка реципиента удалена. Выберите пациента заново.');
  }

  const normalizedName = normalizeKey(fullName);
  const now = Date.now();
  const profile = mergeProfileValues(
    parseValues(existingRows[0].profileJson),
    values,
  );

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
      $profile: JSON.stringify(profile),
      $now: now,
      $id: id,
    },
  });

  const records = db.exec({
    sql: 'SELECT id, values_json AS valuesJson FROM protocol_records WHERE recipient_id = $id',
    bind: { $id: id },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ id: number; valuesJson: string }>;
  for (const record of records) {
    const recordValues = parseValues(record.valuesJson);
    recordValues.recipientName = fullName;
    delete recordValues.recipientBirthDate;
    db.exec({
      sql: 'UPDATE protocol_records SET values_json = $values, updated_at = $now WHERE id = $id',
      bind: { $values: JSON.stringify(recordValues), $now: now, $id: record.id },
    });
  }

  const registrationRecords = db.exec({
    sql: 'SELECT id, values_json AS valuesJson FROM registration_records WHERE recipient_id = $id',
    bind: { $id: id },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ id: number; valuesJson: string }>;
  for (const record of registrationRecords) {
    const recordValues = parseValues(record.valuesJson);
    recordValues.recipientName = fullName;
    db.exec({
      sql: 'UPDATE registration_records SET values_json = $values, updated_at = $now WHERE id = $id',
      bind: { $values: JSON.stringify(recordValues), $now: now, $id: record.id },
    });
  }

  return getRecipient(db, id);
};
export const removeRecipient = async (id: number) => {
  const db = await getDatabase();
  db.exec({ sql: 'DELETE FROM protocol_records WHERE recipient_id = $id', bind: { $id: id } });
  db.exec({ sql: 'DELETE FROM registration_records WHERE recipient_id = $id', bind: { $id: id } });
  db.exec({ sql: 'DELETE FROM recipients WHERE id = $id', bind: { $id: id } });
};
