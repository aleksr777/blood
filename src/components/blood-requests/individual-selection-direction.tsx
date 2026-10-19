import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
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
  HISTORY_STATUS,
  getHistoryStatus,
} from '../transfusion-protocol/recipient-history-model';
import { formatIndications } from '../transfusion-protocol/indications-model';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import { IndividualSelectionComponentModal } from './individual-selection-component-modal';
import { IndividualSelectionExaminationModal } from './individual-selection-examination-modal';
import { IndividualSelectionObstetricHistoryModal } from './individual-selection-obstetric-history-modal';
import { IndividualSelectionRecipientModal } from './individual-selection-recipient-modal';
import { IndividualSelectionTransfusionHistoryModal } from './individual-selection-transfusion-history-modal';
import {
  RequestEditorModal,
  type RequestEditorField,
} from './request-editor-modal';
import { formatDoseQuantity, sanitizeDoseQuantity } from './dose-quantity';
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

const DEFAULT_MEDICAL_ORGANIZATION =
  'ФБУЗ "Медико-санитарная часть №32" ФМБА России, г. Заречный.';

type AutoField =
  | 'recipientAboRh'
  | 'recipientPhenotype'
  | 'recipientName'
  | 'recipientAge'
  | 'department'
  | 'medicalRecordNumber'
  | 'diagnosis'
  | 'transfusionHistory'
  | 'obstetricHistory'
  | 'recipientSex';

type DirectionDraft = Record<AutoField, string> & {
  sourceRecipientId: string;
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
  | 'organization'
  | 'component'
  | 'examination'
  | 'recipient'
  | 'transfusion'
  | 'obstetric'
  | 'footer'
  | null;

const AUTO_FIELDS: AutoField[] = [
  'recipientAboRh',
  'recipientPhenotype',
  'recipientName',
  'recipientAge',
  'department',
  'medicalRecordNumber',
  'diagnosis',
  'transfusionHistory',
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
  medicalOrganization: DEFAULT_MEDICAL_ORGANIZATION,
  diagnosis: '',
  transfusionHistory: '',
  obstetricHistory: '',
  recipientSex: '',
  directionDate: '',
  doctorName: '',
  doctorPhone: '',
  indicationValues: { indicationComponent: 'erythrocytes' },
  recipientProfileSnapshot: {},
  autoValues: {},
});

const todayKey = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const loadDraft = (): DirectionDraft => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...emptyDraft(), directionDate: todayKey() };

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

    if (!next.directionDate) next.directionDate = todayKey();
    next.quantity = sanitizeDoseQuantity(next.quantity);
    next.indicationValues = {
      ...next.indicationValues,
      indicationComponent: 'erythrocytes',
    };
    return next;
  } catch {
    return { ...emptyDraft(), directionDate: todayKey() };
  }
};

const draftFromRecord = (
  values: Record<string, unknown>,
): DirectionDraft => {
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
    values.autoValues &&
    typeof values.autoValues === 'object' &&
    !Array.isArray(values.autoValues)
      ? Object.fromEntries(
          Object.entries(values.autoValues).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        )
      : {};

  const next = {
    ...blank,
    ...savedValues,
    indicationValues: {
      ...indicationValues,
      indicationComponent: 'erythrocytes',
    },
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

  if (!next.directionDate) next.directionDate = todayKey();
  next.quantity = sanitizeDoseQuantity(next.quantity);
  return next;
};

const formatObstetricHistory = (values: ProtocolValues) => {
  const items = [
    ['беременности', values.recipientPregnanciesCount],
    ['роды', values.recipientBirthsCount],
    ['самопроизвольные аборты', values.recipientSpontaneousAbortionsCount],
    [
      'гемолитическая болезнь новорождённого',
      values.recipientHemolyticDiseaseNewbornHistory,
    ],
  ] as const;

  return items
    .filter(([, value]) => Boolean(value?.trim()))
    .map(([label, value]) => `${label}: ${value?.trim()}`)
    .join('; ');
};

const formatTransfusionHistory = (values: ProtocolValues) => {
  const parts: string[] = [];

  const previousStatus = getHistoryStatus(
    values.previousTransfusionsStatus,
    values.previousTransfusions,
  );
  if (previousStatus === HISTORY_STATUS.none) {
    parts.push('Трансфузий не было.');
  } else if (previousStatus === HISTORY_STATUS.unknown) {
    parts.push('Не известно.');
  } else if (
    previousStatus === HISTORY_STATUS.had &&
    values.previousTransfusions?.trim()
  ) {
    parts.push(`Трансфузии: ${values.previousTransfusions.trim()}`);
  }

  const reactionsStatus = getHistoryStatus(
    values.previousReactionsStatus,
    values.previousReactions,
  );
  if (reactionsStatus === HISTORY_STATUS.none) {
    parts.push('Реакции и осложнения: не было');
  } else if (reactionsStatus === HISTORY_STATUS.unknown) {
    parts.push('Реакции и осложнения: не известно');
  } else if (reactionsStatus === HISTORY_STATUS.had && values.previousReactions?.trim()) {
    parts.push(`Реакции и осложнения: ${values.previousReactions.trim()}`);
  }

  const selectionStatus = getHistoryStatus(
    values.individualSelectionHistoryStatus,
    values.individualSelectionHistory,
  );
  if (selectionStatus === HISTORY_STATUS.none) {
    parts.push('Индивидуальный подбор: не проводился');
  } else if (selectionStatus === HISTORY_STATUS.unknown) {
    parts.push('Индивидуальный подбор: не известно');
  } else if (
    selectionStatus === HISTORY_STATUS.had &&
    values.individualSelectionHistory?.trim()
  ) {
    parts.push(`Индивидуальный подбор: ${values.individualSelectionHistory.trim()}`);
  }

  return parts.join('; ');
};

const currentAutoValues = async (
  recipient: CurrentRecipient | null,
): Promise<Partial<Record<AutoField, string>>> => {
  if (!recipient) return {};

  const protocolDraft = await loadProtocolDraft();
  const sameRecipient =
    Number(protocolDraft.values.recipientId) === recipient.id;
  const currentProtocolValues =
    sameRecipient && protocolDraft.protocolRecordId === null
      ? protocolDraft.values
      : {};

  const values: ProtocolValues = {
    ...recipient.profile,
    recipientId: String(recipient.id),
    recipientName: recipient.fullName,
    ...currentProtocolValues,
  };

  return {
    recipientAboRh: [values.recipientAbo, values.recipientRh]
      .filter(Boolean)
      .join(' '),
    recipientPhenotype: formatRecipientAntigens(values),
    recipientName: recipient.fullName,
    recipientAge: formatRecipientAge(values.recipientBirthDate),
    department: values.department?.trim() ?? '',
    medicalRecordNumber: values.medicalRecordNumber?.trim() ?? '',
    diagnosis: values.diagnosis?.trim() ?? '',
    transfusionHistory: formatTransfusionHistory(values),
    obstetricHistory:
      values.recipientSex === 'Женский' ? formatObstetricHistory(values) : '',
    recipientSex: values.recipientSex?.trim() ?? '',
  };
};

const mergeAutoValues = (
  current: DirectionDraft,
  recipient: CurrentRecipient | null,
  autoValues: Partial<Record<AutoField, string>>,
): DirectionDraft => {
  if (!recipient) return current;

  const recipientChanged = current.sourceRecipientId !== String(recipient.id);
  const next: DirectionDraft = {
    ...current,
    sourceRecipientId: String(recipient.id),
    autoValues: { ...autoValues },
  };

  AUTO_FIELDS.forEach((field) => {
    const currentValue = current[field] ?? '';
    const previousAuto = current.autoValues[field] ?? '';

    if (recipientChanged || !currentValue || currentValue === previousAuto) {
      next[field] = autoValues[field] ?? '';
    }
  });

  return next;
};

const activateOnKeyboard = (
  event: KeyboardEvent<HTMLElement>,
  action: () => void,
) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
};

const displayValue = (value?: string) => value?.trim() || ' ';

type AdaptiveRuledFieldProps = {
  label: string;
  value: string;
  minRows?: number;
};

const AdaptiveRuledField = ({
  label,
  value,
  minRows = 1,
}: AdaptiveRuledFieldProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const inlineMeasureRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [breakBeforeValue, setBreakBeforeValue] = useState(false);
  const [rowCount, setRowCount] = useState(minRows);

  const updateLayout = useCallback(() => {
    const inlineMeasure = inlineMeasureRef.current;
    const measure = measureRef.current;
    if (!inlineMeasure || !measure) return;

    const lineHeight = Number.parseFloat(
      window.getComputedStyle(inlineMeasure).lineHeight,
    );
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;

    const inlineHeight = inlineMeasure.scrollHeight;
    const shouldBreakBeforeValue =
      Boolean(value) && inlineHeight > lineHeight + 0.5;

    setBreakBeforeValue((current) =>
      current === shouldBreakBeforeValue ? current : shouldBreakBeforeValue,
    );

    const measuredHeight = measure.scrollHeight;
    const measuredRows = Math.ceil((measuredHeight - 0.5) / lineHeight);
    const nextRowCount = Math.max(minRows, measuredRows);
    setRowCount((current) => (current === nextRowCount ? current : nextRowCount));
  }, [minRows, value]);

  useLayoutEffect(() => {
    updateLayout();

    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(updateLayout);
    observer.observe(root);

    return () => observer.disconnect();
  }, [breakBeforeValue, label, updateLayout, value]);

  const inlineContent = (
    <>
      <span className={styles.adaptiveLabel}>{label}</span>
      {value && <span className={styles.adaptiveText}> {value}</span>}
    </>
  );

  return (
    <div ref={rootRef} className={styles.adaptiveField}>
      {breakBeforeValue ? (
        <div className={styles.adaptiveMultiline}>
          <div className={styles.adaptiveMultilineLabel}>{label}</div>
          <div className={styles.adaptiveMultilineValueArea}>
            <span className={styles.adaptiveRules} aria-hidden="true">
              {Array.from({ length: rowCount }, (_, index) => (
                <span key={index} />
              ))}
            </span>
            <div className={styles.adaptiveMultilineValue}>{value}</div>
          </div>
        </div>
      ) : (
        <div className={styles.adaptiveSingleLine}>
          <span className={styles.adaptiveSingleLabel}>{label}</span>
          <span className={styles.adaptiveSingleValue}>{value || ' '}</span>
        </div>
      )}

      <div ref={measureRef} className={styles.adaptiveMeasure} aria-hidden="true">
        <span className={styles.adaptiveMeasureValue}>{value || ' '}</span>
      </div>
      <div
        ref={inlineMeasureRef}
        className={styles.adaptiveInlineMeasure}
        aria-hidden="true"
      >
        {inlineContent}
      </div>
    </div>
  );
};

const formatDirectionDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return '';

  return `${match[3]}.${match[2]}.${match[1]}`;
};

export const IndividualSelectionDirection = () => {
  const [draft, setDraft] = useState<DirectionDraft>(loadDraft);
  const [editor, setEditor] = useState<Editor>(null);
  const [registryOpen, setRegistryOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [savedRecordId, setSavedRecordId] = useState<number | null>(
    loadSavedRecordId,
  );
  const savedRecordIdRef = useRef(savedRecordId);
  savedRecordIdRef.current = savedRecordId;
  const [page2StartIndex, setPage2StartIndex] = useState(7);
  const page1Ref = useRef<HTMLElement>(null);
  const page1ContentRef = useRef<HTMLDivElement>(null);
  const [currentRecipient, setCurrentRecipient] = useState<CurrentRecipient | null>(
    readCurrentRecipient,
  );

  const refreshCurrentData = useCallback(async (
    recipient = readCurrentRecipient(),
    force = false,
  ) => {
    setCurrentRecipient(recipient);
    if (savedRecordIdRef.current !== null && !force) return;

    const autoValues = await currentAutoValues(recipient);
    const protocolDraft = recipient ? await loadProtocolDraft() : null;
    const currentProtocolValues =
      recipient &&
      protocolDraft &&
      protocolDraft.protocolRecordId === null &&
      Number(protocolDraft.values.recipientId) === recipient.id
        ? protocolDraft.values
        : {};
    if (savedRecordIdRef.current !== null && !force) return;

    setDraft((current) => {
      const recipientChanged = Boolean(
        recipient &&
          current.sourceRecipientId &&
          current.sourceRecipientId !== String(recipient.id),
      );
      let next = mergeAutoValues(current, recipient, autoValues);
      if (!recipient) return next;

      if (hasStoredCurrentIndividualSelectionIndications(recipient.id)) {
        next = {
          ...next,
          individualSelectionIndications:
            readCurrentIndividualSelectionIndications(recipient.id),
        };
      } else if (recipientChanged) {
        next = {
          ...next,
          individualSelectionIndications: '',
        };
      } else if (next.individualSelectionIndications.trim()) {
        writeCurrentIndividualSelectionIndications(
          recipient.id,
          next.individualSelectionIndications,
        );
      }

      if (hasStoredCurrentIndications(recipient.id, 'erythrocytes')) {
        return {
          ...next,
          indicationValues: {
            ...(recipientChanged ? {} : next.indicationValues),
            ...readCurrentIndications(recipient.id, 'erythrocytes'),
            indicationComponent: 'erythrocytes',
          },
        };
      }

      const protocolIndications = currentIndicationsForComponent(
        currentProtocolValues,
        'erythrocytes',
      );
      const hasProtocolIndications = Object.entries(protocolIndications).some(
        ([key, value]) =>
          key !== 'indicationComponent' && value.trim() !== '',
      );

      if (hasProtocolIndications) {
        writeCurrentIndications(
          recipient.id,
          'erythrocytes',
          protocolIndications,
        );
        return {
          ...next,
          indicationValues: {
            ...(recipientChanged ? {} : next.indicationValues),
            ...protocolIndications,
            indicationComponent: 'erythrocytes',
          },
        };
      }

      if (!recipientChanged) {
        writeCurrentIndications(
          recipient.id,
          'erythrocytes',
          next.indicationValues,
        );
        return next;
      }

      return {
        ...next,
        indicationValues: { indicationComponent: 'erythrocytes' },
      };
    });
  }, [savedRecordId]);

  useEffect(() => {
    void refreshCurrentData();
  }, [refreshCurrentData]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    try {
      if (savedRecordId === null) {
        window.localStorage.removeItem(SAVED_RECORD_ID_STORAGE_KEY);
      } else {
        window.localStorage.setItem(
          SAVED_RECORD_ID_STORAGE_KEY,
          String(savedRecordId),
        );
      }
    } catch (error) {
      console.error('Не удалось сохранить идентификатор открытого направления:', error);
    }
  }, [savedRecordId]);

  useEffect(() => {
    if (savedRecordId !== null) return;
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
    savedRecordId,
    draft.diagnosis,
    draft.sourceRecipientId,
    refreshCurrentData,
  ]);

  const updateFields = (changes: Record<string, string>) => {
    if (
      savedRecordId === null &&
      currentRecipient &&
      changes.individualSelectionIndications !== undefined
    ) {
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

      return next;
    });
  };

  const updateIndications = (changes: ProtocolValues) => {
    setDraft((current) => {
      const indicationValues = {
        ...current.indicationValues,
        ...changes,
        indicationComponent: 'erythrocytes',
      };

      if (savedRecordId === null && currentRecipient) {
        writeCurrentIndications(
          currentRecipient.id,
          'erythrocytes',
          indicationValues,
        );
      }

      return {
        ...current,
        indicationValues,
      };
    });
  };

  const clear = async () => {
    const recipient = readCurrentRecipient();
    const autoValues = await currentAutoValues(recipient);
    const next = mergeAutoValues(
      { ...emptyDraft(), directionDate: todayKey() },
      recipient,
      autoValues,
    );
    const sharedIndividualSelectionIndications =
      recipient &&
      hasStoredCurrentIndividualSelectionIndications(recipient.id)
        ? readCurrentIndividualSelectionIndications(recipient.id)
        : '';

    setSavedRecordId(null);
    setDraft({
      ...(recipient && hasStoredCurrentIndications(recipient.id, 'erythrocytes')
        ? {
            ...next,
            indicationValues: {
              ...readCurrentIndications(recipient.id, 'erythrocytes'),
              indicationComponent: 'erythrocytes',
            },
          }
        : next),
      individualSelectionIndications: sharedIndividualSelectionIndications,
    });
    setStatus('');
  };

  const newBlank = async () => {
    const recipient = readCurrentRecipient();
    const autoValues = await currentAutoValues(recipient);
    const next = mergeAutoValues(
      { ...emptyDraft(), directionDate: todayKey() },
      recipient,
      autoValues,
    );
    const sharedIndividualSelectionIndications =
      recipient &&
      hasStoredCurrentIndividualSelectionIndications(recipient.id)
        ? readCurrentIndividualSelectionIndications(recipient.id)
        : '';

    setSavedRecordId(null);
    setDraft({
      ...(recipient && hasStoredCurrentIndications(recipient.id, 'erythrocytes')
        ? {
            ...next,
            indicationValues: {
              ...readCurrentIndications(recipient.id, 'erythrocytes'),
              indicationComponent: 'erythrocytes',
            },
          }
        : next),
      individualSelectionIndications: sharedIndividualSelectionIndications,
    });
    setStatus(
      recipient
        ? 'Создан новый бланк для текущего реципиента.'
        : 'Создан новый бланк.',
    );
  };

  const save = async (afterPrint = false) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));

    const historicalRecipientId = Number(draft.sourceRecipientId);
    if (savedRecordId === null && !currentRecipient) {
      setStatus('Выберите реципиента перед сохранением направления.');
      return false;
    }
    if (
      savedRecordId !== null &&
      (!Number.isFinite(historicalRecipientId) || historicalRecipientId <= 0)
    ) {
      setStatus('Не удалось определить реципиента сохранённого бланка.');
      return false;
    }

    try {
      const recipientId =
        savedRecordId !== null
          ? historicalRecipientId
          : currentRecipient!.id;
      const protocolDraft =
        savedRecordId === null ? await loadProtocolDraft() : null;
      const currentProtocolValues =
        savedRecordId === null &&
        currentRecipient &&
        protocolDraft &&
        protocolDraft.protocolRecordId === null &&
        Number(protocolDraft.values.recipientId) === currentRecipient.id
          ? protocolDraft.values
          : {};
      const draftToSave =
        savedRecordId === null
          ? {
              ...draft,
              recipientProfileSnapshot: {
                ...currentRecipient!.profile,
                ...currentProtocolValues,
                recipientId: String(currentRecipient!.id),
                recipientName: currentRecipient!.fullName,
              },
            }
          : draft;

      const record = await saveBloodRequestRecord({
        recordId: savedRecordId,
        recipientId,
        kind: 'individual-selection-direction',
        values: { ...draftToSave },
      });
      setDraft(draftToSave);
      savedRecordIdRef.current = record.id;
      setSavedRecordId(record.id);
      setStatus(
        afterPrint
          ? 'Направление сохранено после печати.'
          : 'Направление сохранено.',
      );
      return true;
    } catch (error) {
      console.error('Не удалось сохранить направление:', error);
      setStatus(
        error instanceof Error
          ? error.message
          : 'Не удалось сохранить направление.',
      );
      return false;
    }
  };

  const selectRecipient = async (recipient: RecipientRecord) => {
    try {
      const historicalRecipientId = Number(draft.sourceRecipientId);
      const previousRecipientId =
        savedRecordId !== null &&
        Number.isFinite(historicalRecipientId) &&
        historicalRecipientId > 0
          ? historicalRecipientId
          : currentRecipient?.id ?? null;
      await switchCurrentRecipient(recipient);
      const recipientChanged = previousRecipientId !== recipient.id;
      if (recipientChanged) {
        setSavedRecordId(null);
      }
      await refreshCurrentData(readCurrentRecipient(), recipientChanged);
      return true;
    } catch (error) {
      console.error('Не удалось выбрать реципиента для направления:', error);
      return false;
    }
  };

  const openSavedDirection = async (
    record: BloodRequestRecord,
    recipient: RecipientRecord,
  ) => {
    try {
      await switchCurrentRecipient(recipient);
      setCurrentRecipient(readCurrentRecipient());
      setDraft(draftFromRecord(record.values));
      savedRecordIdRef.current = record.id;
      setSavedRecordId(record.id);
      setRegistryOpen(false);
      setStatus('Сохранённое направление открыто.');
    } catch (error) {
      console.error('Не удалось открыть сохранённое направление:', error);
      setStatus('Не удалось открыть сохранённое направление.');
    }
  };

  const examinationValues = useMemo<ProtocolValues>(() => {
    if (savedRecordId === null) {
      return {
        ...(currentRecipient?.profile ?? {}),
        recipientId: currentRecipient ? String(currentRecipient.id) : '',
        recipientName: currentRecipient?.fullName ?? '',
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
    };
  }, [currentRecipient, draft, savedRecordId]);

  const updateExamination = async (changes: ProtocolValues) => {
    if (savedRecordId !== null) {
      setDraft((current) => {
        const snapshot: ProtocolValues = {
          ...current.recipientProfileSnapshot,
          recipientId: current.sourceRecipientId,
          recipientName: current.recipientName,
          recipientSex: current.recipientSex,
          medicalRecordNumber: current.medicalRecordNumber,
          diagnosis: current.diagnosis,
          department: current.department,
          ...changes,
        };
        const next = {
          ...current,
          recipientProfileSnapshot: snapshot,
        };

        if (changes.recipientName !== undefined) {
          next.recipientName = changes.recipientName;
        }
        if (changes.recipientBirthDate !== undefined) {
          next.recipientAge = formatRecipientAge(changes.recipientBirthDate);
        }
        if (changes.recipientSex !== undefined) {
          next.recipientSex = changes.recipientSex;
        }
        if (changes.medicalRecordNumber !== undefined) {
          next.medicalRecordNumber = changes.medicalRecordNumber;
        }
        if (changes.diagnosis !== undefined) {
          next.diagnosis = changes.diagnosis;
        }
        if (
          changes.recipientAbo !== undefined ||
          changes.recipientRh !== undefined
        ) {
          next.recipientAboRh = [snapshot.recipientAbo, snapshot.recipientRh]
            .filter(Boolean)
            .join(' ');
        }
        if (
          Object.keys(changes).some(
            (key) =>
              key === 'recipientAntigens' ||
              key.startsWith('recipientAntigen'),
          )
        ) {
          next.recipientPhenotype = formatRecipientAntigens(snapshot);
        }
        if (
          Object.keys(changes).some((key) =>
            [
              'recipientPregnanciesCount',
              'recipientBirthsCount',
              'recipientSpontaneousAbortionsCount',
              'recipientHemolyticDiseaseNewbornHistory',
            ].includes(key),
          )
        ) {
          next.obstetricHistory =
            snapshot.recipientSex === 'Женский'
              ? formatObstetricHistory(snapshot)
              : '';
        }
        if (
          Object.keys(changes).some((key) =>
            [
              'previousTransfusionsStatus',
              'previousTransfusions',
              'previousReactionsStatus',
              'previousReactions',
              'individualSelectionHistoryStatus',
              'individualSelectionHistory',
            ].includes(key),
          )
        ) {
          next.transfusionHistory = formatTransfusionHistory(snapshot);
        }

        return next;
      });
      return;
    }

    if (!currentRecipient) return;

    try {
      await updateCurrentRecipientProfile(currentRecipient, changes);
      await refreshCurrentData(readCurrentRecipient());
    } catch (error) {
      console.error('Не удалось обновить общие данные медицинского обследования реципиента:', error);
    }
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
      role="button"
      tabIndex={0}
      onClick={() => setEditor('organization')}
      onKeyDown={(event) =>
        activateOnKeyboard(event, () => setEditor('organization'))
      }
    >
      <AdaptiveRuledField
        label="Наименование ЛПУ:"
        value={draft.medicalOrganization}
      />
      <AdaptiveRuledField label="Отделение:" value={draft.department} />
    </div>,

    <div
      key="recipient"
      className={styles.fillSection}
      role="button"
      tabIndex={0}
      onClick={() => setEditor('recipient')}
      onKeyDown={(event) =>
        activateOnKeyboard(event, () => setEditor('recipient'))
      }
    >
      <AdaptiveRuledField
        label="Ф.И.О. реципиента:"
        value={draft.recipientName}
      />
      <div className={styles.singleLine}>
        <span>Возраст:</span>
        <span className={styles.valueLine}>
          {displayValue(draft.recipientAge)}
        </span>
      </div>
      <div className={styles.singleLine}>
        <span>№ медицинской карты:</span>
        <span className={styles.valueLine}>
          {displayValue(draft.medicalRecordNumber)}
        </span>
      </div>
      <AdaptiveRuledField label="Диагноз:" value={draft.diagnosis} />
    </div>,

    <div
      key="examination"
      className={styles.fillSection}
      role="button"
      tabIndex={0}
      onClick={() => setEditor('examination')}
      onKeyDown={(event) =>
        activateOnKeyboard(event, () => setEditor('examination'))
      }
    >
      <div className={styles.singleLine}>
        <span>Группа крови и резус-фактор реципиента:</span>
        <span className={styles.valueLine}>
          {displayValue(draft.recipientAboRh)}
        </span>
      </div>
      <AdaptiveRuledField
        label="Фенотип реципиента:"
        value={draft.recipientPhenotype}
      />
      <AdaptiveRuledField
        label="Аллоиммунные антитела:"
        value={formatAlloimmuneAntibodies(examinationValues)}
      />
    </div>,

    <div
      key="transfusion"
      className={styles.fillSection}
      role="button"
      tabIndex={0}
      onClick={() => setEditor('transfusion')}
      onKeyDown={(event) =>
        activateOnKeyboard(event, () => setEditor('transfusion'))
      }
    >
      <AdaptiveRuledField
        label="Гемотрансфузионный анамнез:"
        value={draft.transfusionHistory}
      />
    </div>,

    ...(draft.recipientSex === 'Женский'
      ? [
          <div
            key="obstetric"
            className={styles.fillSection}
            role="button"
            tabIndex={0}
            onClick={() => setEditor('obstetric')}
            onKeyDown={(event) =>
              activateOnKeyboard(event, () => setEditor('obstetric'))
            }
          >
            <AdaptiveRuledField
              label="Акушерский анамнез у женщин:"
              value={draft.obstetricHistory}
            />
          </div>,
        ]
      : []),

    <div
      key="component"
      className={styles.fillSection}
      role="button"
      tabIndex={0}
      onClick={() => setEditor('component')}
      onKeyDown={(event) =>
        activateOnKeyboard(event, () => setEditor('component'))
      }
    >
      <AdaptiveRuledField
        label="Наименование требуемого компонента:"
        value={draft.requiredComponent}
      />
      <div className={styles.singleLine}>
        <span>Количество:</span>
        <span className={styles.valueLine}>
          {displayValue(formatDoseQuantity(draft.quantity))}
        </span>
      </div>
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
      className={styles.fillSection}
      role="button"
      tabIndex={0}
      onClick={() => setEditor('footer')}
      onKeyDown={(event) =>
        activateOnKeyboard(event, () => setEditor('footer'))
      }
    >
      <div className={styles.directionDate}>
        <span>Дата направления:</span>{' '}
        <span className={styles.enteredValue}>
          {formatDirectionDate(draft.directionDate)}
        </span>
      </div>

      <div className={`${styles.singleLine} ${styles.doctorLine}`}>
        <span>Врач, назначивший трансфузию:</span>
        <span className={styles.valueLine}>
          {displayValue(draft.doctorName)}
        </span>
      </div>
      <div className={styles.singleLine}>
        <span>Контактный телефон:</span>
        <span className={styles.valueLine}>
          {displayValue(draft.doctorPhone)}
        </span>
      </div>
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
    draft.transfusionHistory,
    draft.recipientSex,
    draft.obstetricHistory,
    draft.requiredComponent,
    draft.quantity,
    draft.individualSelectionIndications,
    draft.directionDate,
    draft.doctorName,
    draft.doctorPhone,
  ].join('\u0001');

  const splitIndex = Math.min(page2StartIndex, formSections.length);
  const hasSecondPage = splitIndex < formSections.length;

  useLayoutEffect(() => {
    setPage2StartIndex(formSections.length);
  }, [formSections.length, paginationKey]);

  useLayoutEffect(() => {
    const page = page1Ref.current;
    const content = page1ContentRef.current;
    if (!page || !content) return undefined;

    const fitPage = () => {
      if (
        page.scrollHeight > page.clientHeight + 1 &&
        page2StartIndex > 0
      ) {
        setPage2StartIndex((current) =>
          Math.max(0, Math.min(current, formSections.length) - 1),
        );
      }
    };

    fitPage();

    if (typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(fitPage);
    observer.observe(content);

    return () => observer.disconnect();
  }, [formSections.length, page2StartIndex, paginationKey]);

  const printPage = (page: 1 | 2) => {
    const className = `print-individual-selection-page-${page}`;
    document.body.classList.add(className);

    try {
      window.print();
    } finally {
      document.body.classList.remove(className);
      void save(true);
    }
  };

  return (
    <main className={styles.shell}>
      <header className={`app-header ${styles.header}`}>
        <div className={`toolbar-wrap ${styles.toolbar}`}>
          <SiteNavigation
            current="summary-request"
            recipientName={currentRecipient?.fullName ?? ''}
            recipientAbo={currentRecipient?.profile.recipientAbo ?? ''}
            recipientRh={currentRecipient?.profile.recipientRh ?? ''}
            currentRecipientAvailable={Boolean(currentRecipient)}
            onOpenCurrentRecipient={() => setRegistryOpen(true)}
          />
          <div className="print-actions" aria-label="Панель действий">
            <button type="button" className="clear-button" onClick={() => void clear()}>
              Очистить бланк
            </button>
            <button type="button" className="new-button" onClick={() => void newBlank()}>
              Новый бланк
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setRegistryOpen(true)}
            >
              Реципиенты
            </button>
            <button type="button" className="save-button" onClick={() => void save()}>
              Сохранить
            </button>
            {hasSecondPage ? (
              <>
                <button
                  type="button"
                  className="print-button"
                  onClick={() => printPage(1)}
                >
                  Печать страницы 1
                </button>
                <button
                  type="button"
                  className="print-button"
                  onClick={() => printPage(2)}
                >
                  Печать страницы 2
                </button>
              </>
            ) : (
              <button
                type="button"
                className="print-button"
                onClick={() => printPage(1)}
              >
                Печать страницы
              </button>
            )}
          </div>
          {status && (
            <div className="toolbar-status" role="status">
              {status}
            </div>
          )}
        </div>
      </header>

      <div className={styles.sheetWrap}>
        <section
          ref={page1Ref}
          className={`${styles.sheet} ${styles.pageOne}`}
          aria-label="Направление на индивидуальный подбор, страница 1"
        >
          <div ref={page1ContentRef} className={styles.pageContent}>
            <h1 className={styles.title}>
              Направление на индивидуальный подбор компонентов крови.
            </h1>

            {formSections.slice(0, splitIndex)}
          </div>
        </section>

        {hasSecondPage && (
          <section
            className={`${styles.sheet} ${styles.pageTwo}`}
            aria-label="Направление на индивидуальный подбор, страница 2"
          >
            <div className={styles.pageContent}>
              {formSections.slice(splitIndex)}
            </div>
          </section>
        )}
      </div>

      {editor === 'recipient' && (
        <IndividualSelectionRecipientModal
          values={examinationValues}
          onRecipientChange={updateExamination}
          onOpenRecipients={() => {
            setEditor(null);
            setRegistryOpen(true);
          }}
          onSelectRecipient={selectRecipient}
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

      {editor === 'transfusion' && (
        <IndividualSelectionTransfusionHistoryModal
          values={examinationValues}
          onChange={updateExamination}
          onClose={() => setEditor(null)}
        />
      )}

      {editor === 'component' && (
        <IndividualSelectionComponentModal
          requiredComponent={draft.requiredComponent}
          quantity={draft.quantity}
          individualSelectionIndications={draft.individualSelectionIndications}
          indicationValues={draft.indicationValues}
          fixedIndicationComponent="erythrocytes"
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
          initialRecipientId={currentRecipient?.id ?? null}
          initialRecipientName={currentRecipient?.fullName ?? ''}
          onUseRecipient={selectRecipient}
          onOpenIndividualSelectionDirectionRecord={(record, recipient) => {
            void openSavedDirection(record, recipient);
          }}
          onClose={() => setRegistryOpen(false)}
        />
      )}
    </main>
  );
};
