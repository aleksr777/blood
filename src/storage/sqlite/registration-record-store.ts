import { getDatabase, type SqliteDatabase } from './database';
import type { ProtocolValuesRecord } from './database-types';
import { mapRegistration } from './recipient-data';
import { upsertRecipient } from './recipient-profile-store';

export const listRegistrationRecords = async (recipientId: number) => {
  const db = await getDatabase();
  const rows = db.exec({
    sql: `
      SELECT id, recipient_id AS recipientId, values_json AS valuesJson,
        created_at AS createdAt, updated_at AS updatedAt
      FROM registration_records
      WHERE recipient_id = $recipientId
      ORDER BY updated_at DESC, id DESC
    `,
    bind: { $recipientId: recipientId },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<Record<string, unknown>>;

  return rows.map(mapRegistration);
};

const insertRegistration = ({
  db,
  recipientId,
  values,
  now,
}: {
  db: SqliteDatabase;
  recipientId: number;
  values: ProtocolValuesRecord;
  now: number;
}) => {
  db.exec({
    sql: `
      INSERT INTO registration_records (recipient_id, values_json, created_at, updated_at)
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

export const saveRegistrationRecord = async (values: ProtocolValuesRecord) => {
  const db = await getDatabase();
  const selectedId = Number(values.recipientId);
  if (!Number.isSafeInteger(selectedId) || selectedId <= 0) {
    throw new Error('Выберите реципиента перед сохранением листа регистрации.');
  }
  const recipientId = upsertRecipient(
    db,
    values,
    Number.isSafeInteger(selectedId) && selectedId > 0 ? selectedId : null,
  );
  const id = insertRegistration({ db, recipientId, values, now: Date.now() });

  const rows = db.exec({
    sql: `
      SELECT id, recipient_id AS recipientId, values_json AS valuesJson,
        created_at AS createdAt, updated_at AS updatedAt
      FROM registration_records
      WHERE id = $id
    `,
    bind: { $id: id },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<Record<string, unknown>>;

  return mapRegistration(rows[0]);
};

export const removeRegistrationRecord = async (id: number) => {
  const db = await getDatabase();
  db.exec({
    sql: 'DELETE FROM registration_records WHERE id = $id',
    bind: { $id: id },
  });
};
