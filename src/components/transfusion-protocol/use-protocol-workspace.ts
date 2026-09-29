import { useState } from 'react';
import { clearProtocolDraft } from '../../storage/repositories/protocol-draft';
import type { ProtocolRecord, RecipientRecord } from '../../storage/repositories/recipients';
import { useProtocolAutosave } from './use-protocol-autosave';
import { useProtocolDraft } from './use-protocol-draft';
import { getRecipientIdentityKey, useRecipientMatch } from './use-recipient-match';
import type { ProtocolBlockId, ProtocolValues } from './protocol-types';

export const useProtocolWorkspace = () => {
  const [values, setValues] = useState<ProtocolValues>({});
  const [recordId, setRecordId] = useState<number | null>(null);
  const [documentKey, setDocumentKey] = useState(0);
  const [ignoredIdentityKey, setIgnoredIdentityKey] = useState('');
  const [activeBlock, setActiveBlock] = useState<ProtocolBlockId | null>(null);
  const [registryOpen, setRegistryOpen] = useState(false);
  const [status, setStatus] = useState('');
  const loaded = useProtocolDraft(values, recordId, setValues, setRecordId);
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

  const saveValues = (nextValues: ProtocolValues) => {
    if ('recipientName' in nextValues || 'recipientBirthDate' in nextValues) {
      setIgnoredIdentityKey('');
      recipientMatch.dismiss();
    }
    setValues((current) => ({ ...current, ...nextValues }));
  };

  const handleFieldBlur = (fieldName: string) => {
    if (fieldName === 'recipientName' || fieldName === 'recipientBirthDate') {
      void recipientMatch.check();
    }
  };

  const applyRecipientData = () => {
    const recipient = recipientMatch.match;
    if (!recipient) return;
    setIgnoredIdentityKey(recipientMatch.identityKey);
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
    setIgnoredIdentityKey(recipientMatch.identityKey);
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
    setIgnoredIdentityKey(getRecipientIdentityKey({
      recipientName: recipient.fullName,
      recipientBirthDate: recipient.birthDate,
    }));
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
    handleFieldBlur,
    applyRecipientData,
    dismissRecipientMatch,
    clearForm,
    openRecord,
    newForRecipient,
  };
};
