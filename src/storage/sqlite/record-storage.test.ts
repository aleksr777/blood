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
const hemacon = {
  componentName: 'Эритроцитная взвесь',
  componentUnitNumber: '76102200045636',
  donorAbo: 'A(II)',
  amountMl: '250',
  expirationDate: '2026-12-31',
};

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
      ...hemacon,
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

  it('creates a new protocol for a different unit number and retains earlier records', async () => {
    const recipient = await createRecipient('Тестовый Реципиент');
    const values = {
      recipientId: String(recipient.id),
      recipientName: recipient.fullName,
      ...hemacon,
    };
    const originalProtocol = await saveProtocolRecord({ ...values, amountMl: '250' });
    const originalRegistration = await saveRegistrationRecord({ ...values, roomNumber: '1' });
    const editedProtocol = await saveProtocolRecord({
      ...values,
      componentUnitNumber: '76102200045736',
      amountMl: '300',
    });
    const editedRegistration = await saveRegistrationRecord({ ...values, roomNumber: '2' });
    expect(editedProtocol.id).not.toBe(originalProtocol.id);
    expect(editedRegistration.id).not.toBe(originalRegistration.id);
    expect(await listProtocolRecords(recipient.id)).toEqual([editedProtocol, originalProtocol]);
    expect(await listRegistrationRecords(recipient.id)).toEqual([
      editedRegistration,
      originalRegistration,
    ]);
  });

  it('updates the same recipient and unit number, preserving the ID and creation time', async () => {
    const recipient = await createRecipient('Тестовый Реципиент');
    const values = {
      recipientId: String(recipient.id),
      recipientName: recipient.fullName,
      ...hemacon,
    };
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const original = await saveProtocolRecord(values);
    vi.mocked(Date.now).mockReturnValue(2000);
    const edited = await saveProtocolRecord({
      ...values,
      componentUnitNumber: '761022 000456 36',
      amountMl: '300',
    });
    expect(edited).toMatchObject({
      id: original.id,
      createdAt: 1000,
      updatedAt: 2000,
      values: { amountMl: '300' },
    });
    expect(await listProtocolRecords(recipient.id)).toEqual([edited]);
    const repeated = await Promise.all(
      Array.from({ length: 3 }, () => saveProtocolRecord(edited.values)),
    );
    expect(repeated.every((record) => record.id === original.id)).toBe(true);
    expect(await listProtocolRecords(recipient.id)).toHaveLength(1);
  });

  it('keeps identical unit numbers in different recipients isolated', async () => {
    const first = await createRecipient('Однофамилец Реципиент');
    const second = await createRecipient(first.fullName);
    const original = await saveProtocolRecord({
      ...hemacon,
      recipientId: String(first.id),
      recipientName: first.fullName,
    });
    const other = await saveProtocolRecord({
      ...hemacon,
      recipientId: String(second.id),
      recipientName: second.fullName,
      amountMl: '300',
    });
    expect(other.id).not.toBe(original.id);
    expect(await listProtocolRecords(first.id)).toEqual([original]);
    expect(await listProtocolRecords(second.id)).toEqual([other]);
  });

  it('rolls back the recipient update if saving the matching protocol fails', async () => {
    const recipient = await createRecipient('Исходное Имя');
    const values = {
      ...hemacon,
      recipientId: String(recipient.id),
      recipientName: recipient.fullName,
    };
    const original = await saveProtocolRecord(values);
    state.db!.exec(`CREATE TRIGGER fail_protocol_update BEFORE UPDATE ON protocol_records
      BEGIN SELECT RAISE(ABORT, 'Test write failure'); END`);
    await expect(
      saveProtocolRecord({ ...values, recipientName: 'Изменённое Имя', amountMl: '300' }),
    ).rejects.toThrow('Test write failure');
    expect((await getRecipientById(recipient.id)).fullName).toBe(recipient.fullName);
    expect(await listProtocolRecords(recipient.id)).toEqual([original]);
  });

  it.each<Record<string, string>>([
    { componentName: '' },
    { componentUnitNumber: '' },
    { componentUnitNumber: '761022' },
    { donorAbo: '' },
    { donorAbo: ' ', recipientAbo: 'A(II)' },
  ])(
    'rejects incomplete hemacon data before changing the recipient or archive: %j',
    async (missing) => {
      const recipient = await createRecipient('Исходное Имя');
      await expect(
        saveProtocolRecord({
          ...hemacon,
          ...missing,
          recipientId: String(recipient.id),
          recipientName: 'Изменённое Имя',
        }),
      ).rejects.toThrow('Заполните данные гемакона');
      expect((await getRecipientById(recipient.id)).fullName).toBe('Исходное Имя');
      expect(await listProtocolRecords(recipient.id)).toEqual([]);
    },
  );

  it('saves a protocol with just the three required hemacon fields', async () => {
    const recipient = await createRecipient('Тестовый Реципиент');
    const values = {
      recipientId: String(recipient.id),
      recipientName: recipient.fullName,
      componentName: hemacon.componentName,
      componentUnitNumber: hemacon.componentUnitNumber,
      donorAbo: hemacon.donorAbo,
    };
    const record = await saveProtocolRecord(values);
    expect(record.values).toEqual(values);
    expect(await listProtocolRecords(recipient.id)).toEqual([record]);
  });

  it('updates only the most recently saved matching record when legacy duplicates exist', async () => {
    const recipient = await createRecipient('Тест Старых Дублей');
    const values = {
      ...hemacon,
      recipientId: String(recipient.id),
      recipientName: recipient.fullName,
    };
    const original = await saveProtocolRecord(values);
    state.db!.exec({
      sql: 'INSERT INTO protocol_records (recipient_id, values_json, created_at, updated_at) VALUES ($recipient, $values, $now, $now)',
      bind: {
        $recipient: recipient.id,
        $values: JSON.stringify({ ...values, amountMl: '260' }),
        $now: original.updatedAt + 1,
      },
    });
    const [newest] = await listProtocolRecords(recipient.id);
    const updated = await saveProtocolRecord({ ...values, amountMl: '300' });
    expect(updated.id).toBe(newest.id);
    const records = await listProtocolRecords(recipient.id);
    expect(records).toHaveLength(2);
    expect(records.find(({ id }) => id === original.id)).toEqual(original);
    expect(records.find(({ id }) => id === newest.id)?.values.amountMl).toBe('300');
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
