import { useCallback, useEffect, useState } from 'react';
import {
  adoptCurrentRecipientFromValues,
  readCurrentRecipient,
  recipientProfileValuesForForms,
  switchCurrentRecipient,
  syncCurrentRecipientProfile,
} from '../../storage/repositories/current-recipient';
import { clearProtocolDraft } from '../../storage/repositories/protocol-draft';
import {
  listProtocolRecords,
  saveProtocolRecord,
  type ProtocolRecord,
  type RecipientRecord,
} from '../../storage/repositories/recipients';
import { getCompatibilityDangerWarning } from './compatibility-validation';
import { getBloodGroupMismatch } from './blood-group-validation';
import { getComponentUnitNumberWarning } from './component-unit-number';
import {
  getExpiredReagentWarnings,
  getHemaconExpirationWarning,
  hasReagentDefaultUpdate,
  reagentDefaultsForNewBlank,
  saveReagentDefaults,
} from './reagent-defaults';
import {
  buildPreviousTransfusionHistory,
  getLocalDateKey,
} from './previous-transfusion-history';
import { currentRecipientValues } from './recipient-profile-values';
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
  const [dismissedBloodGroupWarningKey, setDismissedBloodGroupWarningKey] = useState('');
  const [componentUnitNumberChecked, setComponentUnitNumberChecked] = useState(false);
  const [dismissedComponentUnitWarningKey, setDismissedComponentUnitWarningKey] = useState('');
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);
  const [previousTransfusionSuggestion, setPreviousTransfusionSuggestion] = useState('');

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

  useEffect(() => {
    const recipientId = Number(values.recipientId);
    if (!Number.isFinite(recipientId) || recipientId <= 0) {
      setPreviousTransfusionSuggestion('');
      return undefined;
    }

    const today = getLocalDateKey();
    if (values.transfusionDate && values.transfusionDate !== today) {
      setPreviousTransfusionSuggestion('');
      return undefined;
    }

    let active = true;

    void listProtocolRecords(recipientId)
      .then((records) => {
        if (!active) return;
        setPreviousTransfusionSuggestion(
          buildPreviousTransfusionHistory(records, today),
        );
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPreviousTransfusionSuggestion('');
        console.error(
          'Не удалось сформировать предложение по предыдущим трансфузиям:',
          error,
        );
      });

    return () => {
      active = false;
    };
  }, [
    historyRefreshToken,
    values.recipientId,
    values.transfusionDate,
  ]);

  const saveValues = (nextValues: ProtocolValues) => {
    draft.touch();
    if ('recipientId' in nextValues && nextValues.recipientId !== values.recipientId) {
      setRecordId(null);
    }

    const merged = { ...values, ...nextValues };
    if (hasReagentDefaultUpdate(nextValues)) {
      saveReagentDefaults(merged);
    }
    setValues(merged);

    void syncCurrentRecipientProfile(nextValues, {
      kind: 'protocol',
      values: merged,
      recordId,
    }).catch((error: unknown) =>
      console.error('Не удалось синхронизировать данные реципиента:', error),
    );
  };

  const selectRecipient = async (recipient: RecipientRecord) => {
    try {
      const result = await switchCurrentRecipient(recipient, {
        kind: 'protocol',
        values,
        recordId,
      });

      draft.touch();
      setComponentUnitNumberChecked(false);
      setDismissedComponentUnitWarningKey('');

      if (result.changed) {
        setRecordId(null);
        setValues({
          ...result.protocolValues,
          ...reagentDefaultsForNewBlank(values),
        });
        setStatus(
          result.protocolSaved || result.registrationSaved
            ? 'Бланки предыдущего реципиента автоматически сохранены. Выбран новый реципиент.'
            : 'Выбран новый реципиент.',
        );
      } else {
        setValues(result.protocolValues);
        setStatus(`Текущий реципиент: ${recipient.fullName}.`);
      }

      return true;
    } catch (error) {
      console.error('Не удалось сменить текущего реципиента:', error);
      setStatus(
        error instanceof Error
          ? error.message
          : 'Не удалось сменить текущего реципиента.',
      );
      return false;
    }
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
      const savedValues = { ...values, recipientId: String(record.recipientId) };
      setValues(savedValues);
      adoptCurrentRecipientFromValues(savedValues);
      setStatus(afterPrint ? 'Бланк сохранён после печати.' : 'Бланк сохранён.');
      return true;
    } catch (error) {
      console.error('Не удалось сохранить бланк в базе:', error);
      setStatus('Не удалось сохранить бланк в базе.');
      return false;
    }
  };

  const newBlank = async () => {
    let sourceValues = values;
    let previousBlankSaved = false;

    if (recordId === null && values.recipientName?.trim()) {
      try {
        const record = await saveProtocolRecord(null, values);
        sourceValues = {
          ...values,
          recipientId: String(record.recipientId),
        };
        previousBlankSaved = true;
      } catch (error) {
        console.error('Не удалось автоматически сохранить предыдущий бланк:', error);
        setStatus(
          'Новый бланк не создан: не удалось автоматически сохранить предыдущий бланк.',
        );
        return;
      }
    }

    const nextValues = {
      ...currentRecipientValues(sourceValues),
      ...reagentDefaultsForNewBlank(sourceValues),
    };

    draft.touch();
    setActiveBlock(null);
    setRegistryOpen(false);
    setRecordId(null);
    setValues(nextValues);
    setPreviousTransfusionSuggestion('');
    setHistoryRefreshToken((current) => current + 1);
    setComponentUnitNumberChecked(false);
    setDismissedComponentUnitWarningKey('');

    if (sourceValues.recipientName?.trim()) {
      setStatus(
        previousBlankSaved
          ? 'Предыдущий бланк автоматически сохранён. Создан новый бланк для текущего реципиента.'
          : 'Создан новый бланк для текущего реципиента.',
      );
    } else {
      setStatus('Создан новый бланк.');
    }
  };

  const clearForm = () => {
    const currentRecipient = readCurrentRecipient();
    const nextValues = currentRecipient
      ? {
          ...currentRecipient.profile,
          recipientId: String(currentRecipient.id),
          recipientName: currentRecipient.fullName,
          ...reagentDefaultsForNewBlank(values),
        }
      : {};

    draft.reset();
    setComponentUnitNumberChecked(false);
    setDismissedComponentUnitWarningKey('');
    setActiveBlock(null);
    setRecordId(null);
    setStatus('');
    setValues(nextValues);
    setPreviousTransfusionSuggestion('');
    setHistoryRefreshToken((current) => current + 1);

    void clearProtocolDraft()
      .then(() => {
        if (currentRecipient) draft.touch();
      })
      .catch((error: unknown) =>
        console.error('Не удалось очистить сохранённый бланк:', error),
      );
  };

  const openRecord = async (record: ProtocolRecord, recipient: RecipientRecord) => {
    const switched = await selectRecipient(recipient);
    if (!switched) return;

    draft.touch();
    setComponentUnitNumberChecked(false);
    setDismissedComponentUnitWarningKey('');
    setActiveBlock(null);
    setRecordId(record.id);
    setValues({
      ...record.values,
      ...recipientProfileValuesForForms(recipient),
    });
    setRegistryOpen(false);
    setStatus('Сохранённый бланк открыт для просмотра и редактирования.');
  };

  const bloodGroupMismatch = getBloodGroupMismatch(values);

  useEffect(() => {
    if (!bloodGroupMismatch.key) {
      setDismissedBloodGroupWarningKey('');
    }
  }, [bloodGroupMismatch.key]);

  const bloodGroupWarning =
    bloodGroupMismatch.key && bloodGroupMismatch.key !== dismissedBloodGroupWarningKey
      ? bloodGroupMismatch.message
      : '';

  const dismissBloodGroupWarning = () => {
    if (bloodGroupMismatch.key) {
      setDismissedBloodGroupWarningKey(bloodGroupMismatch.key);
    }
  };

  const componentUnitNumberState = getComponentUnitNumberWarning(values);

  useEffect(() => {
    if (!componentUnitNumberState.key) {
      setDismissedComponentUnitWarningKey('');
    }
  }, [componentUnitNumberState.key]);

  const componentUnitNumberWarning =
    componentUnitNumberChecked &&
    componentUnitNumberState.key &&
    componentUnitNumberState.key !== dismissedComponentUnitWarningKey
      ? componentUnitNumberState.message
      : '';

  const validateComponentUnitNumber = (nextValues: ProtocolValues = values) => {
    const nextWarning = getComponentUnitNumberWarning(nextValues);
    setComponentUnitNumberChecked(Boolean(nextWarning.key));
    if (!nextWarning.key) {
      setDismissedComponentUnitWarningKey('');
    }
  };

  const dismissComponentUnitNumberWarning = () => {
    if (componentUnitNumberState.key) {
      setDismissedComponentUnitWarningKey(componentUnitNumberState.key);
    }
  };

  const expiredReagents = getExpiredReagentWarnings(values);
  const hemaconExpirationWarning = getHemaconExpirationWarning(values.expirationDate);
  const expirationWarnings = [
    hemaconExpirationWarning,
    ...expiredReagents,
  ].filter(Boolean);
  const reagentWarning = expirationWarnings.length
    ? `Внимание: ${expirationWarnings.join('; ')}.`
    : '';
  const compatibilityWarning = getCompatibilityDangerWarning(values);

  return {
    values,
    recordId,
    activeBlock,
    registryOpen,
    status,
    previousTransfusionSuggestion,
    setActiveBlock,
    setRegistryOpen,
    saveValues,
    selectRecipient,
    saveToDatabase,
    newBlank,
    reagentWarning,
    compatibilityWarning,
    bloodGroupWarning,
    dismissBloodGroupWarning,
    componentUnitNumberWarning,
    validateComponentUnitNumber,
    dismissComponentUnitNumberWarning,
    clearForm,
    openRecord,
  };
};
