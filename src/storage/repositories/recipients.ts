import { database } from '../sqlite/database-client';
import type { ProtocolValuesRecord } from '../sqlite/database-types';

export const searchRecipients = (query = '') => database.searchRecipients(query);

export const getRecipientById = (id: number) => database.getRecipientById(id);

export const findRecipientsByName = (fullName: string) => database.findRecipientsByName(fullName);

export const createRecipient = (fullName: string) => database.createRecipient(fullName);

export const updateRecipient = (id: number, values: ProtocolValuesRecord) =>
  database.updateRecipient(id, values);

export const removeRecipient = (id: number) => database.removeRecipient(id);

export const listProtocolRecords = (recipientId: number) =>
  database.listProtocolRecords(recipientId);

export const findProtocolRecordsByComponentUnitNumber = (
  componentUnitNumber: string,
  excludeRecordId: number | null,
) =>
  database.findProtocolRecordsByComponentUnitNumber(
    componentUnitNumber,
    excludeRecordId,
  );

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

export const listBloodRequestRecords = (
  recipientId: number,
  kind: import('../sqlite/database-types').BloodRequestRecordKind,
) => database.listBloodRequestRecords(recipientId, kind);

export const saveBloodRequestRecord = (
  input: import('../sqlite/database-types').SaveBloodRequestRecordInput,
) => database.saveBloodRequestRecord(input);

export const removeBloodRequestRecord = (id: number) =>
  database.removeBloodRequestRecord(id);

export type {
  BloodRequestRecord,
  BloodRequestRecordKind,
  BloodRequestRecordValues,
  ComponentUnitNumberMatch,
  ProtocolRecord,
  RecipientRecord,
  RegistrationRecord,
  SaveBloodRequestRecordInput,
} from '../sqlite/database-types';
