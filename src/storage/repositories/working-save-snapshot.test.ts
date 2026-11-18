// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { database } from '../sqlite/database-client';
import { savePreviousRequestDrafts } from './request-drafts';
import { clearWorkingSaveSnapshots, matchesWorkingSave } from './working-save-snapshot';

vi.mock('../sqlite/database-client', () => ({
  database: { saveBloodRequestRecord: vi.fn(async () => ({})) },
}));
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

it('distinguishes saved, edited and different-recipient forms', () => {
  const values = { sourceRecipientId: '1', quantity: '2' };
  window.sessionStorage.setItem(
    'blood:component-request-working-save',
    JSON.stringify({ record: { id: 10, recipientId: 1 }, values }),
  );
  expect(matchesWorkingSave('blood:component-request-working-save', 1, values)).toBe(true);
  expect(matchesWorkingSave('blood:component-request-working-save', 2, values)).toBe(false);
  expect(
    matchesWorkingSave('blood:component-request-working-save', 1, { ...values, quantity: '3' }),
  ).toBe(false);
  clearWorkingSaveSnapshots();
  expect(matchesWorkingSave('blood:component-request-working-save', 1, values)).toBe(false);
});

it('does not archive an unchanged saved working request twice on recipient change', async () => {
  const values = { sourceRecipientId: '1', requiredComponent: 'Эритроциты', quantity: '2' };
  window.localStorage.setItem('blood:component-request-direction-draft', JSON.stringify(values));
  window.sessionStorage.setItem(
    'blood:component-request-working-save',
    JSON.stringify({ record: { id: 10, recipientId: 1 }, values }),
  );
  await savePreviousRequestDrafts(2);
  expect(database.saveBloodRequestRecord).not.toHaveBeenCalled();
});
