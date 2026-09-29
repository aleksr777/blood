import { useEffect, useMemo, useRef, useState } from 'react';
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

  useEffect(() => {
    if (!identityKey || recordId !== null || identityKey === ignoredIdentityKey) {
      setMatch(null);
      setResolvedKey(identityKey);
      return;
    }

    setResolvedKey('');
    const requestId = ++requestRef.current;
    const timer = window.setTimeout(() => {
      void findRecipient(values.recipientName ?? '', values.recipientBirthDate ?? '')
        .then((recipient) => {
          if (requestRef.current !== requestId) return;
          setMatch(recipient);
          setResolvedKey(identityKey);
        })
        .catch((error: unknown) => {
          console.error('Не удалось проверить реципиента:', error);
          if (requestRef.current === requestId) setResolvedKey(identityKey);
        });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [
    identityKey,
    ignoredIdentityKey,
    recordId,
    values.recipientBirthDate,
    values.recipientName,
  ]);

  return {
    match,
    resolved: !identityKey || resolvedKey === identityKey,
    dismiss: () => setMatch(null),
  };
};
