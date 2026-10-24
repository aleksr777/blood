import { getDatabase } from './database';
import type { ProtocolValuesRecord } from './database-types';
import { mapProtocol } from './recipient-data';
import { upsertRecipient } from './recipient-profile-store';
import { storeFormRecord, withFormRecordTransaction } from './form-record-store';
import { getProtocolHemaconWarning } from '../../domain/protocol-hemacon';

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

export const saveProtocolRecord = async (values: ProtocolValuesRecord, recordId?: number) => {
  const warning = getProtocolHemaconWarning(values);
  if (warning) throw new Error(warning);

  const db = await getDatabase();
  const selectedId = Number(values.recipientId);
  return withFormRecordTransaction(db, () => {
    if (recordId !== undefined && (!Number.isSafeInteger(selectedId) || selectedId <= 0)) {
      throw new Error('Не указан реципиент сохранённого бланка.');
    }
    const recipientId =
      recordId !== undefined
        ? selectedId
        : upsertRecipient(
            db,
            values,
            Number.isSafeInteger(selectedId) && selectedId > 0 ? selectedId : null,
          );
    return mapProtocol(
      storeFormRecord(db, {
        kind: 'protocol',
        recordId,
        recipientId,
        values: { ...values, recipientId: String(recipientId) },
      }),
    );
  });
};
