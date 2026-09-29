import { useCallback, useMemo, useRef, useState } from 'react';
import {
  findRecipient,
  type RecipientRecord,
} from '../../storage/repositories/recipients';
import type { ProtocolValues } from './protocol-types';

const normalizeName = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU');

export const getRecipientIdentityKey = (values: ProtocolValues) => {
  const name = normalizeName(values.recipientName ?? '');
  const birthDate = values.recipientBirthDate ?? '';
  return name && birthDate ? `${name}|${birthDate}` : '';
};

export const useRecipientMatch = (
  values: ProtocolValues,
  recordId: number | null,
  ignoredIdentityKey = '',
) => {
  const [match, setMatch] = useState<RecipientRecord | null>(null);
  const [resolvedKey, setResolvedKey] = useState('');
  const requestRef = useRef(0);
  const identityKey = useMemo(
    () => getRecipientIdentityKey(values),
    [values.recipientBirthDate, values.recipientName],
  );

  const identityKeyRef = useRef(identityKey);
  const recordIdRef = useRef(recordId);
  identityKeyRef.current = identityKey;
  recordIdRef.current = recordId;

  const check = useCallback(async () => {
    if (
      !identityKey ||
      recordId !== null ||
      identityKey === ignoredIdentityKey ||
      resolvedKey === identityKey
    ) {
      return;
    }

    const requestId = ++requestRef.current;
    try {
      const recipient = await findRecipient(
        values.recipientName ?? '',
        values.recipientBirthDate ?? '',
      );
      if (
        requestRef.current !== requestId ||
        identityKeyRef.current !== identityKey ||
        recordIdRef.current !== null
      ) {
        return;
      }
      setMatch(recipient);
      setResolvedKey(identityKey);
    } catch (error) {
      console.error('Не удалось проверить реципиента:', error);
      if (requestRef.current === requestId) setResolvedKey(identityKey);
    }
  }, [
    identityKey,
    ignoredIdentityKey,
    recordId,
    resolvedKey,
    values.recipientBirthDate,
    values.recipientName,
  ]);

  const resolved =
    !identityKey ||
    recordId !== null ||
    identityKey === ignoredIdentityKey ||
    resolvedKey === identityKey;

  return {
    identityKey,
    match,
    resolved,
    check,
    dismiss: () => setMatch(null),
  };
};
