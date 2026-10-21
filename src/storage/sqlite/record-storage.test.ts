import sqlite3InitModule, { type Database, type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeSchema } from './database-schema';
import { createRecipient } from './recipient-create-store';
import { getRecipientById, updateRecipient } from './recipient-store';
import { listProtocolRecords, saveProtocolRecord } from './protocol-record-store';
import { listRegistrationRecords, saveRegistrationRecord } from './registration-record-store';
import { listBloodRequestRecords, saveBloodRequestRecord } from './blood-request-record-store';

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

describe('saved form snapshots', () => {
  it('keeps every archive value and timestamp unchanged when a recipient profile is edited', async () => {
    const recipient = await createRecipient('Иванов Иван Иванович');
    const values = {
      recipientId: String(recipient.id),
      recipientName: recipient.fullName,
      recipientBirthDate: '1980-01-02',
      diagnosis: 'Исходный диагноз',
      componentUnitNumber: '12345678901234',
    };
    const protocol = await saveProtocolRecord(values);
    const registration = await saveRegistrationRecord(values);
    const requests = await Promise.all(
      (['component-request', 'individual-selection-direction'] as const).map((kind) =>
        saveBloodRequestRecord({ recipientId: recipient.id, kind, values }),
      ),
    );

    await updateRecipient(recipient.id, {
      recipientName: 'Петров Иван Иванович',
      recipientBirthDate: '1981-03-04',
      diagnosis: 'Новый диагноз',
    });

    expect(await listProtocolRecords(recipient.id)).toEqual([protocol]);
    expect(await listRegistrationRecords(recipient.id)).toEqual([registration]);
    for (const request of requests) {
      expect(await listBloodRequestRecords(recipient.id, request.kind)).toEqual([request]);
    }
    expect(await getRecipientById(recipient.id)).toMatchObject({
      fullName: 'Петров Иван Иванович',
      profile: { recipientBirthDate: '1981-03-04', diagnosis: 'Новый диагноз' },
    });
  });

  it('appends changed protocols and registration forms while retaining the original versions', async () => {
    const recipient = await createRecipient('Тестовый Реципиент');
    const values = { recipientId: String(recipient.id), recipientName: recipient.fullName };
    const originalProtocol = await saveProtocolRecord({ ...values, amountMl: '250' });
    const originalRegistration = await saveRegistrationRecord({ ...values, roomNumber: '1' });
    const editedProtocol = await saveProtocolRecord({ ...values, amountMl: '300' });
    const editedRegistration = await saveRegistrationRecord({ ...values, roomNumber: '2' });
    expect(editedProtocol.id).not.toBe(originalProtocol.id);
    expect(editedRegistration.id).not.toBe(originalRegistration.id);
    expect(await listProtocolRecords(recipient.id)).toEqual([editedProtocol, originalProtocol]);
    expect(await listRegistrationRecords(recipient.id)).toEqual([
      editedRegistration,
      originalRegistration,
    ]);
  });

  it('rejects requests for a deleted recipient rather than creating unreachable records', async () => {
    await expect(
      saveBloodRequestRecord({
        recipientId: 999,
        kind: 'component-request',
        values: { recipientName: 'Удалённый Реципиент' },
      }),
    ).rejects.toThrow(/реципиент/i);
  });
});
