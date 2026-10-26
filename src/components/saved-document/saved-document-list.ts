import { useEffect, useState } from 'react';
import type { SavedDocumentKind } from './saved-document-navigation';
import type { SavedDocumentReference } from './use-document-state';

export type SavedDocumentListLocation = {
  kind: SavedDocumentKind;
  recipientId: number;
  recordId: number;
  query: string;
};

const STORAGE_KEY = 'blood:saved-document-list';

export const rememberSavedDocumentList = (location: SavedDocumentListLocation) => {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    return;
  }
};

export const getSavedDocumentList = (
  kind: SavedDocumentKind,
  record: SavedDocumentReference,
): SavedDocumentListLocation => {
  const fallback = { kind, recipientId: record.recipientId, recordId: record.id, query: '' };
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? 'null');
    if (
      saved?.kind === kind &&
      saved.recipientId === record.recipientId &&
      saved.recordId === record.id &&
      typeof saved.query === 'string'
    ) {
      return { ...fallback, query: saved.query };
    }
  } catch {
    return fallback;
  }
  return fallback;
};

export const useSavedDocumentList = ({
  kind,
  record,
  open,
  onOpen,
}: {
  kind: SavedDocumentKind;
  record: SavedDocumentReference | null;
  open: boolean;
  onOpen: () => void;
}) => {
  const [initialList, setInitialList] = useState<SavedDocumentListLocation | null>(null);
  useEffect(() => {
    if (!open) setInitialList(null);
  }, [open]);
  const returnToList = () => {
    if (!record) return;
    setInitialList(getSavedDocumentList(kind, record));
    onOpen();
  };
  return { initialList, returnToList };
};
