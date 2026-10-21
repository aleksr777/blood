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
