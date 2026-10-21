import { getDatabase, type SqliteDatabase } from './database';
import type { ComponentUnitNumberMatch, ProtocolValuesRecord } from './database-types';
import { mapProtocol } from './recipient-data';
import { upsertRecipient } from './recipient-profile-store';

const normalizeComponentUnitNumber = (value?: string) => (value ?? '').replace(/\D/g, '');

export const findProtocolRecordsByComponentUnitNumber = async (
  componentUnitNumber: string,
  excludeRecordId: number | null,
): Promise<ComponentUnitNumberMatch[]> => {
  const digits = normalizeComponentUnitNumber(componentUnitNumber);
  if (!digits) return [];

  const db = await getDatabase();
  const rows = db.exec({
    sql: `
      SELECT p.id, p.recipient_id AS recipientId, p.values_json AS valuesJson,
        r.full_name AS recipientName
      FROM protocol_records p
      JOIN recipients r ON r.id = p.recipient_id
      WHERE ($excludeRecordId IS NULL OR p.id <> $excludeRecordId)
      ORDER BY p.updated_at DESC, p.id DESC
    `,
    bind: { $excludeRecordId: excludeRecordId },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<Record<string, unknown>>;

  return rows.flatMap((row) => {
    try {
      const values = JSON.parse(String(row.valuesJson ?? '{}')) as ProtocolValuesRecord;
      if (normalizeComponentUnitNumber(values.componentUnitNumber) !== digits) return [];

      return [
        {
          id: Number(row.id),
          recipientId: Number(row.recipientId),
          recipientName: String(row.recipientName ?? ''),
          transfusionDate: values.transfusionDate ?? '',
        },
      ];
    } catch {
      return [];
    }
  });
};

export const removeProtocolRecord = async (id: number) => {
  const db = await getDatabase();
  db.exec({
    sql: 'DELETE FROM protocol_records WHERE id = $id',
    bind: { $id: id },
  });
};

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

const insertProtocol = ({
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

export const saveProtocolRecord = async (values: ProtocolValuesRecord) => {
  const db = await getDatabase();
  const selectedId = Number(values.recipientId);
  const recipientId = upsertRecipient(
    db,
    values,
    Number.isSafeInteger(selectedId) && selectedId > 0 ? selectedId : null,
  );
  const id = insertProtocol({ db, recipientId, values, now: Date.now() });

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
