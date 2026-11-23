import { AnimatedMessage } from '../animated-reveal/animated-message';
import { SavedDocumentPage } from '../saved-document/saved-document-page';
import { hasDocumentContent } from '../../domain/document-content';
import { printPageLabel } from '../../domain/print-page-label';
import { savedDocumentTitle } from '../saved-document/saved-document-title';
import { useSavedDocumentList } from '../saved-document/saved-document-list';
import ui from '../../styles/ui';
import { useDocumentState, type SavedDocumentMode } from '../saved-document/use-document-state';
import { clearIndividualSelectionStaff } from '../saved-document/working-form-cleanup';
import { usePendingSavedDocument } from '../saved-document/saved-document-navigation';
import { SavedDocumentBar } from '../saved-document/saved-document-bar';
import { updateSavedRequestProfile } from '../saved-document/saved-request-profile';
import { persistLocalDraft } from '../../storage/repositories/local-draft';
import { RECIPIENT_PROFILE_FIELDS } from '../../storage/sqlite/recipient-data';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import {
  readCurrentRecipient,
  switchCurrentRecipient,
  updateCurrentRecipientProfile,
  type CurrentRecipient,
} from '../../storage/repositories/current-recipient';
import { clearRecipientLinkedRequestDraft } from '../../storage/repositories/recipient-deletion';
import {
  saveBloodRequestRecord,
  updateRecipient,
  type BloodRequestRecord,
  type RecipientRecord,
} from '../../storage/repositories/recipients';
import { SiteNavigation } from '../site-navigation/site-navigation';
import { RecipientDatabaseModal } from '../transfusion-protocol/recipient-database-modal';
import { formatRecipientAge } from '../transfusion-protocol/recipient-demographics';
import {
  formatAlloimmuneAntibodies,
  formatRecipientAntigens,
} from '../transfusion-protocol/recipient-examination-model';
import {
  formatHistoryValue,
  formatObstetricHistory,
  TRANSFUSION_HISTORY_FIELDS,
} from '../transfusion-protocol/recipient-history-model';
import { RecipientExaminationSection } from '../transfusion-protocol/recipient-input-sections';
import { RecipientHistoryModal } from '../transfusion-protocol/recipient-history-modal';
import { SavedOptionsField } from '../transfusion-protocol/saved-options-field';
import { usePreviousTransfusionSuggestion } from '../transfusion-protocol/use-previous-transfusion-suggestion';
import {
  generatedDirectionHistory,
  hasStructuredDirectionHistory,
  hasStructuredObstetricHistory,
  restoreDirectionHistory,
} from './direction-history';
import {
  formatIndications,
  getIndicationComponent,
} from '../transfusion-protocol/indications-model';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import { IndividualSelectionComponentModal } from './individual-selection-component-modal';
import { individualSelectionReasonLabel } from './component-request-447n';
import { IndividualSelectionRecipientModal } from './individual-selection-recipient-modal';
import { RequestEditorModal, type RequestEditorField } from './request-editor-modal';
import { formatDoseQuantity, sanitizeDoseQuantity } from './dose-quantity';
import { restoreRequestDraft } from './request-draft-values';
import {
  normalizeDirectionIndications,
  visibleDirectionComponentValues,
} from './direction-indications';
import { persistRequestOptions } from './request-saved-options';
import {
  getIndividualSelectionClearValues,
  hasIndividualSelectionValuesToClear,
} from './individual-selection-clear';
import { useFormPages } from './use-form-pages';
import { AdaptiveRuledField } from './adaptive-ruled-field';
import {
  activateOnKeyboard,
  formatDirectionDate,
  readSavedRequestRecordId,
  REQUEST_AUTO_FIELDS,
  type RequestAutoField,
} from './request-common';
import styles from './individual-selection-direction.module.css';

const STORAGE_KEY = 'blood:individual-selection-direction-draft';
const SAVED_RECORD_ID_STORAGE_KEY = `${STORAGE_KEY}:saved-record-id`;

type DirectionDraft = Record<RequestAutoField, string> & {
  sourceRecipientId: string;
  transfusionHistory: string;
  requiredComponent: string;
  quantity: string;
  individualSelectionIndications: string;
  medicalOrganization: string;
  directionDate: string;
  doctorName: string;
  doctorPhone: string;
  indicationValues: ProtocolValues;
  recipientProfileSnapshot: ProtocolValues;
  autoValues: Partial<Record<RequestAutoField, string>>;
};

type Editor = 'component' | 'recipient' | 'history' | 'footer' | null;

const MEDICAL_ORGANIZATION_OPTION: RequestEditorField = {
  name: 'medicalOrganization',
  label: 'Наименование ЛПУ',
  savedOptionsCategory: 'medicalOrganization',
};

const FOOTER_FIELDS: RequestEditorField[] = [
  { name: 'directionDate', label: 'Дата направления', type: 'date' },
  {
    name: 'doctorName',
    label: 'Врач, назначивший трансфузию',
    savedOptionsCategory: 'individualSelectionDoctorName',
    wide: true,
  },
  {
    name: 'doctorPhone',
    label: 'Контактный телефон',
    savedOptionsCategory: 'individualSelectionContactPhone',
    wide: true,
  },
];

const emptyDraft = (): DirectionDraft => ({
  ...getIndividualSelectionClearValues(),
  sourceRecipientId: '',
  recipientAboRh: '',
  recipientPhenotype: '',
  recipientName: '',
  recipientAge: '',
  department: '',
  medicalRecordNumber: '',
  diagnosis: '',
  transfusionHistory: '',
  obstetricHistory: '',
  recipientSex: '',
  recipientProfileSnapshot: {},
  autoValues: {},
});

const draftFromRecord = (values: unknown): DirectionDraft => {
  const next = restoreRequestDraft(emptyDraft(), values);
  next.recipientProfileSnapshot = restoreDirectionHistory(
    next.recipientProfileSnapshot,
    next.transfusionHistory,
  );
  next.indicationValues = normalizeDirectionIndications(
    next.indicationValues,
    next.requiredComponent,
  );
  next.quantity = sanitizeDoseQuantity(next.quantity);
  return next;
};

const loadDraft = (): DirectionDraft => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? draftFromRecord(JSON.parse(raw)) : emptyDraft();
  } catch {
    return emptyDraft();
  }
};

const currentAutoValues = async (
  recipient: CurrentRecipient | null,
): Promise<{
  autoValues: Partial<Record<RequestAutoField, string>>;
  recipientProfileSnapshot: ProtocolValues;
}> => {
  if (!recipient) return { autoValues: {}, recipientProfileSnapshot: {} };

  const values: ProtocolValues = {
    ...recipient.profile,
    recipientId: String(recipient.id),
    recipientName: recipient.fullName,
  };
  return {
    autoValues: {
      recipientAboRh: [values.recipientAbo, values.recipientRh].filter(Boolean).join(' '),
      recipientPhenotype: formatRecipientAntigens(values),
      recipientName: recipient.fullName,
      recipientAge: formatRecipientAge(values.recipientBirthDate),
      department: values.department?.trim() ?? '',
      medicalRecordNumber: values.medicalRecordNumber?.trim() ?? '',
      diagnosis: values.diagnosis?.trim() ?? '',
      obstetricHistory: values.recipientSex === 'Женский' ? formatObstetricHistory(values) : '',
      recipientSex: values.recipientSex?.trim() ?? '',
    },
    recipientProfileSnapshot: {
      ...Object.fromEntries(
        [
          ...RECIPIENT_PROFILE_FIELDS,
          'previousTransfusionsAutoText',
          'previousTransfusionsSuggestedText',
        ].flatMap((field) => (values[field] !== undefined ? [[field, values[field]]] : [])),
      ),
      recipientId: String(recipient.id),
      recipientName: recipient.fullName,
    },
  };
};

const mergeAutoValues = (
  current: DirectionDraft,
  recipient: CurrentRecipient | null,
  currentData: Awaited<ReturnType<typeof currentAutoValues>>,
): DirectionDraft => {
  if (!recipient) return current;
  const { autoValues, recipientProfileSnapshot } = currentData;

  const next: DirectionDraft = {
    ...current,
    sourceRecipientId: String(recipient.id),
    recipientProfileSnapshot,
    autoValues: { ...autoValues },
  };

  REQUEST_AUTO_FIELDS.forEach((field) => {
    next[field] = autoValues[field] ?? '';
  });

  return next;
};

export const IndividualSelectionDirection = () => {
  const [initialStored] = useState(() => ({
    draft: loadDraft(),
    id: readSavedRequestRecordId(STORAGE_KEY),
  }));
  const documentState = useDocumentState<DirectionDraft>(
    () => (initialStored.id === null ? initialStored.draft : emptyDraft()),
    clearIndividualSelectionStaff,
  );
  const {
    values: draft,
    setValues: setDraft,
    open: openSavedDocument,
    isActive: hasSavedDocument,
  } = documentState;
  const hasContent = hasDocumentContent('individual-selection-direction', draft);
  const [editor, setEditorState] = useState<Editor>(null);
  const setEditor = (next: Editor) => {
    if (next === null || !documentState.isReadOnly()) setEditorState(next);
  };
  const [registryOpen, setRegistryOpen] = useState(false);
  const savedList = useSavedDocumentList({
    kind: 'individual-selection-direction',
    record: documentState.record,
    open: registryOpen,
    onOpen: () => setRegistryOpen(true),
  });
  const [status, setStatus] = useState('');
  const refreshVersionRef = useRef(0);
  const profileEditVersionRef = useRef(0);
  const pendingProfileUpdateRef = useRef<Promise<void>>(Promise.resolve());
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [currentRecipient, setCurrentRecipient] = useState<CurrentRecipient | null>(
    readCurrentRecipient,
  );
  const canClear =
    hasContent && hasIndividualSelectionValuesToClear(draft, getIndividualSelectionClearValues());

  useEffect(() => {
    if (initialStored.id === null) return;
    openSavedDocument(
      { id: initialStored.id, recipientId: Number(initialStored.draft.sourceRecipientId) },
      initialStored.draft,
    );
    window.localStorage.removeItem(SAVED_RECORD_ID_STORAGE_KEY);
  }, [initialStored, openSavedDocument]);

  usePendingSavedDocument('individual-selection-direction', (record, mode) => {
    void openSavedDirection(record, mode);
  });

  const refreshCurrentData = useCallback(
    async (recipient = readCurrentRecipient(), baseDraft?: DirectionDraft) => {
      if (hasSavedDocument()) return;
      const refreshVersion = ++refreshVersionRef.current;
      if ((readCurrentRecipient()?.id ?? null) !== (recipient?.id ?? null)) return;
      setCurrentRecipient(recipient);

      const autoValues = await currentAutoValues(recipient);

      if (hasSavedDocument() || refreshVersion !== refreshVersionRef.current) return;
      const current = baseDraft ?? draftRef.current;
      const recipientChanged = Boolean(
        recipient &&
        current.sourceRecipientId &&
        current.sourceRecipientId !== String(recipient.id),
      );

      const base =
        recipientChanged && !baseDraft
          ? {
              ...emptyDraft(),
              medicalOrganization: current.medicalOrganization,
              doctorName: current.doctorName,
              doctorPhone: current.doctorPhone,
            }
          : current;
      const next = mergeAutoValues(base, recipient, autoValues);
      next.recipientProfileSnapshot = {
        ...next.recipientProfileSnapshot,
        ...generatedDirectionHistory(base.recipientProfileSnapshot),
      };

      if (
        hasSavedDocument() ||
        refreshVersion !== refreshVersionRef.current ||
        (readCurrentRecipient()?.id ?? null) !== (recipient?.id ?? null)
      )
        return;
      draftRef.current = next;
      setDraft(next);
    },
    [hasSavedDocument, setDraft],
  );

  useEffect(() => {
    if (documentState.active) return;
    void refreshCurrentData().catch((error: unknown) => {
      console.error('Не удалось загрузить текущие данные реципиента:', error);
      setStatus('Не удалось загрузить текущие данные реципиента. Повторите действие.');
    });
  }, [refreshCurrentData, documentState.active]);

  useEffect(() => {
    if (!persistLocalDraft(STORAGE_KEY, documentState.workingValues)) {
      setStatus('Не удалось сохранить черновик в браузере. Сохраните бланк в базе данных.');
    }
  }, [documentState.workingValues]);

  useEffect(() => {
    if (documentState.active) return;
    if (!currentRecipient) return;
    if (currentRecipient.profile.diagnosis?.trim()) return;
    if (draft.sourceRecipientId !== String(currentRecipient.id)) return;

    const legacyDiagnosis = draft.diagnosis?.trim();
    if (!legacyDiagnosis) return;

    let active = true;

    void updateRecipient(currentRecipient.id, {
      ...currentRecipient.profile,
      diagnosis: legacyDiagnosis,
      recipientId: String(currentRecipient.id),
      recipientName: currentRecipient.fullName,
    })
      .then(async (updatedRecipient) => {
        if (!active) return;
        await switchCurrentRecipient(updatedRecipient);
        if (!active) return;
        await refreshCurrentData(readCurrentRecipient());
      })
      .catch((error: unknown) => {
        console.error('Не удалось перенести диагноз в общий профиль реципиента:', error);
      });

    return () => {
      active = false;
    };
  }, [
    currentRecipient,
    documentState.active,
    draft.diagnosis,
    draft.sourceRecipientId,
    refreshCurrentData,
  ]);

  const updateFields = (changes: Record<string, string>) => {
    if (documentState.isReadOnly()) return;
    if (documentState.isActive()) {
      setDraft((current) => {
        const next = { ...current };
        for (const [name, value] of Object.entries(changes)) {
          if (name in next && name !== 'autoValues')
            (next as Record<string, unknown>)[name] = value;
        }
        return changes.department !== undefined
          ? updateSavedRequestProfile(
              next,
              { department: changes.department },
              documentState.record?.createdAt,
            )
          : next;
      });
      return;
    }
    if (changes.department !== undefined && currentRecipient) {
      void updateExamination({ department: changes.department });
    }

    setDraft((current) => {
      const next = { ...current };

      Object.entries(changes).forEach(([name, value]) => {
        if (name in next && name !== 'autoValues') {
          (next as Record<string, unknown>)[name] = value;
        }
      });

      draftRef.current = next;
      return next;
    });
  };
  const updateIndications = (changes: ProtocolValues) => {
    if (documentState.isReadOnly()) return;

    setDraft((current) => {
      const currentComponent = getIndicationComponent(current.indicationValues);
      const component = changes.componentGroup ?? changes.indicationComponent ?? currentComponent;
      const indicationValues = {
        ...current.indicationValues,
        ...changes,
        componentGroup: component,
        indicationComponent: component,
      };

      const next = {
        ...current,
        indicationValues,
      };
      draftRef.current = next;
      return next;
    });
  };
  const clear = async () => {
    if (documentState.isActive() || !canClear) return;
    const recipient = readCurrentRecipient();
    const autoValues = await currentAutoValues(recipient);
    const next = mergeAutoValues(emptyDraft(), recipient, autoValues);
    setDraft({
      ...next,
      ...getIndividualSelectionClearValues(),
    });
    setStatus('');
  };

  const save = async () => {
    if (!hasContent) return false;
    if (documentState.active) {
      if (!documentState.editing || !documentState.record || !documentState.hasChanges) return true;
      try {
        const record = await saveBloodRequestRecord({
          recordId: documentState.record.id,
          recipientId: documentState.record.recipientId,
          kind: 'individual-selection-direction',
          values: { ...draftRef.current },
        });
        await persistRequestOptions(draftRef.current, [
          MEDICAL_ORGANIZATION_OPTION,
          ...FOOTER_FIELDS,
        ]);
        documentState.open(record, draftFromRecord(record.values), 'edit');
        documentState.setWorkingValues(clearIndividualSelectionStaff);
        setEditor(null);
        setStatus('Изменения сохранены в исходном бланке.');
        return true;
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Не удалось сохранить изменения.');
        return false;
      }
    }
    await pendingProfileUpdateRef.current;
    const recipient = readCurrentRecipient();
    if (!recipient) {
      setStatus('Выберите реципиента перед сохранением направления.');
      return false;
    }

    try {
      const draftToSave = {
        ...draftRef.current,
        sourceRecipientId: String(recipient.id),
        recipientProfileSnapshot: {
          ...draftRef.current.recipientProfileSnapshot,
          ...recipient.profile,
          ...generatedDirectionHistory(draftRef.current.recipientProfileSnapshot),
          recipientId: String(recipient.id),
          recipientName: recipient.fullName,
        },
      };

      const record = await saveBloodRequestRecord({
        recipientId: recipient.id,
        kind: 'individual-selection-direction',
        values: { ...draftToSave },
      });
      await persistRequestOptions(draftToSave, [MEDICAL_ORGANIZATION_OPTION, ...FOOTER_FIELDS]);

      draftRef.current = draftToSave;
      setDraft(draftToSave);
      documentState.open(record, draftToSave, 'edit');
      documentState.setWorkingValues(clearIndividualSelectionStaff(draftToSave));
      setStatus('Направление сохранено.');
      return true;
    } catch (error) {
      console.error('Не удалось сохранить направление:', error);
      setStatus(error instanceof Error ? error.message : 'Не удалось сохранить направление.');
      return false;
    }
  };

  const selectRecipient = async (recipient: RecipientRecord) => {
    ++profileEditVersionRef.current;
    try {
      documentState.close();
      await switchCurrentRecipient(recipient);
      await refreshCurrentData(readCurrentRecipient());
      return true;
    } catch (error) {
      console.error('Не удалось выбрать реципиента для направления:', error);
      return false;
    }
  };

  const openSavedDirection = async (
    record: BloodRequestRecord,
    mode: SavedDocumentMode = 'view',
  ) => {
    ++refreshVersionRef.current;
    ++profileEditVersionRef.current;
    documentState.open(record, draftFromRecord(record.values), mode);
    setEditor(null);
    setRegistryOpen(false);
    setStatus('');
  };

  const handleRecipientDeleted = (recipientId: number) => {
    if (documentState.record?.recipientId === recipientId) documentState.close();
    if (currentRecipient?.id === recipientId) {
      setCurrentRecipient(null);
    }

    if (Number(documentState.workingValues.sourceRecipientId) !== recipientId) return;

    documentState.setWorkingValues((current) =>
      clearRecipientLinkedRequestDraft(current, recipientId, 'individual-selection-direction'),
    );
    setStatus('Реципиент удалён. Связанные с ним данные удалены из текущего направления.');
  };

  const handleRecipientDisconnected = (recipientId: number) => {
    if (currentRecipient?.id === recipientId) {
      setCurrentRecipient(null);
    }

    if (Number(documentState.workingValues.sourceRecipientId) !== recipientId) return;

    documentState.setWorkingValues((current) =>
      clearRecipientLinkedRequestDraft(current, recipientId, 'individual-selection-direction'),
    );
    setStatus(
      'Текущий реципиент отключён. Связанные с ним данные удалены из текущего направления.',
    );
  };

  const examinationValues = useMemo<ProtocolValues>(() => {
    if (currentRecipient && !documentState.active) {
      return {
        ...draft.recipientProfileSnapshot,
        ...currentRecipient.profile,
        ...generatedDirectionHistory(draft.recipientProfileSnapshot),
        recipientId: String(currentRecipient.id),
        recipientName: currentRecipient.fullName,
      };
    }

    return {
      ...draft.recipientProfileSnapshot,
      recipientId: draft.sourceRecipientId,
      recipientName: draft.recipientName,
      recipientSex: draft.recipientSex,
      medicalRecordNumber: draft.medicalRecordNumber,
      diagnosis: draft.diagnosis,
      department: draft.department,
      recipientAge: draft.recipientAge,
    };
  }, [currentRecipient, draft, documentState.active]);

  const previousTransfusionSuggestion = usePreviousTransfusionSuggestion({
    recipientId: examinationValues.recipientId,
    savedDocument: documentState.active,
  });

  const updateExamination = (changes: ProtocolValues) => {
    if (documentState.isActive()) {
      setDraft((current) =>
        updateSavedRequestProfile(current, changes, documentState.record?.createdAt),
      );
      return Promise.resolve();
    }
    const recipient = readCurrentRecipient();
    if (!recipient) {
      setDraft((current) => updateSavedRequestProfile(current, changes));
      return Promise.resolve();
    }
    const version = ++profileEditVersionRef.current;
    setCurrentRecipient((current) =>
      current?.id === recipient.id
        ? {
            ...current,
            fullName: changes.recipientName ?? current.fullName,
            profile: { ...current.profile, ...changes },
          }
        : current,
    );

    if (changes.recipientName !== undefined && !changes.recipientName.trim()) {
      return Promise.resolve();
    }

    const operation = (async () => {
      try {
        await updateCurrentRecipientProfile(recipient, changes);
        if (version !== profileEditVersionRef.current) return;
        await refreshCurrentData(readCurrentRecipient());
      } catch (error) {
        console.error('Не удалось обновить общие данные реципиента:', error);
        if (version === profileEditVersionRef.current) {
          setStatus('Не удалось сохранить данные реципиента. Повторите ввод.');
        }
      }
    })();
    pendingProfileUpdateRef.current = operation;
    return operation;
  };

  const updateHistory = (changes: ProtocolValues) => {
    const snapshot = draftRef.current.recipientProfileSnapshot;
    if (!documentState.isActive() && changes.previousTransfusionsAutoText === '') {
      const next = updateSavedRequestProfile(draftRef.current, changes);
      draftRef.current = next;
      setDraft(next);
      return updateExamination(changes);
    }
    if (
      documentState.isActive() ||
      !(changes.previousTransfusionsAutoText || snapshot.previousTransfusionsAutoText)
    ) {
      return updateExamination(changes);
    }
    const next = updateSavedRequestProfile(draftRef.current, changes);
    draftRef.current = next;
    setDraft(next);
    const shared = Object.fromEntries(
      Object.entries(changes).filter(
        ([field]) =>
          ![
            'previousTransfusions',
            'previousTransfusionsStatus',
            'previousTransfusionsAutoText',
            'previousTransfusionsSuggestedText',
          ].includes(field),
      ),
    );
    return Object.keys(shared).length > 0 ? updateExamination(shared) : Promise.resolve();
  };

  const handleGroupedHover = (event: MouseEvent<HTMLDivElement>) => {
    const target =
      documentState.readOnly || !(event.target instanceof Element) ? null : event.target;
    if (target?.closest('[data-recipient-group]'))
      event.currentTarget.dataset.recipientHovered = 'true';
    else delete event.currentTarget.dataset.recipientHovered;
    if (target?.closest('[data-history-group]'))
      event.currentTarget.dataset.historyHovered = 'true';
    else delete event.currentTarget.dataset.historyHovered;
  };

  const editorConfig = useMemo(() => {
    const valuesFor = (fields: RequestEditorField[]) =>
      Object.fromEntries(
        fields.map(({ name }) => [
          name,
          typeof draft[name as keyof DirectionDraft] === 'string'
            ? String(draft[name as keyof DirectionDraft])
            : '',
        ]),
      );

    switch (editor) {
      case 'footer':
        return {
          title: 'Дата и подпись',
          fields: FOOTER_FIELDS,
          values: valuesFor(FOOTER_FIELDS),
        };
      default:
        return null;
    }
  }, [draft, editor]);

  const visibleComponent = visibleDirectionComponentValues(draft);
  const formSections = [
    <div
      key="organization"
      className={`${styles.fillSection} ${styles.recipientSection} ${documentState.readOnly ? styles.fillSectionInactive : ''}`}
      data-form-section
      data-recipient-group
      data-recipient-position="first"
      role={documentState.readOnly ? undefined : 'button'}
      tabIndex={documentState.readOnly ? -1 : 0}
      onClick={() => setEditor('recipient')}
      onKeyDown={(event) => activateOnKeyboard(event, () => setEditor('recipient'))}
    >
      <AdaptiveRuledField label="Наименование ЛПУ:" value={draft.medicalOrganization} />
    </div>,

    <div
      key="recipient"
      className={`${styles.fillSection} ${styles.recipientSection} ${documentState.readOnly ? styles.fillSectionInactive : ''}`}
      data-form-section
      data-recipient-group
      data-recipient-position="last"
      role={documentState.readOnly ? undefined : 'button'}
      tabIndex={documentState.readOnly ? -1 : 0}
      onClick={() => setEditor('recipient')}
      onKeyDown={(event) => activateOnKeyboard(event, () => setEditor('recipient'))}
    >
      <AdaptiveRuledField label="Отделение:" value={draft.department} />
      <AdaptiveRuledField label="Ф.И.О. реципиента:" value={draft.recipientName} />
      <AdaptiveRuledField label="Возраст:" value={draft.recipientAge} />
      <AdaptiveRuledField label="№ медицинской карты:" value={draft.medicalRecordNumber} />
      <AdaptiveRuledField label="Диагноз:" value={draft.diagnosis} />
      <AdaptiveRuledField
        label="Группа крови и резус-фактор реципиента:"
        value={draft.recipientAboRh}
      />
      <AdaptiveRuledField label="Фенотип реципиента:" value={draft.recipientPhenotype} />
      <AdaptiveRuledField
        label="Аллоиммунные антитела:"
        value={formatAlloimmuneAntibodies(examinationValues)}
      />
    </div>,

    ...TRANSFUSION_HISTORY_FIELDS.map(({ label, statusName, textName }, index) => (
      <div
        key={statusName}
        className={`${styles.fillSection} ${styles.historySection} ${documentState.readOnly ? styles.fillSectionInactive : ''}`}
        data-form-section
        data-history-group
        data-history-position={
          index === 0
            ? 'first'
            : index === TRANSFUSION_HISTORY_FIELDS.length - 1 && draft.recipientSex !== 'Женский'
              ? 'last'
              : undefined
        }
        role={documentState.readOnly ? undefined : 'button'}
        tabIndex={documentState.readOnly || index > 0 ? -1 : 0}
        onClick={() => setEditor('history')}
        onKeyDown={(event) => activateOnKeyboard(event, () => setEditor('history'))}
      >
        <AdaptiveRuledField
          label={`${label}:`}
          value={
            formatHistoryValue(examinationValues, statusName, textName) ||
            (index === 0 && !hasStructuredDirectionHistory(examinationValues)
              ? draft.transfusionHistory
              : '')
          }
        />
      </div>
    )),

    ...(draft.recipientSex === 'Женский'
      ? [
          <div
            key="obstetric"
            className={`${styles.fillSection} ${styles.historySection} ${documentState.readOnly ? styles.fillSectionInactive : ''}`}
            data-form-section
            data-history-group
            data-history-position="last"
            role={documentState.readOnly ? undefined : 'button'}
            tabIndex={documentState.readOnly ? -1 : 0}
            onClick={() => setEditor('history')}
            onKeyDown={(event) => activateOnKeyboard(event, () => setEditor('history'))}
          >
            <AdaptiveRuledField
              label="Акушерский анамнез у женщин:"
              wrapSentences={hasStructuredObstetricHistory(examinationValues)}
              value={
                hasStructuredObstetricHistory(examinationValues)
                  ? formatObstetricHistory(examinationValues)
                  : draft.obstetricHistory
              }
            />
          </div>,
        ]
      : []),

    <div
      key="component"
      className={styles.fillSection}
      data-form-section
      role={documentState.readOnly ? undefined : 'button'}
      tabIndex={documentState.readOnly ? -1 : 0}
      onClick={() => setEditor('component')}
      onKeyDown={(event) => activateOnKeyboard(event, () => setEditor('component'))}
    >
      <AdaptiveRuledField
        label="Наименование требуемого компонента:"
        value={visibleComponent.requiredComponent}
      />
      <AdaptiveRuledField
        label="Количество:"
        value={formatDoseQuantity(visibleComponent.quantity)}
      />
      <AdaptiveRuledField
        label="Показания к трансфузии:"
        value={formatIndications(visibleComponent.indicationValues)}
      />
      <AdaptiveRuledField
        label="Показания для индивидуального подбора:"
        value={individualSelectionReasonLabel(visibleComponent.individualSelectionIndications)}
      />
    </div>,

    <div
      key="footer"
      className={`${styles.fillSection} ${styles.footerSection}`}
      data-form-section
      role={documentState.readOnly ? undefined : 'button'}
      tabIndex={documentState.readOnly ? -1 : 0}
      onClick={() => setEditor('footer')}
      onKeyDown={(event) => activateOnKeyboard(event, () => setEditor('footer'))}
    >
      <AdaptiveRuledField
        label="Дата направления:"
        value={formatDirectionDate(draft.directionDate)}
      />

      <AdaptiveRuledField label="Врач, назначивший трансфузию:" value={draft.doctorName} />
      <AdaptiveRuledField label="Контактный телефон:" value={draft.doctorPhone} />
    </div>,
  ];

  const paginationKey = [
    draft.medicalOrganization,
    draft.department,
    draft.recipientName,
    draft.recipientAge,
    draft.medicalRecordNumber,
    draft.diagnosis,
    draft.recipientAboRh,
    draft.recipientPhenotype,
    formatAlloimmuneAntibodies(examinationValues),
    formatIndications(visibleComponent.indicationValues),
    ...TRANSFUSION_HISTORY_FIELDS.map(({ statusName, textName }) =>
      formatHistoryValue(examinationValues, statusName, textName),
    ),
    draft.transfusionHistory,
    draft.recipientSex,
    formatObstetricHistory(examinationValues),
    draft.obstetricHistory,
    visibleComponent.requiredComponent,
    visibleComponent.quantity,
    individualSelectionReasonLabel(visibleComponent.individualSelectionIndications),
    draft.directionDate,
    draft.doctorName,
    draft.doctorPhone,
  ].join('\u0001');

  const { pageStarts, pageRefs } = useFormPages(formSections.length, paginationKey);

  const printPage = (page: number) => {
    const sheet = pageRefs.current[page - 1];
    if (!sheet) return;
    document.body.classList.add('print-individual-direction');
    sheet.setAttribute('data-print-active', '');

    try {
      window.print();
    } finally {
      sheet.removeAttribute('data-print-active');
      document.body.classList.remove('print-individual-direction');
    }
  };

  return (
    <SavedDocumentPage
      className={styles.shell}
      document={documentState}
      hasContent={hasContent}
      onSave={save}
    >
      <header className={`app-header ${styles.header}`}>
        <div className="toolbar-wrap">
          <SiteNavigation
            current="summary-request"
            showRecipient={!documentState.active}
            recipientName={currentRecipient?.fullName ?? ''}
            recipientAbo={currentRecipient?.profile.recipientAbo ?? ''}
            recipientRh={currentRecipient?.profile.recipientRh ?? ''}
            currentRecipientAvailable={Boolean(currentRecipient)}
            onOpenCurrentRecipient={() => setRegistryOpen(true)}
            onOpenRecipients={() => setRegistryOpen(true)}
          />
          <SavedDocumentBar
            onReturnToList={savedList.returnToList}
            document={documentState}
            title={savedDocumentTitle('individual-selection-direction', draft)}
          />
          <div className="print-actions" aria-label="Панель действий">
            {!documentState.active && (
              <button
                type="button"
                className={`${ui.dangerButton} ${ui.toolbarButton} clear-button`}
                onClick={() => void clear()}
                disabled={!canClear}
              >
                Очистить бланк
              </button>
            )}
            <button
              type="button"
              className={`${ui.successButton} ${ui.toolbarButton} save-button`}
              onClick={() => void save()}
              disabled={!hasContent || (documentState.active && !documentState.hasChanges)}
            >
              Сохранить
            </button>
            {pageStarts.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`${ui.primaryButton} ${ui.toolbarButton} print-button`}
                onClick={() => printPage(index + 1)}
              >
                {printPageLabel(index + 1, pageStarts.length)}
              </button>
            ))}
          </div>
          <AnimatedMessage message={status} className="toolbar-status" />
        </div>
      </header>

      <div
        className={styles.sheetWrap}
        data-document-paper
        onMouseMove={handleGroupedHover}
        onMouseLeave={(event) => {
          delete event.currentTarget.dataset.recipientHovered;
          delete event.currentTarget.dataset.historyHovered;
        }}
      >
        {pageStarts.map((start, index) => (
          <section
            key={index}
            ref={(element) => {
              pageRefs.current[index] = element;
            }}
            className={`${styles.sheet} ${index === 0 ? styles.pageOne : styles.pageTwo}`}
            aria-label={`Направление на индивидуальный подбор, страница ${index + 1}`}
          >
            <div className={styles.pageContent}>
              {index === 0 && (
                <h1 className={styles.title}>
                  Направление на индивидуальный подбор компонентов крови.
                </h1>
              )}
              {formSections.slice(start, pageStarts[index + 1] ?? formSections.length)}
            </div>
          </section>
        ))}
      </div>

      {editor === 'recipient' && (
        <IndividualSelectionRecipientModal
          savedDocument={documentState.active}
          values={examinationValues}
          onRecipientChange={updateExamination}
          onOpenRecipients={() => {
            setEditor(null);
            setRegistryOpen(true);
          }}
          onSelectRecipient={documentState.active ? () => false : selectRecipient}
          onClose={() => setEditor(null)}
          topContent={
            <fieldset className="ui-fieldset">
              <legend>Медицинская организация</legend>
              <div className="ui-field-label">Наименование ЛПУ</div>
              <SavedOptionsField
                name="medicalOrganization"
                label="Наименование ЛПУ"
                category="medicalOrganization"
                value={draft.medicalOrganization}
                onChange={(value) => updateFields({ medicalOrganization: value })}
              />
            </fieldset>
          }
        >
          <RecipientExaminationSection
            values={examinationValues}
            onChange={(changes) => void updateExamination(changes)}
          />
        </IndividualSelectionRecipientModal>
      )}

      {editor === 'history' && (
        <RecipientHistoryModal
          values={examinationValues}
          savedDocument={documentState.active}
          previousTransfusionSuggestion={previousTransfusionSuggestion}
          onChange={updateHistory}
          onClose={() => setEditor(null)}
        />
      )}

      {editor === 'component' && (
        <IndividualSelectionComponentModal
          requiredComponent={draft.requiredComponent}
          quantity={draft.quantity}
          individualSelectionIndications={draft.individualSelectionIndications}
          indicationValues={draft.indicationValues}
          onLocalChange={updateFields}
          onIndicationsChange={updateIndications}
          onClose={() => setEditor(null)}
        />
      )}

      {editorConfig && (
        <RequestEditorModal
          title={editorConfig.title}
          fields={editorConfig.fields}
          values={editorConfig.values}
          onChange={updateFields}
          onClose={() => setEditor(null)}
        />
      )}

      {registryOpen && (
        <RecipientDatabaseModal
          initialList={savedList.initialList}
          initialRecipientId={currentRecipient?.id ?? null}
          initialRecipientName={currentRecipient?.fullName ?? ''}
          onUseRecipient={selectRecipient}
          onOpenIndividualSelectionDirectionRecord={(record, _recipient, mode) => {
            void openSavedDirection(record, mode);
          }}
          onRecipientDeleted={handleRecipientDeleted}
          onRecipientDisconnected={handleRecipientDisconnected}
          onClose={() => setRegistryOpen(false)}
        />
      )}
    </SavedDocumentPage>
  );
};
