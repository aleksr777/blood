import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import type { SavedDocumentReference } from './use-document-state';

type WorkingSave<T> = { record: SavedDocumentReference; values: T };

export const useWorkingSave = <T>(setValues: Dispatch<SetStateAction<T>>, key?: string) => {
  const [workingSave, setWorkingSave] = useState<WorkingSave<T> | null>(() => {
    try {
      const raw = key && window.sessionStorage.getItem(key);
      const saved = raw ? JSON.parse(raw) : null;
      return saved?.record && saved.values && typeof saved.values === 'object' ? saved : null;
    } catch {
      return null;
    }
  });
  const markWorkingSaved = useCallback(
    (record: SavedDocumentReference, values: T) => {
      const snapshot = { record, values: structuredClone(values) };
      setValues(values);
      setWorkingSave(snapshot);
      try {
        if (key) window.sessionStorage.setItem(key, JSON.stringify(snapshot));
      } catch {
        // The form remains usable when session storage is unavailable.
      }
    },
    [key, setValues],
  );
  const clearWorkingSave = useCallback(() => {
    setWorkingSave(null);
    try {
      if (key) window.sessionStorage.removeItem(key);
    } catch {
      // Ignore unavailable session storage.
    }
  }, [key]);
  return { workingSave, markWorkingSaved, clearWorkingSave };
};
