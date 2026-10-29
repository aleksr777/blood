// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { useDocumentState } from './use-document-state';

afterEach(cleanup);
const record = { id: 42, recipientId: 2 };
const snapshot = {
  recipientName: 'Сохранённый реципиент',
  doctorName: 'Врач',
  indicationValues: { indications: 'Исходные показания' },
};

it.each(['direct', 'from-view'] as const)(
  'detects and reverts edits after opening %s without changing the source or working draft',
  (entry) => {
    const working = { ...snapshot, doctorName: 'Текущий врач' };
    const { result } = renderHook(() => useDocumentState(() => working));
    expect(result.current.hasChanges).toBe(false);
    act(() => result.current.open(record, snapshot, entry === 'direct' ? 'edit' : 'view'));
    if (entry === 'from-view') act(() => result.current.edit());
    expect(result.current.hasChanges).toBe(false);
    act(() => result.current.setValues({ ...snapshot, doctorName: 'Другой врач' }));
    expect(result.current.hasChanges).toBe(true);
    act(() => result.current.setValues(structuredClone(snapshot)));
    expect(result.current.hasChanges).toBe(false);
    act(() =>
      result.current.setValues({
        ...snapshot,
        indicationValues: { indications: 'Изменённые показания' },
      }),
    );
    expect(result.current.hasChanges).toBe(true);
    expect(result.current.originalValues).toEqual(snapshot);
    expect(result.current.workingValues).toEqual(working);
    act(() => result.current.cancel());
    expect(result.current.hasChanges).toBe(false);
    act(() => result.current.edit());
    expect(result.current.hasChanges).toBe(false);
  },
);

it('ignores empty fields, object key order, tracking and attempts to change locked identity', () => {
  const { result } = renderHook(() => useDocumentState<Record<string, unknown>>(() => ({})));
  act(() => result.current.open(record, snapshot, 'edit'));
  act(() =>
    result.current.setValues({
      indicationValues: { optional: '', indications: 'Исходные показания' },
      doctorName: 'Врач',
      recipientName: 'Недопустимая правка имени',
      previousTransfusionsSuggestedText: 'Служебная подсказка',
      autoValues: { doctorName: 'Врач' },
      optional: '',
    }),
  );
  expect(result.current.hasChanges).toBe(false);
  expect(result.current.values.recipientName).toBe(snapshot.recipientName);
});

it('detects registration table edits and clears the change flag after an update', () => {
  const original = {
    registrationTransfusionRows: '[{"componentName":"Эритроциты","volume":"250"}]',
  };
  const { result } = renderHook(() => useDocumentState(() => original));
  act(() => result.current.open(record, original, 'edit'));
  act(() =>
    result.current.setValues({
      registrationTransfusionRows: '[{"volume":"250","componentName":"Эритроциты"}]',
    }),
  );
  expect(result.current.hasChanges).toBe(false);
  act(() =>
    result.current.setValues({
      registrationTransfusionRows: '[{"componentName":"Эритроциты","volume":"300"}]',
    }),
  );
  expect(result.current.hasChanges).toBe(true);
  act(() => result.current.open(record, result.current.values));
  expect(result.current.hasChanges).toBe(false);
  act(() => result.current.edit());
  expect(result.current.hasChanges).toBe(false);
  act(() => result.current.close());
  expect(result.current.hasChanges).toBe(false);
});
