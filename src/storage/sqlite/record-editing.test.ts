import sqlite3InitModule, { type Database, type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { initializeSchema } from './database-schema';
import { createRecipient } from './recipient-create-store';
import { getRecipientById } from './recipient-store';
import {
  listProtocolRecords,
  saveProtocolRecord,
  removeProtocolRecord,
} from './protocol-record-store';
import {
  listRegistrationRecords,
  saveRegistrationRecord,
  removeRegistrationRecord,
} from './registration-record-store';
import {
  listBloodRequestRecords,
  saveBloodRequestRecord,
  removeBloodRequestRecord,
} from './blood-request-record-store';

const state = vi.hoisted(() => ({ db: null as Database | null }));
vi.mock('./database', () => ({ getDatabase: async () => state.db }));
const values = {
  recipientName: 'Реципиент',
  medicalRecordNumber: 'Исходная карта',
  componentName: 'Эритроцитная взвесь',
  componentUnitNumber: '76102200045636',
  donorAbo: 'A(II)',
};
const forms = [
  {
    kind: 'protocol',
    save: (recipientId: number, data: Record<string, string>, recordId?: number) =>
      saveProtocolRecord({ ...data, recipientId: String(recipientId) }, recordId),
    list: listProtocolRecords,
    remove: removeProtocolRecord,
  },
  {
    kind: 'registration',
    save: (recipientId: number, data: Record<string, string>, recordId?: number) =>
      saveRegistrationRecord({ ...data, recipientId: String(recipientId) }, recordId),
    list: listRegistrationRecords,
    remove: removeRegistrationRecord,
  },
  ...(['component-request', 'individual-selection-direction'] as const).map((kind) => ({
    kind,
    save: (recipientId: number, data: Record<string, string>, recordId?: number) =>
      saveBloodRequestRecord({ recipientId, values: data, kind, recordId }),
    list: (id: number) => listBloodRequestRecords(id, kind),
    remove: removeBloodRequestRecord,
  })),
];
let sqlite3: Sqlite3Static;
beforeAll(async () => {
  sqlite3 = await sqlite3InitModule();
});
beforeEach(() => {
  state.db = new sqlite3.oo1.DB(':memory:');
  initializeSchema(state.db);
});
afterEach(() => {
  state.db?.close();
  vi.restoreAllMocks();
});

it.each(forms)(
  'explicit editing updates the same $kind ID without changing the recipient profile',
  async (form) => {
    const recipient = await createRecipient(values.recipientName);
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const original = await form.save(recipient.id, values);
    const profile = await getRecipientById(recipient.id);
    vi.mocked(Date.now).mockReturnValue(2000);
    const edited = await form.save(
      recipient.id,
      {
        ...values,
        recipientName: 'Историческое имя',
        medicalRecordNumber: 'Исправленная карта',
        componentUnitNumber: '76102200045736',
      },
      original.id,
    );
    expect(edited).toMatchObject({
      id: original.id,
      recipientId: recipient.id,
      createdAt: 1000,
      updatedAt: 2000,
    });
    expect(await form.list(recipient.id)).toEqual([edited]);
    expect(await getRecipientById(recipient.id)).toEqual(profile);
  },
);

it.each(forms)('editing a deleted $kind never recreates the document', async (form) => {
  const recipient = await createRecipient(values.recipientName);
  const original = await form.save(recipient.id, values);
  await form.remove(original.id);
  await expect(
    form.save(recipient.id, { ...values, medicalRecordNumber: 'Правка' }, original.id),
  ).rejects.toThrow('удалён');
  expect(await form.list(recipient.id)).toEqual([]);
});

it.each(forms)('rejects moving a $kind record to a different recipient', async (form) => {
  const first = await createRecipient(values.recipientName);
  const second = await createRecipient('Другой реципиент');
  const original = await form.save(first.id, values);
  await expect(form.save(second.id, values, original.id)).rejects.toThrow('другому реципиенту');
  expect(await form.list(first.id)).toEqual([original]);
  expect(await form.list(second.id)).toEqual([]);
});

it.each(forms)(
  'rejects an edited $kind colliding with another record instead of overwriting or duplicating it',
  async (form) => {
    const recipient = await createRecipient(values.recipientName);
    const first = await form.save(recipient.id, values);
    const secondValues = {
      ...values,
      componentUnitNumber: '76102200045736',
      doctorName: 'Другой врач',
    };
    const second = await form.save(recipient.id, secondValues);
    await expect(form.save(recipient.id, secondValues, first.id)).rejects.toThrow('другой бланк');
    const records = await form.list(recipient.id);
    expect(records).toHaveLength(2);
    expect(records.find((record) => record.id === first.id)).toEqual(first);
    expect(records.find((record) => record.id === second.id)).toEqual(second);
  },
);
