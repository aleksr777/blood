import { getDatabase, type SqliteDatabase } from './database';
import type {
  BloodRequestRecord,
  BloodRequestRecordKind,
  BloodRequestRecordValues,
} from './database-types';

const parseValues = (value: string): BloodRequestRecordValues => {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as BloodRequestRecordValues)
      : {};
  } catch {
    return {};
  }
};

const mapRecord = (row: Record<string, unknown>): BloodRequestRecord => ({
  id: Number(row.id),
  recipientId: Number(row.recipientId),
  kind: String(row.kind) as BloodRequestRecordKind,
  values: parseValues(String(row.valuesJson ?? '{}')),
  createdAt: Number(row.createdAt),
  updatedAt: Number(row.updatedAt),
});

const findLinkedRecord = (
  db: SqliteDatabase,
  id: number | null,
): { recipientId: number; kind: BloodRequestRecordKind } | null => {
  if (id === null) return null;

  const rows = db.exec({
    sql: `
      SELECT recipient_id AS recipientId, kind
      FROM blood_request_records
      WHERE id = $id
    `,
    bind: { $id: id },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<{ recipientId: number; kind: BloodRequestRecordKind }>;

  return rows[0] ?? null;
};

export const listBloodRequestRecords = async (
  recipientId: number,
  kind: BloodRequestRecordKind,
) => {
  const db = await getDatabase();
  const rows = db.exec({
    sql: `
      SELECT id, recipient_id AS recipientId, kind, values_json AS valuesJson,
        created_at AS createdAt, updated_at AS updatedAt
      FROM blood_request_records
      WHERE recipient_id = $recipientId AND kind = $kind
      ORDER BY updated_at DESC, id DESC
    `,
    bind: { $recipientId: recipientId, $kind: kind },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<Record<string, unknown>>;

  return rows.map(mapRecord);
};

const insertRecord = (
  db: SqliteDatabase,
  recipientId: number,
  kind: BloodRequestRecordKind,
  values: BloodRequestRecordValues,
  now: number,
) => {
  db.exec({
    sql: `
      INSERT INTO blood_request_records
        (recipient_id, kind, values_json, created_at, updated_at)
      VALUES ($recipientId, $kind, $values, $now, $now)
    `,
    bind: {
      $recipientId: recipientId,
      $kind: kind,
      $values: JSON.stringify(values),
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

export const saveBloodRequestRecord = async (
  recordId: number | null,
  recipientId: number,
  kind: BloodRequestRecordKind,
  values: BloodRequestRecordValues,
) => {
  if (!Number.isFinite(recipientId) || recipientId <= 0) {
    throw new Error('Выберите реципиента перед сохранением бланка.');
  }

  const db = await getDatabase();
  const linked = findLinkedRecord(db, recordId);

  if (linked && linked.recipientId !== recipientId) {
    throw new Error('Для другого реципиента создайте новый бланк.');
  }
  if (linked && linked.kind !== kind) {
    throw new Error('Тип сохранённого бланка не совпадает.');
  }

  const now = Date.now();
  const id = linked
    ? recordId
    : insertRecord(db, recipientId, kind, values, now);

  if (linked && id !== null) {
    db.exec({
      sql: `
        UPDATE blood_request_records
        SET values_json = $values, updated_at = $now
        WHERE id = $id
      `,
      bind: {
        $values: JSON.stringify(values),
        $now: now,
        $id: id,
      },
    });
  }

  const rows = db.exec({
    sql: `
      SELECT id, recipient_id AS recipientId, kind, values_json AS valuesJson,
        created_at AS createdAt, updated_at AS updatedAt
      FROM blood_request_records
      WHERE id = $id
    `,
    bind: { $id: id },
    rowMode: 'object',
    returnValue: 'resultRows',
  }) as Array<Record<string, unknown>>;

  if (!rows[0]) throw new Error('Не удалось сохранить бланк.');
  return mapRecord(rows[0]);
};

export const removeBloodRequestRecord = async (id: number) => {
  const db = await getDatabase();
  db.exec({
    sql: 'DELETE FROM blood_request_records WHERE id = $id',
    bind: { $id: id },
  });
};
