import { useEffect, useState } from 'react';
import {
  clearProtocolDraft,
  loadProtocolDraft,
  saveProtocolDraft,
} from '../../storage/repositories/protocol-draft';
import {
  saveProtocolRecord,
  type ProtocolRecord,
  type RecipientRecord,
} from '../../storage/repositories/recipients';
import type { ProtocolBlockId, ProtocolValues } from './protocol-types';

export const useProtocolWorkspace = () => {
  const [values, setValues] = useState<ProtocolValues>({});
  const [recordId, setRecordId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeBlock, setActiveBlock] = useState<ProtocolBlockId | null>(null);
  const [registryOpen, setRegistryOpen] = useState(false);
  const [status, setStatus] = useState('');

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

  const saveValues = (nextValues: ProtocolValues) =>
    setValues((current) => ({ ...current, ...nextValues }));

  const clearForm = () => {
    setActiveBlock(null);
    setRecordId(null);
    setStatus('');
    setValues({});
    void clearProtocolDraft().catch((error: unknown) =>
      console.error('Не удалось очистить сохранённый бланк:', error),
    );
  };

  const saveToDatabase = async () => {
    if (!values.recipientName?.trim() || !values.recipientBirthDate) {
      setStatus('Укажите ФИО и дату рождения реципиента.');
      setActiveBlock('general');
      return;
    }

    try {
      const record = await saveProtocolRecord(recordId, values);
      setRecordId(record.id);
      setStatus(recordId ? 'Изменения сохранены.' : 'Реципиент и бланк сохранены в базе.');
    } catch (error) {
      console.error('Не удалось сохранить бланк в базе:', error);
      setStatus('Не удалось сохранить бланк в базе.');
    }
  };

  const openRecord = (record: ProtocolRecord) => {
    setActiveBlock(null);
    setRecordId(record.id);
    setValues(record.values);
    setRegistryOpen(false);
    setStatus('Сохранённый бланк открыт для просмотра и редактирования.');
  };

  const newForRecipient = (recipient: RecipientRecord) => {
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
    setActiveBlock,
    setRegistryOpen,
    saveValues,
    clearForm,
    saveToDatabase,
    openRecord,
    newForRecipient,
  };
};
