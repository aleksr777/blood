import { getDatabase } from './database';
import { storeFormRecord, withFormRecordTransaction } from './form-record-store';
import type {
  BloodRequestRecord,
  BloodRequestRecordKind,
  BloodRequestRecordValues,
  SaveBloodRequestRecordInput,
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

export const saveBloodRequestRecord = async ({
  recipientId,
  kind,
  values,
  recordId,
}: SaveBloodRequestRecordInput) => {
  if (kind !== 'component-request' && kind !== 'individual-selection-direction') {
    throw new Error('Неизвестный тип заявки или направления.');
  }
  if (!Number.isSafeInteger(recipientId) || recipientId <= 0) {
    throw new Error('Выберите реципиента перед сохранением бланка.');
  }

  const db = await getDatabase();
  return withFormRecordTransaction(db, () => {
    const recipients = db.exec({
      sql: 'SELECT id FROM recipients WHERE id = $id',
      bind: { $id: recipientId },
      rowMode: 'object',
      returnValue: 'resultRows',
    }) as Array<{ id: number }>;
    if (!recipients.length) {
      throw new Error('Выбранная карточка реципиента удалена. Выберите пациента заново.');
    }
    return mapRecord(storeFormRecord(db, { recipientId, kind, values, recordId }));
  });
};

export const removeBloodRequestRecord = async (id: number) => {
  const db = await getDatabase();
  db.exec({
    sql: 'DELETE FROM blood_request_records WHERE id = $id',
    bind: { $id: id },
  });
};
