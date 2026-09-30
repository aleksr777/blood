import { useCallback, useState } from 'react';
import { clearProtocolDraft } from '../../storage/repositories/protocol-draft';
import {
  saveProtocolRecord,
  type ProtocolRecord,
} from '../../storage/repositories/recipients';
import { useProtocolDraft } from './use-protocol-draft';
import type { ProtocolBlockId, ProtocolValues } from './protocol-types';

export const useProtocolWorkspace = () => {
  const [values, setValues] = useState<ProtocolValues>({});
  const [recordId, setRecordId] = useState<number | null>(null);
  const [activeBlock, setActiveBlock] = useState<ProtocolBlockId | null>(null);
  const [registryOpen, setRegistryOpen] = useState(false);
  const [status, setStatus] = useState('');

  const handleDraftExpire = useCallback(() => {
    setActiveBlock(null);
    setStatus('Бланк автоматически очищен: с последнего изменения прошло 24 часа.');
  }, []);

  const draft = useProtocolDraft({
    values,
    recordId,
    setValues,
    setRecordId,
    onExpire: handleDraftExpire,
  });

  const saveValues = (nextValues: ProtocolValues) => {
    draft.touch();
    if ('recipientId' in nextValues && nextValues.recipientId !== values.recipientId) {
      setRecordId(null);
    }
    setValues((current) => ({ ...current, ...nextValues }));
  };

  const saveToDatabase = async (afterPrint = false) => {
    if (!values.recipientName?.trim()) {
      setStatus('Для сохранения укажите ФИО реципиента.');
      if (!afterPrint) setActiveBlock('general');
      return false;
    }

    try {
      const record = await saveProtocolRecord(recordId, values);
      setRecordId(record.id);
      setValues((current) => ({ ...current, recipientId: String(record.recipientId) }));
      setStatus(afterPrint ? 'Бланк сохранён после печати.' : 'Бланк сохранён.');
      return true;
    } catch (error) {
      console.error('Не удалось сохранить бланк в базе:', error);
      setStatus('Не удалось сохранить бланк в базе.');
      return false;
    }
  };

  const clearForm = () => {
    draft.reset();
    setActiveBlock(null);
    setRecordId(null);
    setStatus('');
    setValues({});
    void clearProtocolDraft().catch((error: unknown) =>
      console.error('Не удалось очистить сохранённый бланк:', error),
    );
  };

  const openRecord = (record: ProtocolRecord) => {
    draft.touch();
    setActiveBlock(null);
    setRecordId(record.id);
    setValues({ ...record.values, recipientId: String(record.recipientId) });
    setRegistryOpen(false);
    setStatus('Сохранённый бланк открыт для просмотра и редактирования.');
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
    saveToDatabase,
    clearForm,
    openRecord,
  };
};
