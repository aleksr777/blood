import { getDatabase, type SqliteDatabase } from './database';
import type { ProtocolValuesRecord } from './database-types';
import { mapProtocol } from './recipient-data';
import { upsertRecipient } from './recipient-profile-store';

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

const recordExists = (db: SqliteDatabase, id: number) => {
  const rows = db.exec({
    sql: 'SELECT id FROM protocol_records WHERE id = $id LIMIT 1',
    bind: { $id: id },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ id: number }>;
  return Boolean(rows[0]);
};

export const saveProtocolRecord = async (
  recordId: number | null,
  values: ProtocolValuesRecord,
) => {
  const db = await getDatabase();
  const recipientId = upsertRecipient(db, values);
  const now = Date.now();
  const canUpdate = recordId !== null && recordExists(db, recordId);
  const id = canUpdate ? recordId : insertProtocol(db, recipientId, values, now);

  if (canUpdate) {
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
