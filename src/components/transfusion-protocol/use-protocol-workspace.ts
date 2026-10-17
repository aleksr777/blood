import { useCallback, useEffect, useRef, useState } from 'react';
import {
  adoptCurrentRecipientFromValues,
  readCurrentRecipient,
  switchCurrentRecipient,
  syncCurrentRecipientProfile,
} from '../../storage/repositories/current-recipient';
import { clearProtocolDraft } from '../../storage/repositories/protocol-draft';
import {
  findProtocolRecordsByComponentUnitNumber,
  listProtocolRecords,
  saveProtocolRecord,
  type ProtocolRecord,
  type RecipientRecord,
} from '../../storage/repositories/recipients';
import { getCompatibilityDangerWarning } from './compatibility-validation';
import { getBloodGroupMismatch } from './blood-group-validation';
import {
  formatComponentUnitNumber,
  getComponentUnitDigits,
  getComponentUnitNumberWarning,
} from './component-unit-number';
import { hasHemaconData } from './donor-model';
import {
  getIndicationComponent,
  indicationValuesForComponent,
} from './indications-model';
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
  getNextPreviousTransfusionEligibilityTime,
} from './previous-transfusion-history';
import { currentRecipientValues } from './recipient-profile-values';
import { useProtocolDraft } from './use-protocol-draft';
import { formatDate, type ProtocolBlockId, type ProtocolValues } from './protocol-types';

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
  const [duplicateComponentUnitWarning, setDuplicateComponentUnitWarning] = useState({
    key: '',
    message: '',
  });
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);
  const [previousTransfusionSuggestion, setPreviousTransfusionSuggestion] = useState('');
  const previousBlankIndicationsRef = useRef<{
    component: string;
    values: ProtocolValues;
  } | null>(null);

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
    const digits = getComponentUnitDigits(values.componentUnitNumber);
    if (digits.length !== 14) {
      setDuplicateComponentUnitWarning({ key: '', message: '' });
      return undefined;
    }

    let active = true;

    void findProtocolRecordsByComponentUnitNumber(
      values.componentUnitNumber ?? '',
      recordId,
    )
      .then((matches) => {
        if (!active) return;

        if (matches.length === 0) {
          setDuplicateComponentUnitWarning({ key: '', message: '' });
          return;
        }

        const first = matches[0];
        const details = [
          first.recipientName,
          first.transfusionDate ? formatDate(first.transfusionDate) : '',
        ]
          .filter(Boolean)
          .join(', ');
        const additional =
          matches.length > 1 ? ` Найдено совпадений: ${matches.length}.` : '';

        setDuplicateComponentUnitWarning({
          key: `duplicate:${digits}:${matches.map(({ id }) => id).join(',')}`,
          message:
            `Номер гемакона ${formatComponentUnitNumber(digits)} уже используется в другом бланке` +
            `${details ? ` (${details})` : ''}.${additional} Проверьте правильность номера.`,
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setDuplicateComponentUnitWarning({ key: '', message: '' });
        console.error('Не удалось проверить номер гемакона на совпадения:', error);
      });

    return () => {
      active = false;
    };
  }, [recordId, values.componentUnitNumber]);

  useEffect(() => {
    const recipientId = Number(values.recipientId);
    if (!Number.isFinite(recipientId) || recipientId <= 0) {
      setPreviousTransfusionSuggestion('');
      return undefined;
    }

    const today = getLocalDateKey();
    if (
      recordId !== null &&
      values.transfusionDate &&
      values.transfusionDate !== today
    ) {
      setPreviousTransfusionSuggestion('');
      return undefined;
    }

    let active = true;
    let refreshTimer: number | null = null;

    void listProtocolRecords(recipientId)
      .then((records) => {
        if (!active) return;

        const previousRecords = recordId === null
          ? records
          : records.filter(({ id }) => id !== recordId);
        const now = new Date();

        setPreviousTransfusionSuggestion(
          buildPreviousTransfusionHistory(previousRecords, now),
        );

        const nextEligibleAt = getNextPreviousTransfusionEligibilityTime(
          previousRecords,
          now,
        );
        if (nextEligibleAt !== null) {
          const delay = Math.max(0, nextEligibleAt - Date.now() + 1000);
          refreshTimer = window.setTimeout(
            () => setHistoryRefreshToken((current) => current + 1),
            Math.min(delay, 2_147_483_647),
          );
        }
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
      if (refreshTimer !== null) {
        window.clearTimeout(refreshTimer);
      }
    };
  }, [
    historyRefreshToken,
    recordId,
    values.recipientId,
    values.transfusionDate,
  ]);

  const saveValues = (nextValues: ProtocolValues) => {
    draft.touch();
    if ('recipientId' in nextValues && nextValues.recipientId !== values.recipientId) {
      setRecordId(null);
    }

    const selectedComponent =
      nextValues.componentGroup || nextValues.indicationComponent || '';
    const carriedIndications = previousBlankIndicationsRef.current;
    const shouldCarryIndications =
      recordId === null &&
      Boolean(selectedComponent) &&
      carriedIndications?.component === selectedComponent;
    const appliedValues = shouldCarryIndications
      ? { ...carriedIndications.values, ...nextValues }
      : nextValues;

    if (shouldCarryIndications) {
      previousBlankIndicationsRef.current = null;
    }

    const merged = { ...values, ...appliedValues };
    if (recordId === null && hasReagentDefaultUpdate(appliedValues)) {
      saveReagentDefaults(merged);
    }
    setValues(merged);

    void syncCurrentRecipientProfile(appliedValues, {
      kind: 'protocol',
      values: merged,
      recordId,
    }).catch((error: unknown) =>
      console.error('Не удалось синхронизировать данные реципиента:', error),
    );
  };

  const selectRecipient = async (recipient: RecipientRecord) => {
    previousBlankIndicationsRef.current = null;
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
        setValues(
          recordId === null
            ? {
                ...result.protocolValues,
                ...reagentDefaultsForNewBlank(result.protocolValues),
              }
            : result.protocolValues,
        );
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
      const wasSavedRecord = recordId !== null;
      const record = await saveProtocolRecord(recordId, values);
      setRecordId(record.id);
      const savedValues = { ...values, recipientId: String(record.recipientId) };
      setValues(savedValues);
      if (!wasSavedRecord) {
        adoptCurrentRecipientFromValues(savedValues);
      }
      setStatus(afterPrint ? 'Бланк сохранён после печати.' : 'Бланк сохранён.');
      return true;
    } catch (error) {
      console.error('Не удалось сохранить бланк в базе:', error);
      setStatus('Не удалось сохранить бланк в базе.');
      return false;
    }
  };

  const newBlank = async () => {
    const openedFromDatabase = recordId !== null;
    let sourceValues = values;
    let previousBlankSaved = false;

    if (hasHemaconData(values)) {
      if (!values.recipientName?.trim()) {
        setStatus(
          'Новый бланк не создан: для сохранения предыдущего бланка укажите ФИО реципиента.',
        );
        setActiveBlock('general');
        return;
      }

      try {
        const record = await saveProtocolRecord(recordId, values);
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

    const previousComponent = openedFromDatabase
      ? ''
      : getIndicationComponent(sourceValues);
    previousBlankIndicationsRef.current = previousComponent
      ? {
          component: previousComponent,
          values: indicationValuesForComponent(sourceValues, previousComponent),
        }
      : null;

    const currentRecipient = readCurrentRecipient();
    const nextRecipientValues =
      openedFromDatabase && currentRecipient
        ? {
            ...currentRecipient.profile,
            recipientId: String(currentRecipient.id),
            recipientName: currentRecipient.fullName,
          }
        : currentRecipientValues(sourceValues);

    const nextValues = {
      ...nextRecipientValues,
      ...reagentDefaultsForNewBlank(openedFromDatabase ? {} : sourceValues),
      ...(openedFromDatabase
        ? {}
        : {
            doctorName: sourceValues.doctorName ?? '',
            nurseName: sourceValues.nurseName ?? '',
          }),
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
    previousBlankIndicationsRef.current = null;
    const currentRecipient = readCurrentRecipient();
    const nextValues = currentRecipient
      ? {
          ...currentRecipient.profile,
          recipientId: String(currentRecipient.id),
          recipientName: currentRecipient.fullName,
          ...reagentDefaultsForNewBlank(values),
        }
      : reagentDefaultsForNewBlank(values);

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
    previousBlankIndicationsRef.current = null;
    const switched = await selectRecipient(recipient);
    if (!switched) return;

    draft.touch();
    setComponentUnitNumberChecked(false);
    setDismissedComponentUnitWarningKey('');
    setActiveBlock(null);
    const generatedHistory = record.values.previousTransfusionsAutoText?.trim()
      ? {
          previousTransfusionsStatus: record.values.previousTransfusionsStatus ?? '',
          previousTransfusions: record.values.previousTransfusions ?? '',
          previousTransfusionsAutoText: record.values.previousTransfusionsAutoText,
        }
      : {};

    setRecordId(record.id);
    setValues({
      ...record.values,
      recipientId: String(record.recipientId),
      ...generatedHistory,
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
  const activeComponentUnitNumberWarning = duplicateComponentUnitWarning.key
    ? duplicateComponentUnitWarning
    : componentUnitNumberChecked && componentUnitNumberState.key
      ? componentUnitNumberState
      : { key: '', message: '' };

  useEffect(() => {
    if (!activeComponentUnitNumberWarning.key) {
      setDismissedComponentUnitWarningKey('');
    }
  }, [activeComponentUnitNumberWarning.key]);

  const componentUnitNumberWarning =
    activeComponentUnitNumberWarning.key &&
    activeComponentUnitNumberWarning.key !== dismissedComponentUnitWarningKey
      ? activeComponentUnitNumberWarning.message
      : '';

  const validateComponentUnitNumber = (nextValues: ProtocolValues = values) => {
    const nextWarning = getComponentUnitNumberWarning(nextValues);
    setComponentUnitNumberChecked(Boolean(nextWarning.key));
    if (!nextWarning.key && !duplicateComponentUnitWarning.key) {
      setDismissedComponentUnitWarningKey('');
    }
  };

  const dismissComponentUnitNumberWarning = () => {
    if (activeComponentUnitNumberWarning.key) {
      setDismissedComponentUnitWarningKey(activeComponentUnitNumberWarning.key);
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
