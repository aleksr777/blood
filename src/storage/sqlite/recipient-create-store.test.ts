import sqlite3InitModule, { type Database, type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { initializeSchema } from './database-schema';
import { createRecipient } from './recipient-create-store';
import { getRecipientById } from './recipient-store';

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

it('stores the complete initial profile without donor or document-only fields', async () => {
  const values = {
    recipientBirthDate: '1990-02-03',
    recipientSex: 'Женский',
    recipientAbo: 'A(II)',
    recipientRh: 'Rh(-)',
    recipientAntigenK: '-',
    alloimmuneAntibodyStatus: 'found',
    alloimmuneAntibodyDescription: 'anti-D',
    recipientPregnanciesCount: '2',
    recipientBirthsCount: '1',
    recipientSpontaneousAbortionsCount: '0',
    recipientHemolyticDiseaseNewbornHistory: 'Нет',
    previousTransfusionsStatus: 'had',
    previousTransfusions: 'Трансфузия в 2020 году',
  };
  const created = await createRecipient('  Тестовая   Реципиентка ', {
    ...values,
    donorAbo: 'B(III)',
    componentUnitNumber: '12345678901234',
  });
  expect(created.fullName).toBe('Тестовая Реципиентка');
  expect(created.profile).toEqual({ ...values, recipientName: created.fullName });
  expect((await getRecipientById(created.id)).profile).toEqual(values);
  expect(created.protocolCount).toBe(0);
});

it('creates separate same-name profiles and leaves the existing card intact', async () => {
  const first = await createRecipient('Тестовый Реципиент', { recipientAbo: 'O(I)' });
  const before = await getRecipientById(first.id);
  const second = await createRecipient(first.fullName, { recipientAbo: 'AB(IV)' });
  expect(second.id).not.toBe(first.id);
  expect((await getRecipientById(second.id)).profile.recipientAbo).toBe('AB(IV)');
  expect(await getRecipientById(first.id)).toEqual(before);
});
