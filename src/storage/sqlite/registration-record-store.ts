import { getDatabase } from './database';
import type { ProtocolValuesRecord } from './database-types';
import { mapRegistration } from './recipient-data';
import { upsertRecipient } from './recipient-profile-store';
import { storeFormRecord, withFormRecordTransaction } from './form-record-store';

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

export const saveRegistrationRecord = async (values: ProtocolValuesRecord, recordId?: number) => {
  const selectedId = Number(values.recipientId);
  if (!Number.isSafeInteger(selectedId) || selectedId <= 0) {
    throw new Error('Выберите реципиента перед сохранением листа регистрации.');
  }
  const db = await getDatabase();
  return withFormRecordTransaction(db, () => {
    const recipientId =
      recordId === undefined ? upsertRecipient(db, values, selectedId) : selectedId;
    return mapRegistration(
      storeFormRecord(db, {
        kind: 'registration',
        recordId,
        recipientId,
        values: { ...values, recipientId: String(recipientId) },
      }),
    );
  });
};

export const removeRegistrationRecord = async (id: number) => {
  const db = await getDatabase();
  db.exec({
    sql: 'DELETE FROM registration_records WHERE id = $id',
    bind: { $id: id },
  });
};
