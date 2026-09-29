import { useEffect, useMemo, useRef, useState } from 'react';
import {
  searchRecipients,
  type RecipientRecord,
} from '../../storage/repositories/recipients';
import type { ProtocolValues } from './protocol-types';

const normalizeName = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU');

export const useRecipientMatch = (
  values: ProtocolValues,
  recordId: number | null,
) => {
  const [match, setMatch] = useState<RecipientRecord | null>(null);
  const [resolvedKey, setResolvedKey] = useState('');
  const requestRef = useRef(0);
  const identityKey = useMemo(() => {
    const name = normalizeName(values.recipientName ?? '');
    const birthDate = values.recipientBirthDate ?? '';
    return name && birthDate ? `${name}|${birthDate}` : '';
  }, [values.recipientBirthDate, values.recipientName]);

  useEffect(() => {
    if (!identityKey || recordId !== null) {
      setMatch(null);
      setResolvedKey(identityKey);
      return;
    }

    setResolvedKey('');
    const requestId = ++requestRef.current;
    const timer = window.setTimeout(() => {
      void searchRecipients(values.recipientName ?? '')
        .then((items) => {
          if (requestRef.current !== requestId) return;
          const exact = items.find(
            (item) =>
              normalizeName(item.fullName) === normalizeName(values.recipientName ?? '') &&
              item.birthDate === values.recipientBirthDate,
          );
          setMatch(exact ?? null);
          setResolvedKey(identityKey);
        })
        .catch((error: unknown) => {
          console.error('Не удалось проверить реципиента:', error);
          if (requestRef.current === requestId) setResolvedKey(identityKey);
        });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [identityKey, recordId, values.recipientBirthDate, values.recipientName]);

  const dismiss = () => setMatch(null);

  return {
    identityKey,
    match,
    resolved: !identityKey || resolvedKey === identityKey,
    dismiss,
  };
};
