import { AnimatedMessage } from '../animated-reveal/animated-message';
import { SavedDocumentPage } from '../saved-document/saved-document-page';
import { savedDocumentTitle } from '../saved-document/saved-document-title';
import ui from '../../styles/ui';
import { useDocumentState, type SavedDocumentMode } from '../saved-document/use-document-state';
import { usePendingSavedDocument } from '../saved-document/saved-document-navigation';
import { SavedDocumentBar } from '../saved-document/saved-document-bar';
import { updateSavedRequestProfile } from '../saved-document/saved-request-profile';
import { WarningNotice } from '../warning-notice/warning-notice';
import { persistLocalDraft } from '../../storage/repositories/local-draft';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
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
import { getBloodGroupMismatch } from '../transfusion-protocol/blood-group-validation';
import { formatRecipientAge } from '../transfusion-protocol/recipient-demographics';
import { formatObstetricHistory } from '../transfusion-protocol/recipient-history-model';
import {
  formatAlloimmuneAntibodies,
  formatRecipientAntigens,
} from '../transfusion-protocol/recipient-examination-model';
import {
  formatIndications,
  getIndicationComponent,
} from '../transfusion-protocol/indications-model';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import { IndividualSelectionComponentModal } from './individual-selection-component-modal';
import { IndividualSelectionExaminationModal } from './individual-selection-examination-modal';
import { IndividualSelectionObstetricHistoryModal } from './individual-selection-obstetric-history-modal';
import { IndividualSelectionRecipientModal } from './individual-selection-recipient-modal';
import { RequestEditorModal, type RequestEditorField } from './request-editor-modal';
import { formatDoseQuantity, sanitizeDoseQuantity } from './dose-quantity';
import { AdaptiveRuledField } from './adaptive-ruled-field';
import { hasStructuredObstetricHistory } from './direction-history';
import styles from './individual-selection-direction.module.css';

const STORAGE_KEY = 'blood:component-request-direction-draft';
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

const TRANSFUSION_ORDER_TEXT: Record<string, string> = {
  planned: 'плановая',
  emergency: 'экстренная',
};

const COMPONENT_SELECTION_REQUIREMENT_TEXT: Record<string, string> = {
  'not-required': 'индивидуальный подбор и подбор по фенотипу не требуется',
  phenotype: 'требуется подбор по фенотипу',
  individual: 'требуется индивидуальный подбор',
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
  requiredComponent: string;
  componentAbo: string;
  componentRh: string;
  quantity: string;
  transfusionOrder: string;
  componentSelectionRequirement: string;
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
  'organization' | 'component' | 'examination' | 'recipient' | 'obstetric' | 'footer' | null;

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
  componentAbo: '',
  componentRh: '',
  quantity: '',
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
  diagnosis: '',
  obstetricHistory: '',
  recipientSex: '',
  directionDate: '',
  doctorName: '',
  doctorPhone: '',
  indicationValues: {},
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

    next.quantity = sanitizeDoseQuantity(next.quantity);
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
    indicationValues,
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

  next.quantity = sanitizeDoseQuantity(next.quantity);
  return next;
};

const currentAutoValues = async (
  recipient: CurrentRecipient | null,
): Promise<Partial<Record<AutoField, string>>> => {
  if (!recipient) return {};

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
  autoValues: Partial<Record<AutoField, string>>,
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

export const ComponentRequest = () => {
  const [initialStored] = useState(() => ({ draft: loadDraft(), id: loadSavedRecordId() }));
  const documentState = useDocumentState<DirectionDraft>(() =>
    initialStored.id === null ? initialStored.draft : emptyDraft(),
  );
  const {
    values: draft,
    setValues: setDraft,
    open: openSavedDocument,
    isActive: hasSavedDocument,
  } = documentState;
  const [editor, setEditorState] = useState<Editor>(null);
  const setEditor = (next: Editor) => {
    if (next === null || !documentState.isReadOnly()) setEditorState(next);
  };
  const [registryOpen, setRegistryOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [dismissedBloodGroupWarningKey, setDismissedBloodGroupWarningKey] = useState('');
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

        const component = getIndicationComponent(next.indicationValues);
        if (component) {
          if (hasStoredCurrentIndications(recipient.id, component)) {
            next = {
              ...next,
              indicationValues: {
                ...(recipientChanged ? {} : next.indicationValues),
                ...readCurrentIndications(recipient.id, component),
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
                },
              };
            } else if (!hasSavedDocument() && !recipientChanged) {
              writeCurrentIndications(recipient.id, component, next.indicationValues);
            } else if (recipientChanged) {
              next = {
                ...next,
                indicationValues: { indicationComponent: component },
              };
            }
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
      const component = changes.indicationComponent || currentComponent;
      const componentChanged =
        Boolean(changes.indicationComponent) && changes.indicationComponent !== currentComponent;
      const sharedIndications =
        !documentState.isActive() && currentRecipient && componentChanged && component
          ? readCurrentIndications(currentRecipient.id, component)
          : {};
      const indicationValues = {
        ...current.indicationValues,
        ...sharedIndications,
        ...changes,
      };

      if (!documentState.isActive() && currentRecipient && component) {
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
    if (documentState.isActive()) return;
    const recipient = readCurrentRecipient();
    const autoValues = await currentAutoValues(recipient);
    const next = mergeAutoValues(emptyDraft(), recipient, autoValues);
    setDraft({
      ...next,
      individualSelectionIndications:
        recipient && hasStoredCurrentIndividualSelectionIndications(recipient.id)
          ? readCurrentIndividualSelectionIndications(recipient.id)
          : '',
    });
    setStatus('');
  };

  const save = async (afterPrint = false) => {
    if (documentState.active) {
      if (afterPrint || !documentState.editing || !documentState.record) return true;
      try {
        const record = await saveBloodRequestRecord({
          recordId: documentState.record.id,
          recipientId: documentState.record.recipientId,
          kind: 'component-request',
          values: { ...draftRef.current },
        });
        documentState.open(record, draftFromRecord(record.values));
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

      draftRef.current = draftToSave;
      setDraft(draftToSave);
      documentState.open(record, draftToSave);
      documentState.setWorkingValues({
        ...emptyDraft(),
        medicalOrganization: draftToSave.medicalOrganization,
        doctorName: draftToSave.doctorName,
        doctorPhone: draftToSave.doctorPhone,
      });
      setStatus(afterPrint ? 'Заявка сохранена после печати.' : 'Заявка сохранена.');
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
      console.error('Не удалось выбрать реципиента для направления:', error);
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

  const bloodGroupMismatch = getBloodGroupMismatch({
    ...examinationValues,
    donorAbo: draft.componentAbo,
    donorRh: draft.componentRh,
  });

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

  const selectedComponent = getIndicationComponent(draft.indicationValues);
  const isErythrocytes = selectedComponent === 'erythrocytes';
  const requiresIndividualSelection =
    isErythrocytes && draft.componentSelectionRequirement === 'individual';
  const transfusionOrderText = TRANSFUSION_ORDER_TEXT[draft.transfusionOrder] ?? '';
  const componentSelectionRequirementText =
    COMPONENT_SELECTION_REQUIREMENT_TEXT[draft.componentSelectionRequirement] ?? '';

  const formSections = [
    <div
      key="organization"
      className={styles.fillSection}
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

    ...(draft.recipientSex === 'Женский'
      ? [
          <div
            key="obstetric"
            className={styles.fillSection}
            role={documentState.readOnly ? undefined : 'button'}
            tabIndex={documentState.readOnly ? -1 : 0}
            onClick={() => setEditor('obstetric')}
            onKeyDown={(event) => activateOnKeyboard(event, () => setEditor('obstetric'))}
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
      role={documentState.readOnly ? undefined : 'button'}
      tabIndex={documentState.readOnly ? -1 : 0}
      onClick={() => setEditor('component')}
      onKeyDown={(event) => activateOnKeyboard(event, () => setEditor('component'))}
    >
      <AdaptiveRuledField
        label="Наименование требуемого компонента:"
        value={draft.requiredComponent}
      />
      <AdaptiveRuledField
        label="Группа крови и резус-фактор компонента:"
        value={[draft.componentAbo, draft.componentRh].filter(Boolean).join(' ')}
      />
      <AdaptiveRuledField label="Количество:" value={formatDoseQuantity(draft.quantity)} />
      <AdaptiveRuledField label="Порядок трансфузии:" value={transfusionOrderText} />
      <AdaptiveRuledField
        label="Показания к трансфузии:"
        value={formatIndications(draft.indicationValues)}
      />
      {isErythrocytes && componentSelectionRequirementText && (
        <AdaptiveRuledField label="" value={componentSelectionRequirementText} />
      )}
      {requiresIndividualSelection && (
        <AdaptiveRuledField
          label="Показания для индивидуального подбора:"
          value={draft.individualSelectionIndications}
        />
      )}
    </div>,

    <div
      key="footer"
      className={`${styles.fillSection} ${styles.footerSection}`}
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

  const printPage = (page: 1 | 2) => {
    const className = `print-individual-selection-page-${page}`;
    document.body.classList.add(className);

    try {
      window.print();
    } finally {
      document.body.classList.remove(className);
      if (!documentState.active) void save(true);
    }
  };

  return (
    <SavedDocumentPage className={styles.shell} mode={documentState.mode}>
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
          />
          <SavedDocumentBar
            document={documentState}
            title={savedDocumentTitle('component-request', draft)}
          />
          <div className="print-actions" aria-label="Панель действий">
            {!documentState.active && (
              <button
                type="button"
                className={`${ui.dangerButton} ${ui.toolbarButton} clear-button`}
                onClick={() => void clear()}
              >
                Очистить бланк
              </button>
            )}
            <button
              type="button"
              className={`${ui.secondaryButton} ${ui.toolbarButton} secondary-button`}
              onClick={() => setRegistryOpen(true)}
            >
              Реципиенты
            </button>
            <button
              type="button"
              className={`${ui.successButton} ${ui.toolbarButton} save-button`}
              onClick={() => void save()}
              disabled={documentState.readOnly}
            >
              {documentState.editing ? 'Сохранить изменения' : 'Сохранить'}
            </button>
            <button
              type="button"
              className={`${ui.primaryButton} ${ui.toolbarButton} print-button`}
              onClick={() => printPage(1)}
            >
              Печать страницы 1
            </button>
            <button
              type="button"
              className={`${ui.primaryButton} ${ui.toolbarButton} print-button`}
              onClick={() => printPage(2)}
            >
              Печать страницы 2
            </button>
          </div>
          <AnimatedMessage message={status} className="toolbar-status" />
          <WarningNotice
            className="toolbar-blood-group-warning"
            message={bloodGroupWarning}
            onDismiss={dismissBloodGroupWarning}
          />
        </div>
      </header>

      <div className={styles.sheetWrap} data-document-paper>
        <section
          className={`${styles.sheet} ${styles.pageOne}`}
          aria-label="Заявка в трансфузиологический кабинет, страница 1"
        >
          <div className={styles.pageContent}>
            <h1 className={styles.title}>
              Заявка в трансфузиологический кабинет на компоненты крови.
            </h1>

            {formSections}
          </div>
        </section>

        <section
          className={`${styles.sheet} ${styles.pageTwo} ${styles.issuedPage}`}
          aria-label="Выдано из трансфузиологического кабинета, страница 2"
        >
          <div className={styles.issuedContent}>
            <h2 className={styles.issuedTitle}>Выдано из трансфузиологического кабинета</h2>

            <table className={styles.issuedTable}>
              <colgroup>
                <col style={{ width: '2%' }} />
                <col style={{ width: '22.5%' }} />
                <col style={{ width: '6.3%' }} />
                <col style={{ width: '6.1%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '5.5%' }} />
                <col style={{ width: '7.3%' }} />
                <col style={{ width: '7.3%' }} />
                <col style={{ width: '7.3%' }} />
                <col style={{ width: '7.3%' }} />
                <col style={{ width: '16.4%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>№</th>
                  <th>Наименование компонента донорской крови</th>
                  <th>Группа крови донора</th>
                  <th>Резус-принадлежность</th>
                  <th>Фенотип донора</th>
                  <th>Объем (мл)</th>
                  <th>№ контейнера</th>
                  <th>Код донора</th>
                  <th>Дата заготовки</th>
                  <th>Срок годности</th>
                  <th>Изготовитель</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }, (_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 11 }, (_, cellIndex) => (
                      <td key={cellIndex}>&nbsp;</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.issuedFooter}>
              <div className={styles.issuedFooterRow}>
                <span className={styles.issuedFooterLabel}>Дата:</span>
                <span className={styles.issuedDateLine} />
              </div>
              <div className={styles.issuedFooterRow}>
                <span className={styles.issuedFooterLabel}>Получил компоненты крови:</span>
                <span className={styles.issuedSignatureLine} />
              </div>
              <div className={styles.issuedFooterRow}>
                <span className={styles.issuedFooterLabel}>Выдал компоненты крови:</span>
                <span className={styles.issuedSignatureLine} />
              </div>
            </div>
          </div>
        </section>
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

      {editor === 'obstetric' && draft.recipientSex === 'Женский' && (
        <IndividualSelectionObstetricHistoryModal
          values={examinationValues}
          onChange={updateExamination}
          onClose={() => setEditor(null)}
        />
      )}

      {editor === 'component' && (
        <IndividualSelectionComponentModal
          requiredComponent={draft.requiredComponent}
          componentAbo={draft.componentAbo}
          componentRh={draft.componentRh}
          quantity={draft.quantity}
          transfusionOrder={draft.transfusionOrder}
          componentSelectionRequirement={draft.componentSelectionRequirement}
          individualSelectionIndications={draft.individualSelectionIndications}
          indicationValues={draft.indicationValues}
          showRequestOptions
          bloodGroupWarning={bloodGroupWarning}
          onDismissBloodGroupWarning={dismissBloodGroupWarning}
          onLocalChange={updateFields}
          onIndicationsChange={updateIndications}
          onClose={() => setEditor(null)}
        />
      )}

      {editor === 'examination' && (
        <IndividualSelectionExaminationModal
          values={examinationValues}
          bloodGroupWarning={bloodGroupWarning}
          onDismissBloodGroupWarning={dismissBloodGroupWarning}
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
