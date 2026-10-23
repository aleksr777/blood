// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { useDocumentState } from './use-document-state';

afterEach(cleanup);
const working = { name: 'Текущий бланк', profile: { diagnosis: 'Текущий диагноз' } };
const snapshot = { name: 'Сохранённый бланк', profile: { diagnosis: 'Старый диагноз' } };
const record = { id: 42, recipientId: 2 };

it('opens a separate immutable snapshot and leaves the working draft intact', () => {
  const { result } = renderHook(() => useDocumentState(() => structuredClone(working)));
  const input = structuredClone(snapshot);
  act(() => result.current.open(record, input));
  input.profile.diagnosis = 'Изменён снаружи';
  act(() => result.current.setValues({ name: 'Попытка изменения', profile: { diagnosis: '' } }));
  expect(result.current.mode).toBe('view');
  expect(result.current.values).toEqual(snapshot);
  expect(result.current.workingValues).toEqual(working);
  act(() => result.current.setWorkingValues({ ...working, name: 'Обновлённый текущий бланк' }));
  expect(result.current.values).toEqual(snapshot);
  act(() => result.current.close());
  expect(result.current.values.name).toBe('Обновлённый текущий бланк');
});

it('edits only after an explicit action and cancels without changing the snapshot or draft', () => {
  const { result } = renderHook(() => useDocumentState(() => working));
  act(() => result.current.open(record, snapshot));
  act(() => result.current.edit());
  act(() =>
    result.current.setValues((current) => ({ ...current, profile: { diagnosis: 'Правка' } })),
  );
  expect(result.current.values.profile.diagnosis).toBe('Правка');
  expect(result.current.workingValues).toEqual(working);
  act(() => result.current.cancel());
  expect(result.current.mode).toBe('view');
  expect(result.current.values).toEqual(snapshot);
  act(() => result.current.edit());
  expect(result.current.values).toEqual(snapshot);
  act(() => result.current.close());
  expect(result.current.values).toEqual(working);
});

it('returns to view after a committed update while preserving the draft and record ID', () => {
  const { result } = renderHook(() => useDocumentState(() => working));
  act(() => result.current.open(record, snapshot));
  act(() => result.current.edit());
  act(() => result.current.setValues({ ...snapshot, name: 'Сохранённая правка' }));
  act(() => result.current.open(record, result.current.values));
  expect(result.current.mode).toBe('view');
  expect(result.current.record?.id).toBe(42);
  expect(result.current.values.name).toBe('Сохранённая правка');
  act(() => result.current.close());
  expect(result.current.values).toEqual(working);
});
