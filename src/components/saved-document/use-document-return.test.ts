// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { useDocumentState } from './use-document-state';
import { cleanProtocolDraft } from './working-form-cleanup';

afterEach(cleanup);
const working = {
  recipientId: '1',
  recipientName: 'Текущий реципиент',
  componentUnitNumber: '11111111111111',
  diagnosis: 'Текущий диагноз',
  doctorName: 'Текущий врач',
};
const archived = {
  recipientId: '2',
  recipientName: 'Архивный реципиент',
  componentUnitNumber: '22222222222222',
  diagnosis: 'Архивный диагноз',
  doctorName: 'Архивный врач',
};

it.each(['view', 'edit'] as const)(
  'cleans the latest working draft on returning from %s without changing the saved snapshot',
  (mode) => {
    const { result } = renderHook(() =>
      useDocumentState(() => ({ ...working }), cleanProtocolDraft),
    );
    act(() => result.current.open({ id: 42, recipientId: 2 }, archived, mode));
    act(() => result.current.setValues((values) => ({ ...values, doctorName: 'Правка архива' })));
    act(() =>
      result.current.setWorkingValues((values) => ({ ...values, diagnosis: 'Новый диагноз' })),
    );
    expect(result.current.workingValues.componentUnitNumber).toBe('11111111111111');
    expect(result.current.originalValues).toEqual(archived);
    act(() => result.current.close());
    expect(result.current.mode).toBe('draft');
    expect(result.current.values).toMatchObject({
      ...working,
      diagnosis: 'Новый диагноз',
      doctorName: '',
      componentUnitNumber: '',
    });
    expect(archived.doctorName).toBe('Архивный врач');
    act(() =>
      result.current.setValues((values) => ({ ...values, componentUnitNumber: '33333333333333' })),
    );
    act(() => result.current.close());
    expect(result.current.values.componentUnitNumber).toBe('33333333333333');
  },
);

it('keeps the working draft intact when editing is cancelled or another archive is opened', () => {
  const { result } = renderHook(() => useDocumentState(() => ({ ...working }), cleanProtocolDraft));
  act(() => result.current.open({ id: 42, recipientId: 2 }, archived, 'edit'));
  act(() => result.current.cancel());
  expect(result.current.workingValues).toEqual(working);
  act(() =>
    result.current.open({ id: 43, recipientId: 2 }, { ...archived, doctorName: 'Другой врач' }),
  );
  expect(result.current.workingValues).toEqual(working);
});
