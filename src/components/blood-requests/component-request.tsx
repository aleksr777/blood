import { AnimatedMessage } from '../animated-reveal/animated-message';
import { SavedDocumentPage } from '../saved-document/saved-document-page';
import { hasDocumentContent } from '../../domain/document-content';
import { printPageLabel } from '../../domain/print-page-label';
import { savedDocumentTitle } from '../saved-document/saved-document-title';
import { useSavedDocumentList } from '../saved-document/saved-document-list';
import ui from '../../styles/ui';
import { useDocumentState, type SavedDocumentMode } from '../saved-document/use-document-state';
import { cleanComponentRequestDraft } from '../saved-document/working-form-cleanup';
import { usePendingSavedDocument } from '../saved-document/saved-document-navigation';
import { SavedDocumentBar } from '../saved-document/saved-document-bar';
import { updateSavedRequestProfile } from '../saved-document/saved-request-profile';
import { persistLocalDraft } from '../../storage/repositories/local-draft';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { formatObstetricHistory } from '../transfusion-protocol/recipient-history-model';
import { formatRecipientAntigens } from '../transfusion-protocol/recipient-examination-model';
import { ComponentRequestRecipientExamination } from './component-request-recipient-examination';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import { ComponentRequestDetailsModal } from './component-request-details-modal';
import { persistRequestOptions } from './request-saved-options';
import { ComponentRequestForm } from './component-request-form';
import { IndividualSelectionRecipientModal } from './individual-selection-recipient-modal';
import { RequestEditorModal, type RequestEditorField } from './request-editor-modal';
import { restoreRequestDateTime } from './component-request-447n';
import { sanitizeDoseQuantity } from './dose-quantity';
import { restoreRequestDraft } from './request-draft-values';
import {
  readSavedRequestRecordId,
  REQUEST_AUTO_FIELDS,
  type RequestAutoField,
} from './request-common';
import styles from './component-request-page.module.css';

const STORAGE_KEY = 'blood:component-request-direction-draft';
const SAVED_RECORD_ID_STORAGE_KEY = `${STORAGE_KEY}:saved-record-id`;

type DirectionDraft = Record<RequestAutoField, string> & {
  sourceRecipientId: string;
  requiredComponent: string;
  componentAbo: string;
  componentRh: string;
  quantity: string;
  componentCode: string;
  estimatedVolumeMl: string;
  transfusionIndicationCode: string;
  individualSelectionRequired: string;
  individualSelectionCode: string;
  transfusionOrder: string;
  componentSelectionRequirement: string;
  individualSelectionIndications: string;
  medicalOrganization: string;
  directionDate: string;
  departmentPhone: string;
  requestDateTime: string;
  requestDateTimeExplicit: string;
  plannedTransfusionDateTime: string;
  doctorName: string;
  indicationValues: ProtocolValues;
  recipientProfileSnapshot: ProtocolValues;
  autoValues: Partial<Record<RequestAutoField, string>>;
};

type Editor = 'organization' | 'component' | 'recipient' | 'footer' | null;

const ORGANIZATION_FIELDS: RequestEditorField[] = [
  {
    name: 'department',
    label: 'Подразделение медицинской организации',
  },
  {
    name: 'departmentPhone',
    label: 'Контактный телефон подразделения',
    savedOptionsCategory: 'componentRequestDepartmentPhone',
  },
  { name: 'requestDateTime', label: 'Дата и время подачи заявки', type: 'datetime-local' },
  {
    name: 'plannedTransfusionDateTime',
    label: 'Предполагаемые дата и время трансфузии',
    type: 'datetime-local',
  },
  {
    name: 'transfusionOrder',
    label: 'Форма оказания медицинской помощи',
    type: 'select',
    options: [
      { value: 'emergency', label: 'Экстренная или неотложная' },
      { value: 'planned', label: 'Плановая' },
    ],
    wide: true,
  },
];

const FOOTER_FIELDS: RequestEditorField[] = [
  {
    name: 'doctorName',
    label: 'Врач, проводящий трансфузию',
    savedOptionsCategory: 'individualSelectionDoctorName',
    wide: true,
  },
];

const emptyDraft = (): DirectionDraft => ({
  sourceRecipientId: '',
  requiredComponent: '',
  componentAbo: '',
  componentRh: '',
  quantity: '',
  componentCode: '',
  estimatedVolumeMl: '',
  transfusionIndicationCode: '',
  individualSelectionRequired: '',
  individualSelectionCode: '',
  transfusionOrder: '',
  componentSelectionRequirement: '',
  individualSelectionIndications: '',
  recipientAboRh: '',
  recipientPhenotype: '',
  recipientName: '',
  recipientAge: '',
  department: '',
  medicalRecordNumber: '',
  medicalOrganization: '',
  departmentPhone: '',
  requestDateTime: '',
  requestDateTimeExplicit: '',
  plannedTransfusionDateTime: '',
  diagnosis: '',
  obstetricHistory: '',
  recipientSex: '',
  directionDate: '',
  doctorName: '',
  indicationValues: {},
  recipientProfileSnapshot: {},
  autoValues: {},
});

const draftFromRecord = (values: unknown): DirectionDraft => {
  const next = restoreRequestDraft(emptyDraft(), values);
  next.requestDateTime = restoreRequestDateTime(
    next.requestDateTime,
    next.directionDate,
    next.requestDateTimeExplicit,
  );
  next.quantity = sanitizeDoseQuantity(next.quantity);
  const isLegacyRequest =
    values !== null && typeof values === 'object' && !('individualSelectionRequired' in values);
  if (isLegacyRequest) {
    if (next.componentSelectionRequirement === 'individual')
      next.individualSelectionRequired = 'yes';
    if (next.componentSelectionRequirement === 'not-required')
      next.individualSelectionRequired = 'no';
  }
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
): Promise<Partial<Record<RequestAutoField, string>>> => {
  if (!recipient) return {};

  const values: ProtocolValues = {
    ...recipient.profile,
    recipientId: String(recipient.id),
    recipientName: recipient.fullName,
  };

  return {
    recipientAboRh: [values.recipientAbo, values.recipientRh].filter(Boolean).join(' '),
    recipientPhenotype: formatRecipientAntigens(values),
    recipientName: recipient.fullName,
    recipientAge: formatRecipientAge(values.recipientBirthDate),
    department: values.department?.trim() ?? '',
    medicalRecordNumber: values.medicalRecordNumber?.trim() ?? '',
    diagnosis: values.diagnosis?.trim() ?? '',
    obstetricHistory: values.recipientSex === 'Женский' ? formatObstetricHistory(values) : '',
    recipientSex: values.recipientSex?.trim() ?? '',
  };
};

const mergeAutoValues = (
  current: DirectionDraft,
  recipient: CurrentRecipient | null,
  autoValues: Partial<Record<RequestAutoField, string>>,
): DirectionDraft => {
  if (!recipient) return current;

  const next: DirectionDraft = {
    ...current,
    sourceRecipientId: String(recipient.id),
    recipientProfileSnapshot: {
      ...recipient.profile,
      recipientId: String(recipient.id),
      recipientName: recipient.fullName,
    },
    autoValues: { ...autoValues },
  };

  REQUEST_AUTO_FIELDS.forEach((field) => {
    next[field] = autoValues[field] ?? '';
  });

  return next;
};

export const ComponentRequest = () => {
  const [initialStored] = useState(() => ({
    draft: loadDraft(),
    id: readSavedRequestRecordId(STORAGE_KEY),
  }));
  const documentState = useDocumentState<DirectionDraft>(
    () => (initialStored.id === null ? initialStored.draft : emptyDraft()),
    cleanComponentRequestDraft,
  );
  const {
    values: draft,
    setValues: setDraft,
    open: openSavedDocument,
    isActive: hasSavedDocument,
  } = documentState;
  const hasContent = hasDocumentContent('component-request', draft);
  const [editor, setEditorState] = useState<Editor>(null);
  const setEditor = (next: Editor) => {
    if (next === null || !documentState.isReadOnly()) setEditorState(next);
  };
  const [registryOpen, setRegistryOpen] = useState(false);
  const savedList = useSavedDocumentList({
    kind: 'component-request',
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

  useEffect(() => {
    if (initialStored.id === null) return;
    openSavedDocument(
      { id: initialStored.id, recipientId: Number(initialStored.draft.sourceRecipientId) },
      initialStored.draft,
    );
    window.localStorage.removeItem(SAVED_RECORD_ID_STORAGE_KEY);
  }, [initialStored, openSavedDocument]);

  usePendingSavedDocument('component-request', (record, mode) => {
    void openSavedRequest(record, mode);
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
            }
          : current;
      const next = mergeAutoValues(base, recipient, autoValues);

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
    const updates =
      changes.requestDateTime === undefined
        ? changes
        : { ...changes, requestDateTimeExplicit: '1' };
    if (documentState.isActive()) {
      setDraft((current) => {
        const next = { ...current };
        for (const [name, value] of Object.entries(updates)) {
          if (name in next && name !== 'autoValues')
            (next as Record<string, unknown>)[name] = value;
        }
        return updates.department !== undefined
          ? updateSavedRequestProfile(
              next,
              { department: updates.department },
              documentState.record?.createdAt,
            )
          : next;
      });
      return;
    }
    if (updates.department !== undefined && currentRecipient) {
      void updateExamination({ department: updates.department });
    }

    setDraft((current) => {
      const next = { ...current };

      Object.entries(updates).forEach(([name, value]) => {
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
      const indicationValues = {
        ...current.indicationValues,
        ...changes,
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
    if (documentState.isActive() || !hasContent) return;
    const recipient = readCurrentRecipient();
    const autoValues = await currentAutoValues(recipient);
    const next = mergeAutoValues(emptyDraft(), recipient, autoValues);
    setDraft(next);
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
          kind: 'component-request',
          values: { ...draftRef.current },
        });
        await persistRequestOptions(draftRef.current, [...ORGANIZATION_FIELDS, ...FOOTER_FIELDS]);
        documentState.open(record, draftFromRecord(record.values), 'edit');
        documentState.setWorkingValues(cleanComponentRequestDraft);
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
      setStatus('Выберите реципиента перед сохранением заявки.');
      return false;
    }

    try {
      const draftToSave = {
        ...draftRef.current,
        sourceRecipientId: String(recipient.id),
        recipientProfileSnapshot: {
          ...recipient.profile,
          recipientId: String(recipient.id),
          recipientName: recipient.fullName,
        },
      };

      const record = await saveBloodRequestRecord({
        recipientId: recipient.id,
        kind: 'component-request',
        values: { ...draftToSave },
      });
      await persistRequestOptions(draftToSave, [...ORGANIZATION_FIELDS, ...FOOTER_FIELDS]);

      draftRef.current = draftToSave;
      setDraft(draftToSave);
      documentState.open(record, draftToSave, 'edit');
      documentState.setWorkingValues(cleanComponentRequestDraft(draftToSave));
      setStatus('Заявка сохранена.');
      return true;
    } catch (error) {
      console.error('Не удалось сохранить заявку:', error);
      setStatus(error instanceof Error ? error.message : 'Не удалось сохранить заявку.');
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
      console.error('Не удалось выбрать реципиента для заявки:', error);
      return false;
    }
  };

  const openSavedRequest = async (record: BloodRequestRecord, mode: SavedDocumentMode = 'view') => {
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
      clearRecipientLinkedRequestDraft(current, recipientId, 'component-request'),
    );
    setStatus('Реципиент удалён. Связанные с ним данные удалены из текущей заявки.');
  };

  const handleRecipientDisconnected = (recipientId: number) => {
    if (currentRecipient?.id === recipientId) {
      setCurrentRecipient(null);
    }

    if (Number(documentState.workingValues.sourceRecipientId) !== recipientId) return;

    documentState.setWorkingValues((current) =>
      clearRecipientLinkedRequestDraft(current, recipientId, 'component-request'),
    );
    setStatus('Текущий реципиент отключён. Связанные с ним данные удалены из текущей заявки.');
  };

  const examinationValues = useMemo<ProtocolValues>(() => {
    if (currentRecipient && !documentState.active) {
      return {
        ...currentRecipient.profile,
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

  const updateExamination = (changes: ProtocolValues) => {
    if (documentState.isActive()) {
      setDraft((current) =>
        updateSavedRequestProfile(current, changes, documentState.record?.createdAt),
      );
      return Promise.resolve();
    }
    const recipient = readCurrentRecipient();
    if (!recipient) return Promise.resolve();
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
      case 'organization':
        return {
          title: 'Медицинская организация',
          fields: ORGANIZATION_FIELDS,
          values: valuesFor(ORGANIZATION_FIELDS),
        };
      case 'footer':
        return {
          title: 'Подпись врача',
          fields: FOOTER_FIELDS,
          values: valuesFor(FOOTER_FIELDS),
        };
      default:
        return null;
    }
  }, [draft, editor]);

  const printPage = (page: 1 | 2) => {
    const className = `print-component-request-page-${page}`;
    const root = document.documentElement;
    const restorePrintLayout = () => {
      document.body.classList.remove(className);
      delete root.dataset.requestPrintRotated;
      window.removeEventListener('afterprint', restorePrintLayout);
    };
    document.body.classList.add(className);
    root.dataset.requestPrintRotated = 'true';
    window.addEventListener('afterprint', restorePrintLayout);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          window.print();
        } catch (error) {
          restorePrintLayout();
          throw error;
        }
      });
    });
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
            current="component-request"
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
            title={savedDocumentTitle('component-request', draft)}
          />
          <div className="print-actions" aria-label="Панель действий">
            {!documentState.active && (
              <button
                type="button"
                className={`${ui.dangerButton} ${ui.toolbarButton} clear-button`}
                onClick={() => void clear()}
                disabled={!hasContent}
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
            <button
              type="button"
              className={`${ui.primaryButton} ${ui.toolbarButton} print-button`}
              onClick={() => printPage(1)}
            >
              {printPageLabel(1, 2)}
            </button>
            <button
              type="button"
              className={`${ui.primaryButton} ${ui.toolbarButton} print-button`}
              onClick={() => printPage(2)}
            >
              {printPageLabel(2, 2)}
            </button>
          </div>
          <AnimatedMessage message={status} className="toolbar-status" />
        </div>
      </header>

      <ComponentRequestForm
        values={draft}
        examination={examinationValues}
        readOnly={documentState.readOnly}
        onEdit={setEditor}
      />

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
        >
          <ComponentRequestRecipientExamination
            values={examinationValues}
            onChange={updateExamination}
          />
        </IndividualSelectionRecipientModal>
      )}

      {editor === 'component' && (
        <ComponentRequestDetailsModal
          values={draft}
          onChange={updateFields}
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
          onOpenComponentRequestRecord={(record, _recipient, mode) => {
            void openSavedRequest(record, mode);
          }}
          onRecipientDeleted={handleRecipientDeleted}
          onRecipientDisconnected={handleRecipientDisconnected}
          onClose={() => setRegistryOpen(false)}
        />
      )}
    </SavedDocumentPage>
  );
};
