import sqlite3InitModule, { type Database, type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { initializeSchema } from './database-schema';
import { createRecipient } from './recipient-create-store';
import { getRecipientById, removeRecipient } from './recipient-store';
import { listProtocolRecords, saveProtocolRecord } from './protocol-record-store';
import { listRegistrationRecords, saveRegistrationRecord } from './registration-record-store';
import { listBloodRequestRecords, saveBloodRequestRecord } from './blood-request-record-store';
import { completeProtocolDates } from '../../test-fixtures/protocol';

const state = vi.hoisted(() => ({ db: null as Database | null }));
vi.mock('./database', () => ({ getDatabase: async () => state.db }));
let sqlite3: Sqlite3Static;
beforeAll(async () => {
  sqlite3 = await sqlite3InitModule();
});
beforeEach(() => {
  state.db = new sqlite3.oo1.DB(':memory:');
  initializeSchema(state.db);
});
afterEach(() => state.db?.close());

const populate = async (name: string) => {
  const recipient = await createRecipient(name);
  const values = {
    ...completeProtocolDates,
    recipientId: String(recipient.id),
    recipientName: name,
    componentName: 'Эритроцитная взвесь',
    componentUnitNumber: '76102200045636',
    donorAbo: 'A(II)',
  };
  await saveProtocolRecord(values);
  await saveRegistrationRecord(values);
  for (const kind of ['component-request', 'individual-selection-direction'] as const)
    await saveBloodRequestRecord({ recipientId: recipient.id, kind, values });
  return recipient;
};
const records = async (id: number) =>
  Promise.all([
    listProtocolRecords(id),
    listRegistrationRecords(id),
    listBloodRequestRecords(id, 'component-request'),
    listBloodRequestRecords(id, 'individual-selection-direction'),
  ]);

it('rolls back all archived document deletions when deleting the recipient fails', async () => {
  const recipient = await populate('Исходный реципиент');
  const original = await records(recipient.id);
  state.db!.exec(`CREATE TRIGGER fail_recipient_delete BEFORE DELETE ON recipients
    BEGIN SELECT RAISE(ABORT, 'Test deletion failure'); END`);
  await expect(removeRecipient(recipient.id)).rejects.toThrow('Test deletion failure');
  expect((await getRecipientById(recipient.id)).fullName).toBe(recipient.fullName);
  expect(await records(recipient.id)).toEqual(original);
});

it('deletes all four document groups for only the requested recipient', async () => {
  const first = await populate('Первый реципиент');
  const second = await populate('Второй реципиент');
  const other = await records(second.id);
  await removeRecipient(first.id);
  await expect(getRecipientById(first.id)).rejects.toThrow('не найден');
  expect(await records(first.id)).toEqual([[], [], [], []]);
  expect(await records(second.id)).toEqual(other);
});
