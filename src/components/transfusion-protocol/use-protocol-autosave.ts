import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { saveProtocolRecord } from '../../storage/repositories/recipients';
import type { ProtocolValues } from './protocol-types';

type Props = {
  loaded: boolean;
  values: ProtocolValues;
  recordId: number | null;
  setRecordId: Dispatch<SetStateAction<number | null>>;
  setStatus: Dispatch<SetStateAction<string>>;
};

export const useProtocolAutosave = ({
  loaded,
  values,
  recordId,
  setRecordId,
  setStatus,
}: Props) => {
  const recordIdRef = useRef(recordId);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    recordIdRef.current = recordId;
  }, [recordId]);

  useEffect(() => {
    if (!loaded || !values.recipientName?.trim() || !values.recipientBirthDate) return;
    const snapshot = { ...values };

    queueRef.current = queueRef.current
      .catch(() => undefined)
      .then(async () => {
        const currentId = recordIdRef.current;
        const record = await saveProtocolRecord(currentId, snapshot);

        if (currentId === null && recordIdRef.current === null) {
          recordIdRef.current = record.id;
          setRecordId(record.id);
        }
      })
      .catch((error: unknown) => {
        console.error('Не удалось автоматически сохранить бланк:', error);
        setStatus('Ошибка автоматического сохранения.');
      });
  }, [loaded, setRecordId, setStatus, values]);
};
