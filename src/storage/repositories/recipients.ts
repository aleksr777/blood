import { database } from '../sqlite/database-client';
import type { ProtocolValuesRecord } from '../sqlite/database-types';

export const searchRecipients = (query = '') => database.searchRecipients(query);

export const listProtocolRecords = (recipientId: number) =>
  database.listProtocolRecords(recipientId);

export const saveProtocolRecord = (
  recordId: number | null,
  values: ProtocolValuesRecord,
) => database.saveProtocolRecord(recordId, values);

export type { ProtocolRecord, RecipientRecord } from '../sqlite/database-types';
