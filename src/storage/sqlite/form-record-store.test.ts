import sqlite3InitModule, { type Database, type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { initializeSchema } from './database-schema';
import { createRecipient } from './recipient-create-store';
import { getRecipientById } from './recipient-store';
import { listProtocolRecords, saveProtocolRecord } from './protocol-record-store';
import { listRegistrationRecords, saveRegistrationRecord } from './registration-record-store';
import { listBloodRequestRecords, saveBloodRequestRecord } from './blood-request-record-store';
import type { BloodRequestRecordKind, ProtocolValuesRecord } from './database-types';

const state = vi.hoisted(() => ({ db: null as Database | null }));
vi.mock('./database', () => ({ getDatabase: async () => state.db }));
const values = {
  recipientName: 'Тестовый Реципиент',
  componentName: 'Эритроцитная взвесь',
  componentUnitNumber: '76102200045636',
  donorAbo: 'A(II)',
  diagnosis: 'Исходный диагноз',
};
const requestKinds = ['component-request', 'individual-selection-direction'] as const;
const forms = [
  {
    kind: 'protocol',
    table: 'protocol_records',
    save: (id: number, data: ProtocolValuesRecord) =>
      saveProtocolRecord({ ...data, recipientId: String(id) }),
    list: listProtocolRecords,
  },
  {
    kind: 'registration',
    table: 'registration_records',
    save: (id: number, data: ProtocolValuesRecord) =>
      saveRegistrationRecord({ ...data, recipientId: String(id) }),
    list: listRegistrationRecords,
  },
  ...requestKinds.map((kind) => ({
    kind,
    table: 'blood_request_records',
    save: (id: number, data: ProtocolValuesRecord) =>
      saveBloodRequestRecord({ recipientId: id, kind, values: data }),
    list: (id: number) => listBloodRequestRecords(id, kind),
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
afterEach(() => state.db?.close());

it('rejects a request kind that could route a write into a different archive', async () => {
  const recipient = await createRecipient(values.recipientName);
  await expect(
    saveBloodRequestRecord({
      recipientId: recipient.id,
      kind: 'protocol' as BloodRequestRecordKind,
      values: {},
    }),
  ).rejects.toThrow('Неизвестный тип');
  expect(await listProtocolRecords(recipient.id)).toEqual([]);
});

it.each(forms)(
  'reuses identical $kind records without changing their values or dates',
  async (form) => {
    const recipient = await createRecipient(values.recipientName);
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const original = await form.save(recipient.id, values);
    vi.mocked(Date.now).mockReturnValue(2000);
    const reordered = Object.fromEntries(
      Object.entries({
        ...values,
        componentName: ` ${values.componentName} `,
        componentUnitNumber: '761022 000456 36',
        previousTransfusionsAutoText: 'Обновлённый служебный текст',
        optionalEmpty: '',
      }).reverse(),
    );
    expect(await form.save(recipient.id, reordered)).toEqual(original);
    expect(await form.list(recipient.id)).toEqual([original]);
  },
);

it.each(forms)(
  'prevents simultaneous first saves of the same $kind from creating duplicates',
  async (form) => {
    const recipient = await createRecipient(values.recipientName);
    const records = await Promise.all(
      Array.from({ length: 8 }, () => form.save(recipient.id, values)),
    );
    expect(records.every((record) => record.id === records[0].id)).toBe(true);
    expect(await form.list(recipient.id)).toEqual([records[0]]);
  },
);

it.each(forms)(
  'keeps the same $kind content isolated between recipients with identical names',
  async (form) => {
    const first = await createRecipient(values.recipientName);
    const second = await createRecipient(values.recipientName);
    const original = await form.save(first.id, values);
    const other = await form.save(second.id, values);
    expect(other.id).not.toBe(original.id);
    expect(await form.list(first.id)).toEqual([original]);
    expect(await form.list(second.id)).toEqual([other]);
  },
);

it.each(forms)(
  'reuses the newest existing $kind duplicate without deleting older records',
  async (form) => {
    const recipient = await createRecipient(values.recipientName);
    const original = await form.save(recipient.id, values);
    const isRequest = form.table === 'blood_request_records';
    state.db!.exec({
      sql: `INSERT INTO ${form.table} (recipient_id, values_json, created_at, updated_at${isRequest ? ', kind' : ''})
      VALUES ($recipientId, $values, $now, $now${isRequest ? ', $kind' : ''})`,
      bind: {
        $recipientId: recipient.id,
        $values: JSON.stringify(original.values),
        $now: original.updatedAt + 1,
        ...(isRequest ? { $kind: form.kind } : {}),
      },
    });
    const [newest] = await form.list(recipient.id);
    expect(await form.save(recipient.id, values)).toEqual(newest);
    expect(await form.list(recipient.id)).toEqual([newest, original]);
  },
);

it.each(forms.filter(({ kind }) => kind !== 'protocol'))(
  'creates a changed $kind version and reuses an older identical version on return',
  async (form) => {
    const recipient = await createRecipient(values.recipientName);
    const original = await form.save(recipient.id, values);
    const changed = await form.save(recipient.id, { ...values, diagnosis: 'Изменённый диагноз' });
    expect(changed.id).not.toBe(original.id);
    expect(await form.save(recipient.id, values)).toEqual(original);
    expect(await form.list(recipient.id)).toHaveLength(2);
  },
);

it.each(requestKinds)(
  'compares nested medical data for %s while ignoring autofill tracking',
  async (kind) => {
    const recipient = await createRecipient(values.recipientName);
    const input = {
      ...values,
      quantity: '2',
      indicationValues: { indicationComponent: 'erythrocytes', indicationRbcHemicHypoxia: '1' },
      recipientProfileSnapshot: { recipientName: values.recipientName, diagnosis: 'Исходный' },
      autoValues: { recipientName: values.recipientName },
    };
    const original = await saveBloodRequestRecord({
      recipientId: recipient.id,
      kind,
      values: input,
    });
    const repeated = await saveBloodRequestRecord({
      recipientId: recipient.id,
      kind,
      values: {
        ...input,
        indicationValues: {
          indicationRbcHemicHypoxia: '1',
          indicationComponent: 'erythrocytes',
          empty: '',
        },
        autoValues: { recipientName: 'Обновлённый источник' },
      },
    });
    expect(repeated).toEqual(original);
    const changed = await saveBloodRequestRecord({
      recipientId: recipient.id,
      kind,
      values: {
        ...input,
        recipientProfileSnapshot: { ...input.recipientProfileSnapshot, diagnosis: 'Изменённый' },
      },
    });
    expect(changed.id).not.toBe(original.id);
    const otherKind = requestKinds.find((item) => item !== kind)!;
    const other = await saveBloodRequestRecord({
      recipientId: recipient.id,
      kind: otherKind,
      values: input,
    });
    expect(other.id).not.toBe(original.id);
  },
);

it('compares registration table JSON independently of key order while preserving row order and transfusion identity', async () => {
  const recipient = await createRecipient(values.recipientName);
  const base = { ...values, recipientId: String(recipient.id) };
  const rows = [
    { protocolId: 10, componentName: 'Компонент', amountLiters: '0,25' },
    { protocolId: 11, componentName: 'Другой компонент', amountLiters: '0,3' },
  ];
  const saveRows = (items: typeof rows) =>
    saveRegistrationRecord({ ...base, registrationTransfusionRows: JSON.stringify(items) });
  const original = await saveRows(rows);
  const reorderedKeys = rows.map(({ protocolId, componentName, amountLiters }) => ({
    amountLiters,
    componentName,
    protocolId,
  }));
  expect(await saveRows(reorderedKeys)).toEqual(original);
  expect((await saveRows([...rows].reverse())).id).not.toBe(original.id);
  expect((await saveRows([{ ...rows[0], protocolId: 12 }, rows[1]])).id).not.toBe(original.id);
  expect(await listRegistrationRecords(recipient.id)).toHaveLength(3);
});

it('treats an empty registration table like a missing table', async () => {
  const recipient = await createRecipient(values.recipientName);
  const base = { ...values, recipientId: String(recipient.id) };
  const original = await saveRegistrationRecord(base);
  expect(await saveRegistrationRecord({ ...base, registrationTransfusionRows: '[]' })).toEqual(
    original,
  );
});

it('rolls back a recipient edit if inserting a changed registration fails', async () => {
  const recipient = await createRecipient(values.recipientName);
  const base = { ...values, recipientId: String(recipient.id) };
  const original = await saveRegistrationRecord(base);
  state.db!.exec(`CREATE TRIGGER fail_registration BEFORE INSERT ON registration_records
    BEGIN SELECT RAISE(ABORT, 'Test registration failure'); END`);
  await expect(
    saveRegistrationRecord({ ...base, recipientName: 'Изменённое Имя' }),
  ).rejects.toThrow('Test registration failure');
  expect((await getRecipientById(recipient.id)).fullName).toBe(values.recipientName);
  expect(await listRegistrationRecords(recipient.id)).toEqual([original]);
});
