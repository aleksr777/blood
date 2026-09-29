import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { saveProtocolRecord } from '../../storage/repositories/recipients';
import type { ProtocolValues } from './protocol-types';

type Props = {
  loaded: boolean;
  values: ProtocolValues;
  recordId: number | null;
  documentKey: number;
  identityResolved: boolean;
  setRecordId: Dispatch<SetStateAction<number | null>>;
  setStatus: Dispatch<SetStateAction<string>>;
};

export const useProtocolAutosave = ({
  loaded,
  values,
  recordId,
  documentKey,
  identityResolved,
  setRecordId,
  setStatus,
}: Props) => {
  const recordIdRef = useRef(recordId);
  const documentKeyRef = useRef(documentKey);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    recordIdRef.current = recordId;
  }, [recordId]);

  useEffect(() => {
    documentKeyRef.current = documentKey;
  }, [documentKey]);

  useEffect(() => {
    if (
      !loaded ||
      !identityResolved ||
      !values.recipientName?.trim() ||
      !values.recipientBirthDate
    ) {
      return;
    }
    const snapshot = { ...values };
    const scheduledKey = documentKey;

    queueRef.current = queueRef.current
      .catch(() => undefined)
      .then(async () => {
        if (documentKeyRef.current !== scheduledKey) return;
        const currentId = recordIdRef.current;
        const record = await saveProtocolRecord(currentId, snapshot);

        if (
          documentKeyRef.current === scheduledKey &&
          currentId === null &&
          recordIdRef.current === null
        ) {
          recordIdRef.current = record.id;
          setRecordId(record.id);
        }
      })
      .catch((error: unknown) => {
        console.error('Не удалось автоматически сохранить бланк:', error);
        if (documentKeyRef.current === scheduledKey) {
          setStatus('Ошибка автоматического сохранения.');
        }
      });
  }, [documentKey, identityResolved, loaded, setRecordId, setStatus, values]);
};
