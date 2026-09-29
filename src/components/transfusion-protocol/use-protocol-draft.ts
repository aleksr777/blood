import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import {
  clearProtocolDraft,
  loadProtocolDraft,
  saveProtocolDraft,
} from '../../storage/repositories/protocol-draft';
import type { ProtocolValues } from './protocol-types';

const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
const hasValues = (values: ProtocolValues) => Object.keys(values).length > 0;

type Props = {
  values: ProtocolValues;
  recordId: number | null;
  setValues: Dispatch<SetStateAction<ProtocolValues>>;
  setRecordId: Dispatch<SetStateAction<number | null>>;
  onExpire: () => void;
};

export const useProtocolDraft = ({
  values,
  recordId,
  setValues,
  setRecordId,
  onExpire,
}: Props) => {
  const [loaded, setLoaded] = useState(false);
  const [lastInputAt, setLastInputAt] = useState(0);

  const expire = useCallback(() => {
    setLastInputAt(0);
    setValues({});
    setRecordId(null);
    onExpire();
    void clearProtocolDraft().catch((error: unknown) =>
      console.error('Не удалось очистить просроченный черновик:', error),
    );
  }, [onExpire, setRecordId, setValues]);

  useEffect(() => {
    let active = true;
    void loadProtocolDraft()
      .then((draft) => {
        if (!active) return;
        if (draft.updatedAt && Date.now() - draft.updatedAt >= DRAFT_TTL_MS) {
          expire();
          return;
        }
        setValues(draft.values);
        setRecordId(draft.protocolRecordId);
        setLastInputAt(draft.updatedAt);
      })
      .catch((error: unknown) => console.error('Не удалось загрузить бланк:', error))
      .finally(() => active && setLoaded(true));

    return () => {
      active = false;
    };
  }, [expire, setRecordId, setValues]);

  useEffect(() => {
    if (!loaded || !hasValues(values) || !lastInputAt) return;
    void saveProtocolDraft({
      values,
      protocolRecordId: recordId,
      updatedAt: lastInputAt,
    }).catch((error: unknown) => console.error('Не удалось сохранить черновик:', error));
  }, [lastInputAt, loaded, recordId, values]);

  useEffect(() => {
    if (!loaded || !hasValues(values) || !lastInputAt) return;
    const remaining = DRAFT_TTL_MS - (Date.now() - lastInputAt);
    if (remaining <= 0) {
      expire();
      return;
    }
    const timer = window.setTimeout(expire, remaining);
    return () => window.clearTimeout(timer);
  }, [expire, lastInputAt, loaded, values]);

  return {
    touch: () => setLastInputAt(Date.now()),
    reset: () => setLastInputAt(0),
  };
};
