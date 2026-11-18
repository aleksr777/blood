// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { database } from '../../storage/sqlite/database-client';
import { adoptCurrentRecipientFromValues } from '../../storage/repositories/current-recipient';
import { completeProtocolDates } from '../../test-fixtures/protocol';
import { useProtocolWorkspace } from './use-protocol-workspace';

vi.mock('../../storage/sqlite/database-client', () => ({
  database: {
    loadProtocolDraft: vi.fn(),
    saveProtocolDraft: vi.fn(async () => undefined),
    clearProtocolDraft: vi.fn(async () => undefined),
    saveProtocolRecord: vi.fn(),
    updateProtocolRecord: vi.fn(),
    listProtocolRecords: vi.fn(async () => []),
  },
}));
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});
afterEach(cleanup);

it('saves a working form, keeps its contents, and updates the same record after edits', async () => {
  const values = {
    ...completeProtocolDates,
    recipientId: '1',
    recipientName: 'Реципиент',
    componentName: 'Эритроцитная взвесь',
    donorAbo: 'A(II)',
    componentUnitNumber: '76102200045636',
    doctorName: 'Первый врач',
  };
  adoptCurrentRecipientFromValues(values);
  vi.mocked(database.loadProtocolDraft).mockResolvedValue({
    values,
    protocolRecordId: null,
    updatedAt: Date.now(),
  });
  vi.mocked(database.saveProtocolRecord).mockImplementation(async (data) => ({
    id: 7,
    recipientId: 1,
    values: data,
    createdAt: 1,
    updatedAt: 1,
  }));
  vi.mocked(database.updateProtocolRecord).mockImplementation(async (id, data) => ({
    id,
    recipientId: 1,
    values: data,
    createdAt: 1,
    updatedAt: 2,
  }));
  const { result } = renderHook(useProtocolWorkspace);
  await waitFor(() => expect(result.current.values.recipientId).toBe('1'));
  await act(async () => expect(await result.current.saveToDatabase()).toBe(true));
  expect(result.current.document.mode).toBe('draft');
  expect(result.current.values.doctorName).toBe('Первый врач');
  expect(result.current.document.workingHasChanges).toBe(false);
  act(() => result.current.saveValues({ doctorName: 'Второй врач' }));
  expect(result.current.document.workingHasChanges).toBe(true);
  await act(async () => expect(await result.current.saveToDatabase()).toBe(true));
  expect(database.updateProtocolRecord).toHaveBeenCalledWith(
    7,
    expect.objectContaining({ doctorName: 'Второй врач' }),
  );
  expect(result.current.document.mode).toBe('draft');
  expect(result.current.document.workingHasChanges).toBe(false);
});
