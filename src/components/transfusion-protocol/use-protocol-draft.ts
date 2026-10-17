import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import {
  adoptCurrentRecipientFromValues,
  readCurrentRecipient,
  recipientProfileValuesForForms,
} from '../../storage/repositories/current-recipient';
import {
  clearProtocolDraft,
  loadProtocolDraft,
  saveProtocolDraft,
} from '../../storage/repositories/protocol-draft';
import { reagentDefaultsForNewBlank } from './reagent-defaults';
import type { ProtocolValues } from './protocol-types';

const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
const hasValues = (values: ProtocolValues) => Object.keys(values).length > 0;

const generatedHistoryValues = (values: ProtocolValues): ProtocolValues =>
  values.previousTransfusionsAutoText?.trim()
    ? {
        previousTransfusionsStatus: values.previousTransfusionsStatus ?? '',
        previousTransfusions: values.previousTransfusions ?? '',
        previousTransfusionsAutoText: values.previousTransfusionsAutoText,
      }
    : {};

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
        if (Object.keys(draft.values).length > 0) {
          const draftValues =
            draft.protocolRecordId === null
              ? {
                  ...draft.values,
                  ...reagentDefaultsForNewBlank(draft.values),
                }
              : draft.values;
          const currentRecipient = readCurrentRecipient();
          if (draft.protocolRecordId !== null) {
            setValues(draftValues);
          } else if (!currentRecipient) {
            adoptCurrentRecipientFromValues(draftValues);
            setValues(draftValues);
          } else if (Number(draftValues.recipientId) === currentRecipient.id) {
            setValues({
              ...draftValues,
              ...recipientProfileValuesForForms(currentRecipient),
              ...generatedHistoryValues(draftValues),
            });
          } else {
            setValues(draftValues);
          }
          setRecordId(draft.protocolRecordId);
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
