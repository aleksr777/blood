import { getDatabase } from './database';
import type { ComponentUnitNumberMatch, ProtocolValuesRecord } from './database-types';
import { mapProtocol } from './recipient-data';
import { upsertRecipient } from './recipient-profile-store';
import { storeFormRecord, withFormRecordTransaction } from './form-record-store';
import {
  getProtocolHemaconWarning,
  normalizeComponentUnitNumber,
} from '../../domain/protocol-hemacon';

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

export const saveProtocolRecord = async (values: ProtocolValuesRecord) => {
  const warning = getProtocolHemaconWarning(values);
  if (warning) throw new Error(warning);

  const db = await getDatabase();
  const selectedId = Number(values.recipientId);
  return withFormRecordTransaction(db, () => {
    const recipientId = upsertRecipient(
      db,
      values,
      Number.isSafeInteger(selectedId) && selectedId > 0 ? selectedId : null,
    );
    return mapProtocol(
      storeFormRecord(db, {
        kind: 'protocol',
        recipientId,
        values: { ...values, recipientId: String(recipientId) },
      }),
    );
  });
};
