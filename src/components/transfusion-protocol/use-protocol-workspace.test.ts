// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { database } from '../../storage/sqlite/database-client';
import { adoptCurrentRecipientFromValues } from '../../storage/repositories/current-recipient';
import { getProtocolHemaconWarning } from '../../domain/protocol-hemacon';
import { useProtocolWorkspace } from './use-protocol-workspace';

vi.mock('../../storage/sqlite/database-client', () => ({
  database: {
    loadProtocolDraft: vi.fn(),
    saveProtocolDraft: vi.fn(async () => undefined),
    clearProtocolDraft: vi.fn(async () => undefined),
    saveProtocolRecord: vi.fn(),
    listProtocolRecords: vi.fn(async () => []),
  },
}));
const hemacon = {
  componentName: 'Эритроцитная взвесь',
  componentUnitNumber: '76102200045636',
  donorAbo: 'A(II)',
};
const recipient = { recipientId: '1', recipientName: 'Тестовый Реципиент' };
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  adoptCurrentRecipientFromValues(recipient);
  vi.mocked(database.listProtocolRecords).mockResolvedValue([]);
  vi.mocked(database.saveProtocolRecord).mockImplementation(async (values) => ({
    id: 7,
    recipientId: 1,
    values,
    createdAt: 1000,
    updatedAt: 1000,
  }));
});
afterEach(cleanup);

const openDraft = async (values: Record<string, string>) => {
  vi.mocked(database.loadProtocolDraft).mockResolvedValue({
    values: { ...recipient, ...values },
    protocolRecordId: null,
    updatedAt: Date.now(),
  });
  const hook = renderHook(useProtocolWorkspace);
  await waitFor(() => expect(hook.result.current.values.recipientId).toBe('1'));
  return hook;
};

it.each<Record<string, string>>([
  { componentName: '' },
  { componentUnitNumber: '' },
  { componentUnitNumber: '761022' },
  { donorAbo: '' },
])('does not autosave an incomplete hemacon on New blank: %j', async (missing) => {
  const values = { ...hemacon, ...missing };
  const { result } = await openDraft(values);
  await act(async () => result.current.newBlank());
  expect(database.saveProtocolRecord).not.toHaveBeenCalled();
  expect(result.current.values).toMatchObject({ ...recipient, ...values });
  expect(result.current.status).toBe(getProtocolHemaconWarning(values));
  expect(result.current.activeBlock).toBe('donor');
});

it('creates an empty New blank without archiving a recipient-only draft', async () => {
  const { result } = await openDraft({});
  await act(async () => result.current.newBlank());
  expect(database.saveProtocolRecord).not.toHaveBeenCalled();
  expect(result.current.activeBlock).toBeNull();
  expect(result.current.values).toMatchObject(recipient);
});

it('autosaves a complete hemacon on New blank without requiring volume or expiration', async () => {
  const { result } = await openDraft({ ...hemacon, doctorName: 'Врач', nurseName: 'Медсестра' });
  await act(async () => result.current.newBlank());
  expect(database.saveProtocolRecord).toHaveBeenCalledTimes(1);
  expect(database.saveProtocolRecord).toHaveBeenCalledWith(expect.objectContaining(hemacon));
  expect(result.current.values).toMatchObject({
    ...recipient,
    doctorName: 'Врач',
    nurseName: 'Медсестра',
  });
  expect(result.current.values.componentUnitNumber).toBeUndefined();
  expect(result.current.recordId).toBeNull();
});

it('does not warn about saved unit number matches but still validates an incomplete number', async () => {
  vi.mocked(database.listProtocolRecords).mockResolvedValue([
    {
      id: 7,
      recipientId: 1,
      values: { ...recipient, ...hemacon },
      createdAt: 1000,
      updatedAt: 1000,
    },
  ]);
  const { result } = await openDraft(hemacon);
  await waitFor(() => expect(database.listProtocolRecords).toHaveBeenCalled());
  expect(result.current.componentUnitNumberWarning).toBe('');
  await act(async () => {
    result.current.saveValues({ componentUnitNumber: '761022' });
    result.current.validateComponentUnitNumber({ componentUnitNumber: '761022' });
  });
  expect(result.current.componentUnitNumberWarning).toContain('6 из 14 цифр');
});
