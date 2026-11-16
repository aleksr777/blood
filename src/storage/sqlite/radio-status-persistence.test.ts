import sqlite3InitModule, { type Database, type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { getFormContentKey } from '../../domain/form-content';
import { hasDocumentContent } from '../../domain/document-content';
import { getHistoryStatus } from '../../components/transfusion-protocol/recipient-history-model';
import { initializeSchema } from './database-schema';
import { createRecipient } from './recipient-create-store';
import { listProtocolRecords, saveProtocolRecord } from './protocol-record-store';
import { mergeProfileValues, profileFromValues } from './recipient-data';
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

it('stores explicit cancellations even when the old record used implicit defaults', async () => {
  const recipient = await createRecipient('Тестовый Реципиент');
  const values = {
    ...completeProtocolDates,
    recipientId: String(recipient.id),
    recipientName: 'Тестовый Реципиент',
    componentName: 'Эритроциты',
    donorAbo: 'A(II)',
    componentUnitNumber: '76102200045636',
  };
  const original = await saveProtocolRecord(values);
  const edited = await saveProtocolRecord(
    {
      ...original.values,
      selectionStatus: '',
      complicationsStatus: '',
      confirmedRecipientAboResult: '',
      planeTestResult: '',
      biologicalTestResult: '',
    },
    original.id,
  );
  expect(edited.id).toBe(original.id);
  const [reopened] = await listProtocolRecords(recipient.id);
  expect(reopened.values).toMatchObject({
    selectionStatus: '',
    complicationsStatus: '',
    confirmedRecipientAboResult: '',
    planeTestResult: '',
    biologicalTestResult: '',
  });
});

it('preserves a cleared history status with retained text in recipient profiles', () => {
  const old = { previousTransfusionsStatus: 'had', previousTransfusions: 'Трансфузия в прошлом' };
  const next = mergeProfileValues(old, { previousTransfusionsStatus: '' });
  expect(next).toMatchObject({
    previousTransfusionsStatus: '',
    previousTransfusions: 'Трансфузия в прошлом',
  });
  expect(getHistoryStatus(next.previousTransfusionsStatus, next.previousTransfusions)).toBe('');
  expect(profileFromValues(next)).toEqual(next);
});

it('distinguishes cancelled defaults without treating an empty form as filled', () => {
  expect(getFormContentKey({})).not.toBe(getFormContentKey({ biologicalTestResult: '' }));
  expect(getFormContentKey({})).toBe(getFormContentKey({ previousTransfusionsStatus: '' }));
  expect(getFormContentKey({ previousTransfusions: 'Ранее' })).not.toBe(
    getFormContentKey({ previousTransfusions: 'Ранее', previousTransfusionsStatus: '' }),
  );
  expect(
    hasDocumentContent('protocol', { biologicalTestResult: '', complicationsStatus: '' }),
  ).toBe(false);
});
