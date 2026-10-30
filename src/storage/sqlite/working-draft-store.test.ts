import sqlite3InitModule, { type Database, type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeSchema } from './database-schema';
import { loadProtocolDraft, saveProtocolDraft } from './protocol-draft-store';
import { completeProtocolDates } from '../../test-fixtures/protocol';
import { loadRegistrationDraft, saveRegistrationDraft } from './registration-draft-store';
import { createRecipient } from './recipient-create-store';
import { getRecipientById } from './recipient-store';
import { listRegistrationRecords, saveRegistrationRecord } from './registration-record-store';
import { listProtocolRecords, saveProtocolRecord } from './protocol-record-store';
import { listBloodRequestRecords, saveBloodRequestRecord } from './blood-request-record-store';
import { listSavedOptions, rememberSavedOption } from './saved-option-store';
import { resetWorkingDrafts } from './working-draft-store';

const state = vi.hoisted(() => ({ db: null as Database | null }));
vi.mock('./database', () => ({ getDatabase: async () => state.db }));
let sqlite3: Sqlite3Static;
beforeAll(async () => {
  sqlite3 = await sqlite3InitModule();
});
beforeEach(async () => {
  state.db = new sqlite3.oo1.DB(':memory:');
  initializeSchema(state.db);
  await saveProtocolDraft({
    values: {
      recipientId: '1',
      recipientName: 'Старый Реципиент',
      doctorName: 'Старый Врач',
      componentUnitNumber: '76102200045636',
      reagentAntiASeries: '123',
      reagentAntiAExpiration: '2027-01-01',
      reagentAntiAManufacturer: 'Производитель',
    },
    protocolRecordId: null,
    updatedAt: 1000,
  });
  await saveRegistrationDraft({
    values: { recipientId: '1' },
    registrationRecordId: null,
    updatedAt: 1000,
  });
});
afterEach(() => state.db?.close());

describe('working draft reset', () => {
  it('clears both drafts in one transaction, keeping only working reagent fields', async () => {
    await resetWorkingDrafts();
    expect(await loadProtocolDraft()).toEqual({
      values: {
        reagentAntiASeries: '123',
        reagentAntiAExpiration: '2027-01-01',
        reagentAntiAManufacturer: 'Производитель',
      },
      protocolRecordId: null,
      updatedAt: 0,
    });
    expect(await loadRegistrationDraft()).toEqual({
      values: {},
      registrationRecordId: null,
      updatedAt: 0,
    });
    await resetWorkingDrafts();
    expect((await loadProtocolDraft()).values.reagentAntiASeries).toBe('123');
  });

  it('does not alter recipients, saved forms, or shared dropdown options', async () => {
    const recipient = await createRecipient('Архивный Реципиент');
    const values = {
      ...completeProtocolDates,
      recipientId: String(recipient.id),
      recipientName: recipient.fullName,
      componentUnitNumber: '76102200045636',
      donorAbo: 'A(II)',
      componentName: 'Эритроциты',
    };
    const protocol = await saveProtocolRecord(values);
    const registration = await saveRegistrationRecord(values);
    const requests = await Promise.all(
      (['component-request', 'individual-selection-direction'] as const).map((kind) =>
        saveBloodRequestRecord({ recipientId: recipient.id, kind, values }),
      ),
    );
    const profile = await getRecipientById(recipient.id);
    const options = await rememberSavedOption('reagentSeries', '123');
    await resetWorkingDrafts();
    expect(await getRecipientById(recipient.id)).toEqual(profile);
    expect(await listProtocolRecords(recipient.id)).toEqual([protocol]);
    expect(await listRegistrationRecords(recipient.id)).toEqual([registration]);
    for (const request of requests)
      expect(await listBloodRequestRecords(recipient.id, request.kind)).toEqual([request]);
    expect(await listSavedOptions('reagentSeries')).toEqual(options);
  });

  it('rolls back the entire SQL reset if clearing either draft fails', async () => {
    const protocol = await loadProtocolDraft();
    const registration = await loadRegistrationDraft();
    state.db!.exec(`CREATE TRIGGER fail_clear BEFORE DELETE ON registration_draft
      BEGIN SELECT RAISE(ABORT, 'Test failure'); END`);
    await expect(resetWorkingDrafts()).rejects.toThrow('Test failure');
    expect(await loadProtocolDraft()).toEqual(protocol);
    expect(await loadRegistrationDraft()).toEqual(registration);
  });

  it('does not promote reagent values from a legacy saved document into working defaults', async () => {
    await saveProtocolDraft({
      values: { reagentAntiASeries: 'ARCHIVE' },
      protocolRecordId: 42,
      updatedAt: 1000,
    });
    await resetWorkingDrafts();
    expect(await loadProtocolDraft()).toEqual({ values: {}, protocolRecordId: null, updatedAt: 0 });
  });
});
