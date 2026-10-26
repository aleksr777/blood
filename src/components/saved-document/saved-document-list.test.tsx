// @vitest-environment jsdom
import { useState } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  getSavedDocumentList,
  rememberSavedDocumentList,
  useSavedDocumentList,
} from './saved-document-list';

const record = { id: 42, recipientId: 7 };
const location = { kind: 'protocol', recipientId: 7, recordId: 42, query: 'Иванов' } as const;
beforeEach(() => window.sessionStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('restores the source list and clears the return state after the modal closes', () => {
  rememberSavedDocumentList(location);
  const { result } = renderHook(() => {
    const [open, setOpen] = useState(false);
    const list = useSavedDocumentList({
      kind: 'protocol',
      record,
      open,
      onOpen: () => setOpen(true),
    });
    return { ...list, open, close: () => setOpen(false) };
  });
  expect(result.current.initialList).toBeNull();
  act(() => result.current.returnToList());
  expect(result.current.open).toBe(true);
  expect(result.current.initialList).toEqual(location);
  act(() => result.current.close());
  expect(result.current.initialList).toBeNull();
  act(() => result.current.returnToList());
  expect(result.current.initialList).toEqual(location);
});

it.each([
  'protocol',
  'registration',
  'component-request',
  'individual-selection-direction',
] as const)('falls back to the opened record in %s when no source list was recorded', (kind) => {
  expect(getSavedDocumentList(kind, record)).toEqual({
    kind,
    recipientId: 7,
    recordId: 42,
    query: '',
  });
});

it('does not reuse the search for another patient, kind or record with a colliding ID', () => {
  rememberSavedDocumentList(location);
  expect(getSavedDocumentList('protocol', { ...record, recipientId: 8 }).query).toBe('');
  expect(getSavedDocumentList('protocol', { ...record, id: 43 }).query).toBe('');
  expect(getSavedDocumentList('registration', record).query).toBe('');
  expect(getSavedDocumentList('protocol', record).query).toBe('Иванов');
});

it('uses a safe fallback when session data is invalid or storage is unavailable', () => {
  window.sessionStorage.setItem('blood:saved-document-list', '{invalid');
  expect(getSavedDocumentList('protocol', record).query).toBe('');
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  expect(() => rememberSavedDocumentList(location)).not.toThrow();
  expect(getSavedDocumentList('protocol', record)).toEqual({ ...location, query: '' });
});

it('does not open a list without an active saved record', () => {
  const onOpen = vi.fn();
  const { result } = renderHook(() =>
    useSavedDocumentList({
      kind: 'protocol',
      record: null,
      open: false,
      onOpen,
    }),
  );
  act(() => result.current.returnToList());
  expect(onOpen).not.toHaveBeenCalled();
});
