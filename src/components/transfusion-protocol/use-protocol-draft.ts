import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import {
  loadProtocolDraft,
  saveProtocolDraft,
} from '../../storage/repositories/protocol-draft';
import type { ProtocolValues } from './protocol-types';

export const useProtocolDraft = (
  values: ProtocolValues,
  recordId: number | null,
  setValues: Dispatch<SetStateAction<ProtocolValues>>,
  setRecordId: Dispatch<SetStateAction<number | null>>,
) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void loadProtocolDraft()
      .then((draft) => {
        if (!active) return;
        setValues(draft.values);
        setRecordId(draft.protocolRecordId);
      })
      .catch((error: unknown) => console.error('Не удалось загрузить бланк:', error))
      .finally(() => active && setLoaded(true));

    return () => {
      active = false;
    };
  }, [setRecordId, setValues]);

  useEffect(() => {
    if (!loaded) return;
    void saveProtocolDraft({ values, protocolRecordId: recordId }).catch((error: unknown) =>
      console.error('Не удалось сохранить бланк:', error),
    );
  }, [loaded, recordId, values]);

  return loaded;
};
