import { getDatabase, type SqliteDatabase } from './database';
import type { ProtocolValuesRecord } from './database-types';
import {
  mapProtocol,
  normalizeKey,
  normalizeName,
  profileFromValues,
} from './recipient-data';

export const listProtocolRecords = async (recipientId: number) => {
  const db = await getDatabase();
  const rows = db.exec({
    sql: `
      SELECT id, recipient_id AS recipientId, values_json AS valuesJson,
        created_at AS createdAt, updated_at AS updatedAt
      FROM protocol_records
      WHERE recipient_id = $recipientId
      ORDER BY updated_at DESC, id DESC
    `,
    bind: { $recipientId: recipientId },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<Record<string, unknown>>;
  return rows.map(mapProtocol);
};

const upsertRecipient = (db: SqliteDatabase, values: ProtocolValuesRecord) => {
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

const insertProtocol = (
  db: SqliteDatabase,
  recipientId: number,
  values: ProtocolValuesRecord,
  now: number,
) => {
  db.exec({
    sql: `
      INSERT INTO protocol_records (recipient_id, values_json, created_at, updated_at)
      VALUES ($recipientId, $values, $now, $now)
    `,
    bind: { $recipientId: recipientId, $values: JSON.stringify(values), $now: now },
  });
  const rows = db.exec({
    sql: 'SELECT last_insert_rowid() AS id',
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ id: number }>;
  return Number(rows[0].id);
};

export const saveProtocolRecord = async (
  recordId: number | null,
  values: ProtocolValuesRecord,
) => {
  const db = await getDatabase();
  const recipientId = upsertRecipient(db, values);
  const now = Date.now();
  const id =
    recordId ??
    insertProtocol(db, recipientId, values, now);

  if (recordId) {
    db.exec({
      sql: `
        UPDATE protocol_records
        SET recipient_id = $recipientId, values_json = $values, updated_at = $now
        WHERE id = $id
      `,
      bind: {
        $recipientId: recipientId,
        $values: JSON.stringify(values),
        $now: now,
        $id: id,
      },
    });
  }

  const rows = db.exec({
    sql: `
      SELECT id, recipient_id AS recipientId, values_json AS valuesJson,
        created_at AS createdAt, updated_at AS updatedAt
      FROM protocol_records WHERE id = $id
    `,
    bind: { $id: id },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<Record<string, unknown>>;
  return mapProtocol(rows[0]);
};
