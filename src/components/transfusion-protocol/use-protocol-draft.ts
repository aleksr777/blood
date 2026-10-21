import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import {
  adoptCurrentRecipientFromValues,
  hasRecipientProfileDifference,
  mergeRecipientProfileValues,
  readCurrentRecipient,
  recipientProfileValuesForForms,
} from '../../storage/repositories/current-recipient';
import {
  hasStoredCurrentIndications,
  readCurrentIndications,
  writeCurrentIndications,
} from '../../storage/repositories/current-indications';
import {
  clearProtocolDraft,
  loadProtocolDraft,
  saveProtocolDraft,
} from '../../storage/repositories/protocol-draft';
import { clearRecipientLinkedValues } from '../../storage/repositories/recipient-linked-values';
import { getIndicationComponent } from './indications-model';
import { reagentDefaultsForNewBlank } from './reagent-defaults';
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

export const useProtocolDraft = ({ values, recordId, setValues, setRecordId, onExpire }: Props) => {
  const [loaded, setLoaded] = useState(false);
  const [lastInputAt, setLastInputAt] = useState(0);

  const expire = useCallback(() => {
    setLastInputAt(0);
    const currentRecipient = readCurrentRecipient();
    setValues(currentRecipient ? recipientProfileValuesForForms(currentRecipient) : {});
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
        if (Object.keys(draft.values).length > 0) {
          const draftValues =
            draft.protocolRecordId === null
              ? {
                  ...draft.values,
                  ...reagentDefaultsForNewBlank(draft.values),
                }
              : draft.values;
          const currentRecipient = readCurrentRecipient();
          if (!currentRecipient) {
            if (draft.protocolRecordId === null) {
              adoptCurrentRecipientFromValues(draftValues);
            }
            setValues(draftValues);
            setRecordId(draft.protocolRecordId);
          } else {
            const previousRecipientId = Number(draftValues.recipientId);
            const recipientChanged =
              Number.isFinite(previousRecipientId) &&
              previousRecipientId > 0 &&
              previousRecipientId !== currentRecipient.id;
            const baseValues = recipientChanged
              ? clearRecipientLinkedValues(draftValues, previousRecipientId)
              : draftValues;
            const profileChanged =
              recipientChanged || hasRecipientProfileDifference(draftValues, currentRecipient);
            const mergedValues = mergeRecipientProfileValues(baseValues, currentRecipient);
            const component = getIndicationComponent(mergedValues);

            if (component) {
              if (hasStoredCurrentIndications(currentRecipient.id, component)) {
                Object.assign(mergedValues, readCurrentIndications(currentRecipient.id, component));
              } else if (draft.protocolRecordId === null && !recipientChanged) {
                writeCurrentIndications(currentRecipient.id, component, mergedValues);
              }
            }

            setValues(mergedValues);
            const indicationsChanged = Object.entries(mergedValues).some(
              ([field, value]) => (draftValues[field] ?? '') !== value,
            );
            setRecordId(
              (profileChanged || indicationsChanged) && draft.protocolRecordId !== null
                ? null
                : draft.protocolRecordId,
            );
          }
          setLastInputAt(draft.updatedAt);
          return;
        }

        const currentRecipient = readCurrentRecipient();
        if (currentRecipient) {
          setValues({
            ...recipientProfileValuesForForms(currentRecipient),
            ...reagentDefaultsForNewBlank({}),
          });
          setRecordId(null);
          setLastInputAt(Date.now());
          return;
        }

        const reagentDefaults = reagentDefaultsForNewBlank({});
        setValues(reagentDefaults);
        setRecordId(null);
        setLastInputAt(
          Object.values(reagentDefaults).some((value) => value.trim()) ? Date.now() : 0,
        );
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
