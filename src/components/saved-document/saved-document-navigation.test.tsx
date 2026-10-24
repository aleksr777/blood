// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import {
  navigateToSavedDocument,
  usePendingSavedDocument,
  type SavedDocumentKind,
} from './saved-document-navigation';
import { useDocumentState } from './use-document-state';

beforeEach(() => window.sessionStorage.clear());
afterEach(cleanup);
const snapshot = { doctorName: 'Сохранённый врач' };
const record = { id: 42, recipientId: 2, values: snapshot, createdAt: 1, updatedAt: 1 };

it.each([
  ['protocol', '#/protocol'],
  ['registration', '#/registration'],
  ['component-request', '#/component-request'],
  ['individual-selection-direction', '#/summary-request'],
] as const)('opens %s directly in edit mode without resetting edits on rerender', (kind, route) => {
  const input = kind === 'protocol' || kind === 'registration' ? record : { ...record, kind };
  navigateToSavedDocument(kind, input, 'edit');
  expect(window.location.hash).toBe(route);
  const { result, rerender } = renderHook(
    () => {
      const document = useDocumentState(() => ({ doctorName: 'Рабочий врач' }));
      usePendingSavedDocument(kind, (saved, mode) =>
        document.open(saved, saved.values as typeof snapshot, mode),
      );
      return document;
    },
    { wrapper: StrictMode },
  );
  expect(result.current.mode).toBe('edit');
  expect(result.current.values).toEqual(snapshot);
  expect(result.current.workingValues.doctorName).toBe('Рабочий врач');
  expect(window.sessionStorage.getItem(`blood:${kind}-open-record`)).toBeNull();
  act(() => result.current.setValues({ doctorName: 'Правка' }));
  rerender();
  expect(result.current.values.doctorName).toBe('Правка');
  act(() => result.current.cancel());
  expect(result.current.mode).toBe('view');
  expect(result.current.values).toEqual(snapshot);
});

it('opens a view request and an older direct record as read-only snapshots', () => {
  for (const legacy of [false, true]) {
    window.sessionStorage.setItem(
      'blood:protocol-open-record',
      JSON.stringify(legacy ? record : { record, mode: 'view' }),
    );
    const { result, unmount } = renderHook(() => {
      const document = useDocumentState(() => ({ doctorName: 'Рабочий врач' }));
      usePendingSavedDocument('protocol', (saved, mode) =>
        document.open(saved, saved.values as typeof snapshot, mode),
      );
      return document;
    });
    expect(result.current.mode).toBe('view');
    act(() => result.current.setValues({ doctorName: 'Подстановка' }));
    expect(result.current.values).toEqual(snapshot);
    unmount();
  }
});

it('ignores a record of a different request kind', () => {
  const kind: SavedDocumentKind = 'component-request';
  window.sessionStorage.setItem(
    `blood:${kind}-open-record`,
    JSON.stringify({ record: { ...record, kind: 'individual-selection-direction' }, mode: 'edit' }),
  );
  const { result } = renderHook(() => {
    const document = useDocumentState(() => snapshot);
    usePendingSavedDocument(kind, (saved, mode) =>
      document.open(saved, saved.values as typeof snapshot, mode),
    );
    return document;
  });
  expect(result.current.mode).toBe('draft');
});
