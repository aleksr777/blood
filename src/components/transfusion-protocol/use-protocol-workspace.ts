import { useCallback, useEffect, useState } from 'react';
import {
  adoptCurrentRecipientFromValues,
  readCurrentRecipient,
  switchCurrentRecipient,
  syncCurrentRecipientProfile,
} from '../../storage/repositories/current-recipient';
import {
  readCurrentIndications,
  writeCurrentIndications,
} from '../../storage/repositories/current-indications';
import { clearProtocolDraft } from '../../storage/repositories/protocol-draft';
import { clearRecipientLinkedValues } from '../../storage/repositories/recipient-linked-values';
import {
  saveProtocolRecord,
  updateProtocolRecord,
  type ProtocolRecord,
  type RecipientRecord,
} from '../../storage/repositories/recipients';
import { getCompatibilityDangerWarning } from './compatibility-validation';
import { getBloodGroupMismatch } from './blood-group-validation';
import { getComponentUnitNumberWarning } from './component-unit-number';
import { getProtocolHemaconWarning } from '../../domain/protocol-hemacon';
import { getHemaconDateOrderWarning } from '../../domain/hemacon-dates';
import { getIndicationComponent } from './indications-model';
import {
  getExpiredReagentWarnings,
  getHemaconExpirationWarning,
  hasReagentDefaultUpdate,
  reagentDefaultsForNewBlank,
  saveReagentDefaults,
} from './reagent-defaults';
import { usePreviousTransfusionSuggestion } from './use-previous-transfusion-suggestion';
import { useProtocolDraft } from './use-protocol-draft';
import type { ProtocolBlockId, ProtocolValues } from './protocol-types';
import { useDocumentState, type SavedDocumentMode } from '../saved-document/use-document-state';
import { usePendingSavedDocument } from '../saved-document/saved-document-navigation';
import { cleanProtocolDraft } from '../saved-document/working-form-cleanup';
import { hasDocumentContent } from '../../domain/document-content';

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

type StoredOpenWindow = { type: 'block'; blockId: ProtocolBlockId } | { type: 'registry' };

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
  const document = useDocumentState<ProtocolValues>(() => ({}), cleanProtocolDraft);
  const { values, setValues, open: openSavedDocument, isActive: hasSavedDocument } = document;
  const hasContent = hasDocumentContent('protocol', values);
  const [workingRecordId, setRecordId] = useState<number | null>(null);
  const recordId = document.record?.id ?? workingRecordId;
  const [activeBlock, setActiveBlock] = useState<ProtocolBlockId | null>(getInitialActiveBlock);
  const [registryOpen, setRegistryOpen] = useState(getInitialRegistryOpen);
  const [status, setStatus] = useState('');
  const [dismissedBloodGroupWarningKey, setDismissedBloodGroupWarningKey] = useState('');
  const [componentUnitNumberChecked, setComponentUnitNumberChecked] = useState(false);
  const [dismissedComponentUnitWarningKey, setDismissedComponentUnitWarningKey] = useState('');
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);
  const previousTransfusionSuggestion = usePreviousTransfusionSuggestion({
    recipientId: values.recipientId,
    savedDocument: document.active,
    recordId,
    transfusionDate: values.transfusionDate,
    componentUnitNumber: values.componentUnitNumber,
    refreshVersion: historyRefreshToken,
  });

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

  const openSavedDraft = useCallback(
    (id: number, savedValues: ProtocolValues) => {
      if (hasSavedDocument()) return;
      openSavedDocument({ id, recipientId: Number(savedValues.recipientId) }, savedValues);
      setActiveBlock(null);
    },
    [openSavedDocument, hasSavedDocument],
  );

  const draft = useProtocolDraft({
    values: document.workingValues,
    recordId: workingRecordId,
    setValues: document.setWorkingValues,
    setRecordId,
    onSavedDraft: openSavedDraft,
  });

  usePendingSavedDocument('protocol', (record, mode) => {
    void openRecord(record, mode);
  });

  const saveValues = (nextValues: ProtocolValues) => {
    if (document.isActive()) {
      setValues((current) => ({ ...current, ...nextValues }));
      return;
    }
    if (!Object.entries(nextValues).some(([key, value]) => (values[key] ?? '') !== value)) return;
    draft.touch();

    const editingSavedRecord = recordId !== null;
    if (editingSavedRecord) {
      setRecordId(null);
    }

    const selectedComponent = nextValues.componentGroup || nextValues.indicationComponent || '';
    const currentComponent = getIndicationComponent(values);
    const currentRecipient = readCurrentRecipient();
    const componentChanged = Boolean(selectedComponent) && selectedComponent !== currentComponent;
    const sharedIndications =
      componentChanged && currentRecipient && Number(values.recipientId) === currentRecipient.id
        ? readCurrentIndications(currentRecipient.id, selectedComponent)
        : {};
    const appliedValues = {
      ...sharedIndications,
      ...nextValues,
    };

    const merged = { ...values, ...appliedValues };
    if (hasReagentDefaultUpdate(appliedValues)) {
      saveReagentDefaults(merged);
    }
    setValues((current) => ({ ...current, ...appliedValues }));

    const activeComponent = getIndicationComponent(merged);
    if (activeComponent && currentRecipient && Number(merged.recipientId) === currentRecipient.id) {
      writeCurrentIndications(currentRecipient.id, activeComponent, merged);
    }

    void syncCurrentRecipientProfile(appliedValues, {
      kind: 'protocol',
      values: merged,
      recordId: editingSavedRecord ? null : recordId,
    }).catch((error: unknown) =>
      console.error('Не удалось синхронизировать данные реципиента:', error),
    );
  };

  const selectRecipient = async (recipient: RecipientRecord) => {
    try {
      document.close();
      const result = await switchCurrentRecipient(recipient, {
        kind: 'protocol',
        values: document.workingValues,
        recordId: workingRecordId,
      });

      draft.touch();
      setComponentUnitNumberChecked(false);
      setDismissedComponentUnitWarningKey('');

      setRecordId(result.protocolRecordId);
      setValues(result.protocolValues);

      if (result.changed) {
        setStatus(
          result.protocolSaved || result.registrationSaved
            ? 'Бланки предыдущего реципиента автоматически сохранены. Выбран новый реципиент.'
            : 'Выбран новый реципиент.',
        );
      } else {
        setStatus(`Текущий реципиент: ${recipient.fullName}.`);
      }

      return true;
    } catch (error) {
      console.error('Не удалось сменить текущего реципиента:', error);
      setStatus(error instanceof Error ? error.message : 'Не удалось сменить текущего реципиента.');
      return false;
    }
  };

  const validateHemacon = () => {
    const warning = getProtocolHemaconWarning(values);
    if (!warning) return true;
    setStatus(warning);
    setActiveBlock('donor');
    return false;
  };

  const saveToDatabase = async () => {
    if (!hasContent) return false;
    if (document.active) {
      if (!document.editing || !document.record || !document.hasChanges) return true;
      if (!validateHemacon()) return false;
      try {
        const savedValues = { ...values, recipientId: String(document.record.recipientId) };
        const record = await updateProtocolRecord(document.record.id, savedValues);
        document.open(record, record.values, 'edit');
        document.setWorkingValues(cleanProtocolDraft);
        setActiveBlock(null);
        setStatus('Изменения сохранены в исходном бланке.');
        return true;
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Не удалось сохранить изменения.');
        return false;
      }
    }
    if (!validateHemacon()) return false;
    if (!values.recipientName?.trim()) {
      setStatus('Для сохранения укажите ФИО реципиента.');
      setActiveBlock('general');
      return false;
    }

    try {
      const record = await saveProtocolRecord(values);
      setRecordId(record.id);
      const savedValues = { ...values, recipientId: String(record.recipientId) };
      setValues(savedValues);
      adoptCurrentRecipientFromValues(savedValues);
      document.open(record, savedValues, 'edit');
      document.setWorkingValues(cleanProtocolDraft(savedValues));
      setRecordId(null);
      setStatus('Бланк сохранён.');
      return true;
    } catch (error) {
      console.error('Не удалось сохранить бланк в базе:', error);
      setStatus(error instanceof Error ? error.message : 'Не удалось сохранить бланк в базе.');
      return false;
    }
  };

  const clearForm = () => {
    if (document.active || !hasContent) return;
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
    setHistoryRefreshToken((current) => current + 1);

    void clearProtocolDraft()
      .then(() => {
        if (currentRecipient) draft.touch();
      })
      .catch((error: unknown) => console.error('Не удалось очистить сохранённый бланк:', error));
  };

  const openRecord = async (record: ProtocolRecord, mode: SavedDocumentMode = 'view') => {
    setComponentUnitNumberChecked(false);
    setDismissedComponentUnitWarningKey('');
    setActiveBlock(null);

    document.open(record, record.values, mode);
    setRegistryOpen(false);
    setStatus('');
  };

  const bloodGroupMismatch = getBloodGroupMismatch(values);

  useEffect(() => {
    setDismissedBloodGroupWarningKey('');
  }, [bloodGroupMismatch.key]);

  const bloodGroupWarning =
    bloodGroupMismatch.key &&
    (!bloodGroupMismatch.dismissible || bloodGroupMismatch.key !== dismissedBloodGroupWarningKey)
      ? bloodGroupMismatch.message
      : '';

  const dismissBloodGroupWarning = () => {
    if (bloodGroupMismatch.key && bloodGroupMismatch.dismissible) {
      setDismissedBloodGroupWarningKey(bloodGroupMismatch.key);
    }
  };

  const componentUnitNumberState = getComponentUnitNumberWarning(values);
  const activeComponentUnitNumberWarning =
    componentUnitNumberChecked && componentUnitNumberState.key
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
    if (!nextWarning.key) {
      setDismissedComponentUnitWarningKey('');
    }
  };

  const dismissComponentUnitNumberWarning = () => {
    if (activeComponentUnitNumberWarning.key) {
      setDismissedComponentUnitWarningKey(activeComponentUnitNumberWarning.key);
    }
  };

  const handleRecipientDeleted = (recipientId: number) => {
    if (document.record?.recipientId === recipientId) document.close();
    if (Number(document.workingValues.recipientId) !== recipientId) return;

    draft.touch();
    setRecordId(null);
    document.setWorkingValues(clearRecipientLinkedValues(document.workingValues, recipientId));
    setHistoryRefreshToken((current) => current + 1);
    setComponentUnitNumberChecked(false);
    setDismissedComponentUnitWarningKey('');
    setStatus('Реципиент удалён. Связанные с ним данные удалены из текущего бланка.');
  };

  const handleRecipientDisconnected = (recipientId: number) => {
    if (Number(document.workingValues.recipientId) !== recipientId) return;

    draft.touch();
    setRecordId(null);
    document.setWorkingValues(clearRecipientLinkedValues(document.workingValues, recipientId));
    setHistoryRefreshToken((current) => current + 1);
    setComponentUnitNumberChecked(false);
    setDismissedComponentUnitWarningKey('');
    setStatus('Текущий реципиент отключён. Связанные с ним данные удалены из текущего бланка.');
  };

  const hemaconDateWarning = getHemaconDateOrderWarning(values);
  const expiredReagents = document.active ? [] : getExpiredReagentWarnings(values);
  const hemaconExpirationWarning =
    document.active || hemaconDateWarning ? '' : getHemaconExpirationWarning(values.expirationDate);
  const expirationWarnings = [hemaconExpirationWarning, ...expiredReagents].filter(Boolean);
  const reagentWarning = expirationWarnings.length
    ? `Внимание: истёк срок годности.\n\n${expirationWarnings.map((warning) => `• ${warning}`).join('\n')}.`
    : '';
  const compatibilityWarning = getCompatibilityDangerWarning(values);

  return {
    document,
    hasContent,
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
    validateHemacon,
    hemaconWarning: getProtocolHemaconWarning(values),
    hemaconDateWarning,
    reagentWarning,
    compatibilityWarning,
    bloodGroupWarning,
    bloodGroupWarningDismissible: bloodGroupMismatch.dismissible,
    dismissBloodGroupWarning,
    componentUnitNumberWarning,
    validateComponentUnitNumber,
    dismissComponentUnitNumberWarning,
    clearForm,
    openRecord,
    handleRecipientDeleted,
    handleRecipientDisconnected,
  };
};
