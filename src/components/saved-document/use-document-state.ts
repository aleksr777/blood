import { useCallback, useRef, useState, type SetStateAction } from 'react';
import { preserveSavedRecipientIdentity } from '../../domain/saved-recipient-identity';

export type SavedDocumentMode = 'view' | 'edit';
export type SavedDocumentReference = {
  id: number;
  recipientId: number;
  createdAt?: number;
  updatedAt?: number;
};
export type SavedDocumentControls = {
  mode: 'draft' | 'view' | 'edit';
  record: SavedDocumentReference | null;
  edit: () => void;
  cancel: () => void;
  close: () => void;
};

type SavedState<T> = {
  record: SavedDocumentReference;
  mode: SavedDocumentMode;
  original: T;
  values: T;
};

export const useDocumentState = <T extends Record<string, unknown>>(
  initial: () => T,
  cleanWorkingValuesOnClose?: (values: T) => T,
) => {
  const [workingValues, setWorkingValues] = useState<T>(initial);
  const [saved, setSaved] = useState<SavedState<T> | null>(null);
  const savedRef = useRef(saved);
  const publish = useCallback((next: SavedState<T> | null) => {
    savedRef.current = next;
    setSaved(next);
  }, []);
  const open = useCallback(
    (record: SavedDocumentReference, values: T, mode: SavedDocumentMode = 'view') => {
      const snapshot = structuredClone(values);
      publish({ record, mode, original: snapshot, values: snapshot });
    },
    [publish],
  );
  const setValues = useCallback(
    (update: SetStateAction<T>) => {
      const current = savedRef.current;
      if (!current) {
        setWorkingValues(update);
      } else if (current.mode === 'edit') {
        const values =
          typeof update === 'function' ? (update as (previous: T) => T)(current.values) : update;
        publish({ ...current, values: preserveSavedRecipientIdentity(current.original, values) });
      }
    },
    [publish],
  );
  const edit = useCallback(() => {
    const current = savedRef.current;
    if (current) publish({ ...current, mode: 'edit', values: structuredClone(current.original) });
  }, [publish]);
  const cancel = useCallback(() => {
    const current = savedRef.current;
    if (current) publish({ ...current, mode: 'view', values: current.original });
  }, [publish]);
  const close = useCallback(() => {
    if (!savedRef.current) return;
    if (cleanWorkingValuesOnClose) setWorkingValues(cleanWorkingValuesOnClose);
    publish(null);
  }, [publish, cleanWorkingValuesOnClose]);
  const isActive = useCallback(() => savedRef.current !== null, []);
  const isReadOnly = useCallback(() => savedRef.current?.mode === 'view', []);

  const mode: SavedDocumentControls['mode'] = saved?.mode ?? 'draft';
  return {
    values: saved?.values ?? workingValues,
    setValues,
    workingValues,
    setWorkingValues,
    mode,
    record: saved?.record ?? null,
    originalValues: saved?.original ?? null,
    active: saved !== null,
    readOnly: saved?.mode === 'view',
    editing: saved?.mode === 'edit',
    isActive,
    isReadOnly,
    open,
    edit,
    cancel,
    close,
  };
};
