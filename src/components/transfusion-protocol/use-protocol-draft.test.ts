// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adoptCurrentRecipientFromValues } from '../../storage/repositories/current-recipient';
import { loadProtocolDraft } from '../../storage/repositories/protocol-draft';
import type { ProtocolValues } from './protocol-types';
import { useProtocolDraft } from './use-protocol-draft';

vi.mock('../../storage/sqlite/database-client', () => ({ database: {} }));
vi.mock('../../storage/repositories/protocol-draft', () => ({
  loadProtocolDraft: vi.fn(),
  saveProtocolDraft: vi.fn(async () => undefined),
  clearProtocolDraft: vi.fn(async () => undefined),
}));

const useDraft = () => {
  const [values, setValues] = useState<ProtocolValues>({});
  const [recordId, setRecordId] = useState<number | null>(null);
  useProtocolDraft({ values, recordId, setValues, setRecordId });
  return { values, recordId };
};
const recipientValues = { recipientId: '1', recipientName: 'Тестовый Реципиент' };

beforeEach(() => {
  window.localStorage.clear();
  adoptCurrentRecipientFromValues(recipientValues);
});
afterEach(cleanup);

describe('protocol draft restoration', () => {
  it('preserves a saved snapshot and its ID despite obsolete shared indications', async () => {
    window.localStorage.setItem('blood:current-indications', JSON.stringify({ recipientId: 1 }));
    vi.mocked(loadProtocolDraft).mockResolvedValue({
      values: {
        ...recipientValues,
        componentGroup: 'erythrocytes',
        indicationRbcOngoingBleeding: '1',
      },
      protocolRecordId: 42,
      updatedAt: Date.now(),
    });
    const { result } = renderHook(useDraft);
    await waitFor(() => expect(result.current.values.recipientId).toBe('1'));
    expect(result.current.values.indicationRbcOngoingBleeding).toBe('1');
    expect(result.current.recordId).toBe(42);
  });

  it("restores its own draft indications instead of another page's values", async () => {
    window.localStorage.setItem('blood:current-indications', JSON.stringify({ recipientId: 1 }));
    vi.mocked(loadProtocolDraft).mockResolvedValue({
      values: {
        ...recipientValues,
        componentGroup: 'platelets',
        indicationPlateletOtherText: 'Собственное показание',
      },
      protocolRecordId: null,
      updatedAt: Date.now(),
    });
    const { result } = renderHook(useDraft);
    await waitFor(() => expect(result.current.values.componentGroup).toBe('platelets'));
    expect(result.current.values.indicationPlateletOtherText).toBe('Собственное показание');
  });

  it('leaves inactivity expiry to the shared session even if this draft has not been edited', async () => {
    vi.mocked(loadProtocolDraft).mockResolvedValue({
      values: { ...recipientValues, componentUnitNumber: '12345678901234' },
      protocolRecordId: null,
      updatedAt: Date.now() - 25 * 60 * 60 * 1000,
    });
    const { result } = renderHook(useDraft);
    await waitFor(() => expect(result.current.values.recipientId).toBe('1'));
    expect(result.current.values.recipientId).toBe('1');
    expect(result.current.values.componentUnitNumber).toBe('12345678901234');
  });
});
