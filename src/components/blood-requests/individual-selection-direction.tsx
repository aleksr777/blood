import { AnimatedMessage } from '../animated-reveal/animated-message';
import { SavedDocumentPage } from '../saved-document/saved-document-page';
import { hasDocumentContent } from '../../domain/document-content';
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
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import {
  readCurrentRecipient,
  switchCurrentRecipient,
  updateCurrentRecipientProfile,
  type CurrentRecipient,
} from '../../storage/repositories/current-recipient';
import {
  currentIndicationsForComponent,
  hasStoredCurrentIndications,
  hasStoredCurrentIndividualSelectionIndications,
  readCurrentIndications,
  readCurrentIndividualSelectionIndications,
  writeCurrentIndications,
  writeCurrentIndividualSelectionIndications,
} from '../../storage/repositories/current-indications';
import { loadProtocolDraft } from '../../storage/repositories/protocol-draft';
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
import { RecipientHistoryModal } from '../transfusion-protocol/recipient-history-modal';
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
import { IndividualSelectionExaminationModal } from './individual-selection-examination-modal';
import { IndividualSelectionRecipientModal } from './individual-selection-recipient-modal';
import { RequestEditorModal, type RequestEditorField } from './request-editor-modal';
import { formatDoseQuantity, sanitizeDoseQuantity } from './dose-quantity';
import { normalizeDirectionIndications } from './direction-indications';
import { useFormPages } from './use-form-pages';
import { AdaptiveRuledField } from './adaptive-ruled-field';
import styles from './individual-selection-direction.module.css';

const STORAGE_KEY = 'blood:individual-selection-direction-draft';
const SAVED_RECORD_ID_STORAGE_KEY = `${STORAGE_KEY}:saved-record-id`;

const loadSavedRecordId = () => {
  try {
    const raw = window.localStorage.getItem(SAVED_RECORD_ID_STORAGE_KEY);
    if (!raw) return null;

    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
};

type AutoField =
  | 'recipientAboRh'
  | 'recipientPhenotype'
  | 'recipientName'
  | 'recipientAge'
  | 'department'
  | 'medicalRecordNumber'
  | 'diagnosis'
  | 'obstetricHistory'
  | 'recipientSex';

type DirectionDraft = Record<AutoField, string> & {
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
  autoValues: Partial<Record<AutoField, string>>;
};

type Editor =
  'organization' | 'component' | 'examination' | 'recipient' | 'history' | 'footer' | null;

const AUTO_FIELDS: AutoField[] = [
  'recipientAboRh',
  'recipientPhenotype',
  'recipientName',
  'recipientAge',
  'department',
  'medicalRecordNumber',
  'diagnosis',
  'obstetricHistory',
  'recipientSex',
];

const ORGANIZATION_FIELDS: RequestEditorField[] = [
  {
    name: 'medicalOrganization',
    label: 'Наименование ЛПУ',
    savedOptionsCategory: 'medicalOrganization',
    wide: true,
  },
  { name: 'department', label: 'Отделение', wide: true },
];

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
  sourceRecipientId: '',
  requiredComponent: '',
  quantity: '',
  individualSelectionIndications: '',
  recipientAboRh: '',
  recipientPhenotype: '',
  recipientName: '',
  recipientAge: '',
  department: '',
  medicalRecordNumber: '',
  medicalOrganization: '',
  diagnosis: '',
  transfusionHistory: '',
  obstetricHistory: '',
  recipientSex: '',
  directionDate: '',
  doctorName: '',
  doctorPhone: '',
  indicationValues: normalizeDirectionIndications(),
  recipientProfileSnapshot: {},
  autoValues: {},
});

const loadDraft = (): DirectionDraft => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDraft();

    const parsed = JSON.parse(raw) as Partial<DirectionDraft>;
    const blank = emptyDraft();
    const savedValues = Object.fromEntries(
      Object.keys(blank).flatMap((key) => {
        if (
          key === 'autoValues' ||
          key === 'indicationValues' ||
          key === 'recipientProfileSnapshot'
        ) {
          return [];
        }
        const value = parsed[key as keyof DirectionDraft];
        return typeof value === 'string' ? [[key, value]] : [];
      }),
    );
    const next = {
      ...blank,
      ...savedValues,
      indicationValues:
        parsed.indicationValues &&
        typeof parsed.indicationValues === 'object' &&
        !Array.isArray(parsed.indicationValues)
          ? Object.fromEntries(
              Object.entries(parsed.indicationValues).filter(
                (entry): entry is [string, string] => typeof entry[1] === 'string',
              ),
            )
          : {},
      recipientProfileSnapshot:
        parsed.recipientProfileSnapshot &&
        typeof parsed.recipientProfileSnapshot === 'object' &&
        !Array.isArray(parsed.recipientProfileSnapshot)
          ? Object.fromEntries(
              Object.entries(parsed.recipientProfileSnapshot).filter(
                (entry): entry is [string, string] => typeof entry[1] === 'string',
              ),
            )
          : {},
      autoValues:
        parsed.autoValues &&
        typeof parsed.autoValues === 'object' &&
        !Array.isArray(parsed.autoValues)
          ? Object.fromEntries(
              Object.entries(parsed.autoValues).filter(
                (entry): entry is [string, string] => typeof entry[1] === 'string',
              ),
            )
          : {},
    } as DirectionDraft;

    next.recipientProfileSnapshot = restoreDirectionHistory(
      next.recipientProfileSnapshot,
      next.transfusionHistory,
    );
    next.quantity = sanitizeDoseQuantity(next.quantity);
    next.indicationValues = normalizeDirectionIndications(
      next.indicationValues,
      next.requiredComponent,
    );
    return next;
  } catch {
    return emptyDraft();
  }
};

const draftFromRecord = (values: Record<string, unknown>): DirectionDraft => {
  const blank = emptyDraft();
  const savedValues = Object.fromEntries(
    Object.keys(blank).flatMap((key) => {
      if (
        key === 'autoValues' ||
        key === 'indicationValues' ||
        key === 'recipientProfileSnapshot'
      ) {
        return [];
      }
      const value = values[key];
      return typeof value === 'string' ? [[key, value]] : [];
    }),
  );

  const indicationValues =
    values.indicationValues &&
    typeof values.indicationValues === 'object' &&
    !Array.isArray(values.indicationValues)
      ? Object.fromEntries(
          Object.entries(values.indicationValues).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        )
      : {};

  const autoValues =
    values.autoValues && typeof values.autoValues === 'object' && !Array.isArray(values.autoValues)
      ? Object.fromEntries(
          Object.entries(values.autoValues).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        )
      : {};

  const next = {
    ...blank,
    ...savedValues,
    indicationValues: normalizeDirectionIndications(
      indicationValues,
      savedValues.requiredComponent,
    ),
    recipientProfileSnapshot:
      values.recipientProfileSnapshot &&
      typeof values.recipientProfileSnapshot === 'object' &&
      !Array.isArray(values.recipientProfileSnapshot)
        ? Object.fromEntries(
            Object.entries(values.recipientProfileSnapshot).filter(
              (entry): entry is [string, string] => typeof entry[1] === 'string',
            ),
          )
        : {},
    autoValues,
  } as DirectionDraft;

  next.recipientProfileSnapshot = restoreDirectionHistory(
    next.recipientProfileSnapshot,
    next.transfusionHistory,
  );
  next.quantity = sanitizeDoseQuantity(next.quantity);
  return next;
};

const currentAutoValues = async (
  recipient: CurrentRecipient | null,
): Promise<{
  autoValues: Partial<Record<AutoField, string>>;
  recipientProfileSnapshot: ProtocolValues;
}> => {
  if (!recipient) return { autoValues: {}, recipientProfileSnapshot: {} };

  const protocolDraft = await loadProtocolDraft();
  const sameRecipient = Number(protocolDraft.values.recipientId) === recipient.id;
  const currentProtocolValues = sameRecipient ? protocolDraft.values : {};

  const values: ProtocolValues = {
    ...currentProtocolValues,
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

  AUTO_FIELDS.forEach((field) => {
    next[field] = autoValues[field] ?? '';
  });

  return next;
};

const activateOnKeyboard = (event: KeyboardEvent<HTMLElement>, action: () => void) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
};

const formatDirectionDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return '';

  return `${match[3]}.${match[2]}.${match[1]}`;
};

export const IndividualSelectionDirection = () => {
  const [initialStored] = useState(() => ({ draft: loadDraft(), id: loadSavedRecordId() }));
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
      const protocolDraft = recipient ? await loadProtocolDraft() : null;
      const currentProtocolValues =
        recipient && protocolDraft && Number(protocolDraft.values.recipientId) === recipient.id
          ? protocolDraft.values
          : {};

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
      let next = mergeAutoValues(base, recipient, autoValues);
      next.recipientProfileSnapshot = {
        ...next.recipientProfileSnapshot,
        ...generatedDirectionHistory(base.recipientProfileSnapshot),
      };
      const component = getIndicationComponent(next.indicationValues);
      if (recipient) {
        if (hasStoredCurrentIndividualSelectionIndications(recipient.id)) {
          next = {
            ...next,
            individualSelectionIndications: readCurrentIndividualSelectionIndications(recipient.id),
          };
        } else if (recipientChanged) {
          next = {
            ...next,
            individualSelectionIndications: '',
          };
        } else if (!hasSavedDocument() && next.individualSelectionIndications.trim()) {
          writeCurrentIndividualSelectionIndications(
            recipient.id,
            next.individualSelectionIndications,
          );
        }

        if (hasStoredCurrentIndications(recipient.id, component)) {
          next = {
            ...next,
            indicationValues: {
              ...(recipientChanged ? {} : next.indicationValues),
              ...readCurrentIndications(recipient.id, component),
              componentGroup: component,
              indicationComponent: component,
            },
          };
        } else {
          const protocolIndications = currentIndicationsForComponent(
            currentProtocolValues,
            component,
          );
          const hasProtocolIndications = Object.entries(protocolIndications).some(
            ([key, value]) => key !== 'indicationComponent' && value.trim() !== '',
          );

          if (hasProtocolIndications) {
            writeCurrentIndications(recipient.id, component, protocolIndications);
            next = {
              ...next,
              indicationValues: {
                ...(recipientChanged ? {} : next.indicationValues),
                ...protocolIndications,
                componentGroup: component,
                indicationComponent: component,
              },
            };
          } else if (!hasSavedDocument() && !recipientChanged) {
            writeCurrentIndications(recipient.id, component, next.indicationValues);
          } else if (recipientChanged) {
            next = {
              ...next,
              indicationValues: normalizeDirectionIndications({ indicationComponent: component }),
            };
          }
        }
      }

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

    if (currentRecipient && changes.individualSelectionIndications !== undefined) {
      writeCurrentIndividualSelectionIndications(
        currentRecipient.id,
        changes.individualSelectionIndications,
      );
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
      const component = changes.componentGroup || changes.indicationComponent || currentComponent;
      const sharedIndications =
        !documentState.isActive() && currentRecipient && component !== currentComponent
          ? readCurrentIndications(currentRecipient.id, component)
          : {};
      const indicationValues = {
        ...current.indicationValues,
        ...sharedIndications,
        ...changes,
        componentGroup: component,
        indicationComponent: component,
      };

      if (!documentState.isActive() && currentRecipient) {
        writeCurrentIndications(currentRecipient.id, component, indicationValues);
      }

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
    const sharedIndividualSelectionIndications =
      recipient && hasStoredCurrentIndividualSelectionIndications(recipient.id)
        ? readCurrentIndividualSelectionIndications(recipient.id)
        : '';

    setDraft({
      ...(recipient && hasStoredCurrentIndications(recipient.id, 'erythrocytes')
        ? {
            ...next,
            indicationValues: {
              ...readCurrentIndications(recipient.id, 'erythrocytes'),
              componentGroup: 'erythrocytes',
              indicationComponent: 'erythrocytes',
            },
          }
        : next),
      individualSelectionIndications: sharedIndividualSelectionIndications,
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
            profile: { ...current.profile, ...changes },
          }
        : current,
    );

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

  const handleHistoryHover = (event: MouseEvent<HTMLDivElement>) => {
    const hovered =
      !documentState.readOnly &&
      event.target instanceof Element &&
      event.target.closest('[data-history-group]');
    if (hovered) event.currentTarget.dataset.historyHovered = 'true';
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
      case 'organization':
        return {
          title: 'Медицинская организация',
          fields: ORGANIZATION_FIELDS,
          values: valuesFor(ORGANIZATION_FIELDS),
        };
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

  const formSections = [
    <div
      key="organization"
      className={styles.fillSection}
      data-form-section
      role={documentState.readOnly ? undefined : 'button'}
      tabIndex={documentState.readOnly ? -1 : 0}
      onClick={() => setEditor('organization')}
      onKeyDown={(event) => activateOnKeyboard(event, () => setEditor('organization'))}
    >
      <AdaptiveRuledField label="Наименование ЛПУ:" value={draft.medicalOrganization} />
      <AdaptiveRuledField label="Отделение:" value={draft.department} />
    </div>,

    <div
      key="recipient"
      className={styles.fillSection}
      data-form-section
      role={documentState.readOnly ? undefined : 'button'}
      tabIndex={documentState.readOnly ? -1 : 0}
      onClick={() => setEditor('recipient')}
      onKeyDown={(event) => activateOnKeyboard(event, () => setEditor('recipient'))}
    >
      <AdaptiveRuledField label="Ф.И.О. реципиента:" value={draft.recipientName} />
      <AdaptiveRuledField label="Возраст:" value={draft.recipientAge} />
      <AdaptiveRuledField label="№ медицинской карты:" value={draft.medicalRecordNumber} />
      <AdaptiveRuledField label="Диагноз:" value={draft.diagnosis} />
    </div>,

    <div
      key="examination"
      className={styles.fillSection}
      data-form-section
      role={documentState.readOnly ? undefined : 'button'}
      tabIndex={documentState.readOnly ? -1 : 0}
      onClick={() => setEditor('examination')}
      onKeyDown={(event) => activateOnKeyboard(event, () => setEditor('examination'))}
    >
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
            : index === TRANSFUSION_HISTORY_FIELDS.length - 1
              ? 'last'
              : 'middle'
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
            className={styles.fillSection}
            data-form-section
            role={documentState.readOnly ? undefined : 'button'}
            tabIndex={documentState.readOnly ? -1 : 0}
            onClick={() => setEditor('history')}
            onKeyDown={(event) => activateOnKeyboard(event, () => setEditor('history'))}
          >
            <AdaptiveRuledField
              label="Акушерский анамнез у женщин:"
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
        value={draft.requiredComponent}
      />
      <AdaptiveRuledField label="Количество:" value={formatDoseQuantity(draft.quantity)} />
      <AdaptiveRuledField
        label="Показания к трансфузии:"
        value={formatIndications(draft.indicationValues)}
      />
      <AdaptiveRuledField
        label="Показания для индивидуального подбора:"
        value={draft.individualSelectionIndications}
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
    formatIndications(draft.indicationValues),
    ...TRANSFUSION_HISTORY_FIELDS.map(({ statusName, textName }) =>
      formatHistoryValue(examinationValues, statusName, textName),
    ),
    draft.transfusionHistory,
    draft.recipientSex,
    formatObstetricHistory(examinationValues),
    draft.obstetricHistory,
    draft.requiredComponent,
    draft.quantity,
    draft.individualSelectionIndications,
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
            {pageStarts.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`${ui.primaryButton} ${ui.toolbarButton} print-button`}
                onClick={() => printPage(index + 1)}
              >
                {pageStarts.length > 1 ? `Печать страницы ${index + 1}` : 'Печать страницы'}
              </button>
            ))}
          </div>
          <AnimatedMessage message={status} className="toolbar-status" />
        </div>
      </header>

      <div
        className={styles.sheetWrap}
        data-document-paper
        onMouseMove={handleHistoryHover}
        onMouseLeave={(event) => {
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
        />
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

      {editor === 'examination' && (
        <IndividualSelectionExaminationModal
          values={examinationValues}
          onChange={updateExamination}
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
