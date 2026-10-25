import { useEffect, useState } from 'react';
import { listProtocolRecords } from '../../storage/repositories/recipients';
import { normalizeComponentUnitNumber } from '../../domain/protocol-hemacon';
import {
  buildPreviousTransfusionHistory,
  getLocalDateKey,
  getNextPreviousTransfusionEligibilityTime,
} from './previous-transfusion-history';

type Options = {
  recipientId?: string;
  savedDocument: boolean;
  recordId?: number | null;
  transfusionDate?: string;
  componentUnitNumber?: string;
  refreshVersion?: number;
};

export const usePreviousTransfusionSuggestion = ({
  recipientId,
  savedDocument,
  recordId = null,
  transfusionDate,
  componentUnitNumber,
  refreshVersion = 0,
}: Options) => {
  const [refreshToken, setRefreshToken] = useState(0);
  const [result, setResult] = useState({ key: '', text: '' });
  const key = JSON.stringify([
    recipientId,
    savedDocument,
    recordId,
    transfusionDate,
    componentUnitNumber,
    refreshVersion,
  ]);
  const id = Number(recipientId);
  const available =
    !savedDocument &&
    Number.isFinite(id) &&
    id > 0 &&
    (recordId === null || !transfusionDate || transfusionDate === getLocalDateKey());

  useEffect(() => {
    if (!available) return;

    let active = true;
    let timer: number | undefined;
    void listProtocolRecords(id)
      .then((records) => {
        if (!active) return;
        const number = normalizeComponentUnitNumber(componentUnitNumber);
        const previous = records.filter(
          (record) =>
            record.id !== recordId &&
            (!number || normalizeComponentUnitNumber(record.values.componentUnitNumber) !== number),
        );
        const now = new Date();
        setResult({ key, text: buildPreviousTransfusionHistory(previous, now) });
        const eligibleAt = getNextPreviousTransfusionEligibilityTime(previous, now);
        if (eligibleAt !== null) {
          timer = window.setTimeout(
            () => setRefreshToken((value) => value + 1),
            Math.min(Math.max(0, eligibleAt - Date.now() + 1000), 2_147_483_647),
          );
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setResult({ key, text: '' });
        console.error('Не удалось сформировать предложение по предыдущим трансфузиям:', error);
      });
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [available, id, recordId, componentUnitNumber, key, refreshToken]);

  return available && result.key === key ? result.text : '';
};
