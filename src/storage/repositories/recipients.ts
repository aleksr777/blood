import { database } from '../sqlite/database-client';
import type { ProtocolValuesRecord } from '../sqlite/database-types';

export const searchRecipients = (query = '') => database.searchRecipients(query);

export const findRecipientsByName = (fullName: string) => database.findRecipientsByName(fullName);

export const createRecipient = (fullName: string) => database.createRecipient(fullName);

export const updateRecipient = (id: number, values: ProtocolValuesRecord) =>
  database.updateRecipient(id, values);

export const removeRecipient = (id: number) => database.removeRecipient(id);

export const listProtocolRecords = (recipientId: number) =>
  database.listProtocolRecords(recipientId);

export const removeProtocolRecord = (id: number) =>
  database.removeProtocolRecord(id);

export const saveProtocolRecord = (
  recordId: number | null,
  values: ProtocolValuesRecord,
) => database.saveProtocolRecord(recordId, values);

export const listRegistrationRecords = (recipientId: number) =>
  database.listRegistrationRecords(recipientId);

export const saveRegistrationRecord = (
  recordId: number | null,
  values: ProtocolValuesRecord,
) => database.saveRegistrationRecord(recordId, values);

export const removeRegistrationRecord = (id: number) =>
  database.removeRegistrationRecord(id);

export type {
  ProtocolRecord,
  RecipientRecord,
  RegistrationRecord,
} from '../sqlite/database-types';
