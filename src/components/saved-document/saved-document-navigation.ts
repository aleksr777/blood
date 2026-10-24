import { useEffect, useRef, useState } from 'react';
import type {
  BloodRequestRecord,
  ProtocolRecord,
  RecipientRecord,
  RegistrationRecord,
} from '../../storage/repositories/recipients';
import type { SavedDocumentMode } from './use-document-state';

type RecordsByKind = {
  protocol: ProtocolRecord;
  registration: RegistrationRecord;
  'component-request': BloodRequestRecord;
  'individual-selection-direction': BloodRequestRecord;
};
export type SavedDocumentKind = keyof RecordsByKind;
export type SavedRecordOpener<T> = (
  record: T,
  recipient: RecipientRecord,
  mode: SavedDocumentMode,
) => void;

const routes = {
  protocol: '#/protocol',
  registration: '#/registration',
  'component-request': '#/component-request',
  'individual-selection-direction': '#/summary-request',
};
const pendingKey = (kind: SavedDocumentKind) => `blood:${kind}-open-record`;

export const navigateToSavedDocument = <K extends SavedDocumentKind>(
  kind: K,
  record: RecordsByKind[K],
  mode: SavedDocumentMode,
) => {
  window.sessionStorage.setItem(pendingKey(kind), JSON.stringify({ record, mode }));
  window.location.hash = routes[kind];
};

const readPendingDocument = <K extends SavedDocumentKind>(kind: K) => {
  try {
    const raw = window.sessionStorage.getItem(pendingKey(kind));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Previous versions passed the record directly, always in view mode.
    const record = parsed?.record ?? parsed;
    if (
      !Number.isSafeInteger(record?.id) ||
      record.id <= 0 ||
      !Number.isSafeInteger(record.recipientId) ||
      record.recipientId <= 0 ||
      !record.values ||
      typeof record.values !== 'object' ||
      Array.isArray(record.values) ||
      ('kind' in record && record.kind !== kind)
    )
      return null;
    return {
      record: record as RecordsByKind[K],
      mode: parsed?.mode === 'edit' ? ('edit' as const) : ('view' as const),
    };
  } catch {
    return null;
  }
};

export const usePendingSavedDocument = <K extends SavedDocumentKind>(
  kind: K,
  onOpen: (record: RecordsByKind[K], mode: SavedDocumentMode) => void,
) => {
  const [pending] = useState(() => readPendingDocument(kind));
  const openRef = useRef(onOpen);
  openRef.current = onOpen;
  useEffect(() => {
    if (!pending) return;
    window.sessionStorage.removeItem(pendingKey(kind));
    openRef.current(pending.record, pending.mode);
  }, [kind, pending]);
};
