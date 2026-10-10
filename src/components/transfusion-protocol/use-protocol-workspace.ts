import { useCallback, useEffect, useState } from 'react';
import { clearProtocolDraft } from '../../storage/repositories/protocol-draft';
import {
  saveProtocolRecord,
  type ProtocolRecord,
} from '../../storage/repositories/recipients';
import { useProtocolDraft } from './use-protocol-draft';
import type { ProtocolBlockId, ProtocolValues } from './protocol-types';

const OPEN_WINDOW_STORAGE_KEY = 'blood:protocol-open-window';

const PROTOCOL_BLOCK_IDS: ProtocolBlockId[] = [
  'general',
  'examination',
  'indications',
  'history',
  'donor',
  'selection',
  'compatibilityTests',
  'complications',
  'monitoring',
  'doctor',
];

type StoredOpenWindow =
  | { type: 'block'; blockId: ProtocolBlockId }
  | { type: 'registry' };

const readStoredOpenWindow = (): StoredOpenWindow | null => {
  try {
    const raw = window.sessionStorage.getItem(OPEN_WINDOW_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredOpenWindow>;
    if (
      parsed.type === 'block' &&
      typeof parsed.blockId === 'string' &&
      PROTOCOL_BLOCK_IDS.includes(parsed.blockId as ProtocolBlockId)
    ) {
      return { type: 'block', blockId: parsed.blockId as ProtocolBlockId };
    }

    if (parsed.type === 'registry') return { type: 'registry' };
  } catch (error) {
    console.error('Не удалось восстановить открытое окно:', error);
  }

  return null;
};

const getInitialActiveBlock = () => {
  const stored = readStoredOpenWindow();
  return stored?.type === 'block' ? stored.blockId : null;
};

const getInitialRegistryOpen = () => readStoredOpenWindow()?.type === 'registry';

export const useProtocolWorkspace = () => {
  const [values, setValues] = useState<ProtocolValues>({});
  const [recordId, setRecordId] = useState<number | null>(null);
  const [activeBlock, setActiveBlock] = useState<ProtocolBlockId | null>(getInitialActiveBlock);
  const [registryOpen, setRegistryOpen] = useState(getInitialRegistryOpen);
  const [status, setStatus] = useState('');

  useEffect(() => {
    try {
      if (activeBlock) {
        window.sessionStorage.setItem(
          OPEN_WINDOW_STORAGE_KEY,
          JSON.stringify({ type: 'block', blockId: activeBlock }),
        );
      } else if (registryOpen) {
        window.sessionStorage.setItem(
          OPEN_WINDOW_STORAGE_KEY,
          JSON.stringify({ type: 'registry' }),
        );
      } else {
        window.sessionStorage.removeItem(OPEN_WINDOW_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Не удалось сохранить состояние открытого окна:', error);
    }
  }, [activeBlock, registryOpen]);

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
