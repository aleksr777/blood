// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { listProtocolRecords, type ProtocolRecord } from '../../storage/repositories/recipients';
import { usePreviousTransfusionSuggestion } from './use-previous-transfusion-suggestion';

vi.mock('../../storage/repositories/recipients', () => ({ listProtocolRecords: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

const record = (id: number, patch: Record<string, string> = {}): ProtocolRecord => ({
  id,
  recipientId: 1,
  createdAt: 0,
  updatedAt: 0,
  values: {
    transfusionDate: '2000-01-01',
    endTime: '12:00',
    componentName: `Компонент ${id}`,
    amountMl: '250',
    componentUnitNumber: String(id).padStart(14, '0'),
    expirationDate: '2026-12-01',
    ...patch,
  },
});

it('uses the same complete previous records and suppresses suggestions for saved documents', async () => {
  vi.mocked(listProtocolRecords).mockResolvedValue([
    record(1),
    record(2, { componentUnitNumber: '12345678901234' }),
    record(3),
    record(4, { amountMl: '' }),
  ]);
  const { result, rerender } = renderHook(
    ({ savedDocument }) =>
      usePreviousTransfusionSuggestion({
        recipientId: '1',
        savedDocument,
        recordId: 1,
        componentUnitNumber: '12345678901234',
      }),
    { initialProps: { savedDocument: false } },
  );
  await waitFor(() => expect(result.current).toContain('Компонент 3'));
  expect(result.current).not.toMatch(/Компонент [124]/);
  rerender({ savedDocument: true });
  expect(result.current).toBe('');
  expect(listProtocolRecords).toHaveBeenCalledTimes(1);
});

it('discards a late response for a recipient who is no longer selected', async () => {
  const pending = new Map<number, (records: ProtocolRecord[]) => void>();
  vi.mocked(listProtocolRecords).mockImplementation(
    (id) => new Promise((resolve) => pending.set(id, resolve)),
  );
  const { result, rerender } = renderHook(
    ({ recipientId }) => usePreviousTransfusionSuggestion({ recipientId, savedDocument: false }),
    { initialProps: { recipientId: '1' } },
  );
  rerender({ recipientId: '2' });
  await act(async () => pending.get(2)?.([record(2)]));
  expect(result.current).toContain('Компонент 2');
  await act(async () => pending.get(1)?.([record(1)]));
  expect(result.current).toContain('Компонент 2');
  rerender({ recipientId: '3' });
  expect(result.current).toBe('');
});

it('refreshes after the six-hour threshold without inserting the history automatically', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 25, 12));
  vi.mocked(listProtocolRecords).mockResolvedValue([
    record(1, { transfusionDate: '2026-10-25', endTime: '06:00' }),
  ]);
  const { result } = renderHook(() =>
    usePreviousTransfusionSuggestion({ recipientId: '1', savedDocument: false }),
  );
  await act(async () => {
    await Promise.resolve();
  });
  expect(result.current).toBe('');
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1001);
  });
  expect(result.current).toContain('Компонент 1');
  expect(listProtocolRecords).toHaveBeenCalledTimes(2);
});
