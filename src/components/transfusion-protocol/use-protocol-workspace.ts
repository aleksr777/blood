import { useEffect, useState } from 'react';
import {
  clearProtocolDraft,
  loadProtocolDraft,
  saveProtocolDraft,
} from '../../storage/repositories/protocol-draft';
import type {
  ProtocolRecord,
  RecipientRecord,
} from '../../storage/repositories/recipients';
import { useProtocolAutosave } from './use-protocol-autosave';
import {
  getRecipientIdentityKey,
  useRecipientMatch,
} from './use-recipient-match';
import type { ProtocolBlockId, ProtocolValues } from './protocol-types';

export const useProtocolWorkspace = () => {
  const [values, setValues] = useState<ProtocolValues>({});
  const [recordId, setRecordId] = useState<number | null>(null);
  const [documentKey, setDocumentKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [ignoredIdentityKey, setIgnoredIdentityKey] = useState('');
  const [activeBlock, setActiveBlock] = useState<ProtocolBlockId | null>(null);
  const [registryOpen, setRegistryOpen] = useState(false);
  const [status, setStatus] = useState('');
  const recipientMatch = useRecipientMatch(values, recordId, ignoredIdentityKey);

  useProtocolAutosave({
    loaded,
    values,
    recordId,
    documentKey,
    identityResolved: recipientMatch.resolved && recipientMatch.match === null,
    setRecordId,
    setStatus,
  });

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
  }, []);

  useEffect(() => {
    if (!loaded) return;
    void saveProtocolDraft({ values, protocolRecordId: recordId }).catch((error: unknown) =>
      console.error('Не удалось сохранить бланк:', error),
    );
  }, [loaded, recordId, values]);

  const saveValues = (nextValues: ProtocolValues) => {
    if ('recipientName' in nextValues || 'recipientBirthDate' in nextValues) {
      setIgnoredIdentityKey('');
    }
    setValues((current) => ({ ...current, ...nextValues }));
  };

  const applyRecipientData = () => {
    const recipient = recipientMatch.match;
    if (!recipient) return;

    setValues((current) => ({
      ...current,
      ...recipient.profile,
      recipientName: recipient.fullName,
      recipientBirthDate: recipient.birthDate,
    }));
    recipientMatch.dismiss();
    setStatus('Данные реципиента подставлены в бланк.');
  };

  const dismissRecipientMatch = () => {
    recipientMatch.dismiss();
    setStatus('Найденный профиль не был подставлен.');
  };

  const clearForm = () => {
    setIgnoredIdentityKey('');
    setDocumentKey((current) => current + 1);
    setActiveBlock(null);
    setRecordId(null);
    setStatus('');
    setValues({});
    void clearProtocolDraft().catch((error: unknown) =>
      console.error('Не удалось очистить сохранённый бланк:', error),
    );
  };

  const openRecord = (record: ProtocolRecord) => {
    setIgnoredIdentityKey('');
    setDocumentKey((current) => current + 1);
    setActiveBlock(null);
    setRecordId(record.id);
    setValues(record.values);
    setRegistryOpen(false);
    setStatus('Сохранённый бланк открыт для просмотра и редактирования.');
  };

  const newForRecipient = (recipient: RecipientRecord) => {
    setIgnoredIdentityKey(
      getRecipientIdentityKey({
        recipientName: recipient.fullName,
        recipientBirthDate: recipient.birthDate,
      }),
    );
    setDocumentKey((current) => current + 1);
    setActiveBlock(null);
    setRecordId(null);
    setValues({
      ...recipient.profile,
      recipientName: recipient.fullName,
      recipientBirthDate: recipient.birthDate,
    });
    setRegistryOpen(false);
    setStatus('Создан новый бланк с данными реципиента.');
  };

  return {
    values,
    recordId,
    activeBlock,
    registryOpen,
    status,
    recipientMatch: recipientMatch.match,
    setActiveBlock,
    setRegistryOpen,
    saveValues,
    applyRecipientData,
    dismissRecipientMatch,
    clearForm,
    openRecord,
    newForRecipient,
  };
};
