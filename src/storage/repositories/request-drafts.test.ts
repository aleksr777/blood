// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { database } from '../sqlite/database-client';
import { REQUEST_DRAFTS, savePreviousRequestDrafts } from './request-drafts';

vi.mock('../sqlite/database-client', () => ({
  database: {
    saveBloodRequestRecord: vi.fn(async () => ({})),
  },
}));
beforeEach(() => window.localStorage.clear());

it.each(REQUEST_DRAFTS)(
  'saves and clears $kind before switching recipients',
  async ({ storageKey, kind }) => {
    const draft = {
      sourceRecipientId: '1',
      recipientName: 'Предыдущий Реципиент',
      requiredComponent: 'Компонент крови',
      quantity: '2',
      medicalOrganization: 'МСЧ № 32',
    };
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
    await savePreviousRequestDrafts(2);
    expect(database.saveBloodRequestRecord).toHaveBeenCalledWith({
      recipientId: 1,
      kind,
      values: draft,
    });
    const next = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}');
    expect(next.medicalOrganization).toBe('МСЧ № 32');
    expect(next.sourceRecipientId).toBeUndefined();
    expect(next.requiredComponent).toBeUndefined();
    expect(next.quantity).toBeUndefined();
    await savePreviousRequestDrafts(2);
    expect(database.saveBloodRequestRecord).toHaveBeenCalledTimes(1);
  },
);

it('does not duplicate an already saved request when switching recipients', async () => {
  const { storageKey } = REQUEST_DRAFTS[0];
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({ sourceRecipientId: '1', quantity: '2' }),
  );
  window.localStorage.setItem(`${storageKey}:saved-record-id`, '10');
  await savePreviousRequestDrafts(2);
  expect(database.saveBloodRequestRecord).not.toHaveBeenCalled();
  expect(window.localStorage.getItem(`${storageKey}:saved-record-id`)).toBeNull();
});

it.each(REQUEST_DRAFTS)(
  'preserves an indications-only $kind before switching recipients',
  async ({ storageKey, kind }) => {
    const draft = {
      sourceRecipientId: '1',
      recipientName: 'Предыдущий Реципиент',
      indicationValues: { indicationComponent: 'erythrocytes', indicationRbcOngoingBleeding: '1' },
    };
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
    await savePreviousRequestDrafts(2);
    expect(database.saveBloodRequestRecord).toHaveBeenCalledWith({
      recipientId: 1,
      kind,
      values: draft,
    });
  },
);

it.each(REQUEST_DRAFTS)(
  'preserves a selected non-default component group in $kind',
  async ({ storageKey, kind }) => {
    const draft = {
      sourceRecipientId: '1',
      indicationValues: { indicationComponent: 'platelets' },
    };
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
    await savePreviousRequestDrafts(2);
    expect(database.saveBloodRequestRecord).toHaveBeenCalledWith({
      recipientId: 1,
      kind,
      values: draft,
    });
  },
);

it.each(REQUEST_DRAFTS)(
  'does not archive only reusable staff, organization and recipient data in $kind',
  async ({ storageKey, kind }) => {
    const draft = {
      sourceRecipientId: '1',
      recipientName: 'Предыдущий Реципиент',
      recipientProfileSnapshot: { diagnosis: 'Диагноз' },
      medicalOrganization: 'МСЧ № 32',
      doctorName: 'Врач',
      doctorPhone: '123',
      indicationValues:
        kind === 'individual-selection-direction' ? { indicationComponent: 'erythrocytes' } : {},
    };
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
    await savePreviousRequestDrafts(2);
    expect(database.saveBloodRequestRecord).not.toHaveBeenCalled();
  },
);

it('keeps the request draft intact if automatic archiving fails', async () => {
  const { storageKey } = REQUEST_DRAFTS[0];
  const raw = JSON.stringify({ sourceRecipientId: '1', quantity: '2' });
  window.localStorage.setItem(storageKey, raw);
  vi.mocked(database.saveBloodRequestRecord).mockRejectedValueOnce(new Error('Write failed'));
  await expect(savePreviousRequestDrafts(2)).rejects.toThrow('Write failed');
  expect(window.localStorage.getItem(storageKey)).toBe(raw);
});
