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
  type CurrentRecipient,
} from '../../storage/repositories/current-recipient';
import { loadProtocolDraft } from '../../storage/repositories/protocol-draft';
import {
  updateRecipient,
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
import { IndividualSelectionIndicationsModal } from './individual-selection-indications-modal';
import { IndividualSelectionObstetricHistoryModal } from './individual-selection-obstetric-history-modal';
import { IndividualSelectionRecipientModal } from './individual-selection-recipient-modal';
import { IndividualSelectionTransfusionHistoryModal } from './individual-selection-transfusion-history-modal';
import {
  RequestEditorModal,
  type RequestEditorField,
} from './request-editor-modal';
import styles from './individual-selection-direction.module.css';

const STORAGE_KEY = 'blood:individual-selection-direction-draft';
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
  autoValues: Partial<Record<AutoField, string>>;
};

type Editor =
  | 'organization'
  | 'component'
  | 'examination'
  | 'indications'
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
  indicationValues: {},
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
        if (key === 'autoValues' || key === 'indicationValues') return [];
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
    return next;
  } catch {
    return { ...emptyDraft(), directionDate: todayKey() };
  }
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
  minRows = 2,
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

    const inlineHeight = inlineMeasure.getBoundingClientRect().height;
    const shouldBreakBeforeValue =
      Boolean(value) && inlineHeight > lineHeight + 0.5;

    setBreakBeforeValue((current) =>
      current === shouldBreakBeforeValue ? current : shouldBreakBeforeValue,
    );

    const measuredHeight = measure.getBoundingClientRect().height;
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

  const content = (
    <>
      <span className={styles.adaptiveLabel}>{label}</span>
      {value && (
        <span
          className={[
            styles.adaptiveText,
            breakBeforeValue ? styles.adaptiveTextNewLine : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {breakBeforeValue ? value : ` ${value}`}
        </span>
      )}
    </>
  );

  const inlineContent = (
    <>
      <span className={styles.adaptiveLabel}>{label}</span>
      {value && <span className={styles.adaptiveText}> {value}</span>}
    </>
  );

  return (
    <div ref={rootRef} className={styles.adaptiveField}>
      <span className={styles.adaptiveRules} aria-hidden="true">
        {Array.from({ length: rowCount }, (_, index) => (
          <span key={index} />
        ))}
      </span>
      <div className={styles.adaptiveContent}>{content}</div>
      <div ref={measureRef} className={styles.adaptiveMeasure} aria-hidden="true">
        {content}
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
  const [page2StartIndex, setPage2StartIndex] = useState(7);
  const page1Ref = useRef<HTMLElement>(null);
  const page1ContentRef = useRef<HTMLDivElement>(null);
  const [currentRecipient, setCurrentRecipient] = useState<CurrentRecipient | null>(
    readCurrentRecipient,
  );

  const refreshCurrentData = useCallback(async (recipient = readCurrentRecipient()) => {
    setCurrentRecipient(recipient);
    const autoValues = await currentAutoValues(recipient);
    setDraft((current) => mergeAutoValues(current, recipient, autoValues));
  }, []);

  useEffect(() => {
    void refreshCurrentData();
  }, [refreshCurrentData]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
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
    draft.diagnosis,
    draft.sourceRecipientId,
    refreshCurrentData,
  ]);

  const updateFields = (changes: Record<string, string>) => {
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
    setDraft((current) => ({
      ...current,
      indicationValues: {
        ...current.indicationValues,
        ...changes,
      },
    }));
  };

  const clear = async () => {
    const recipient = readCurrentRecipient();
    const autoValues = await currentAutoValues(recipient);
    const next = mergeAutoValues(
      { ...emptyDraft(), directionDate: todayKey() },
      recipient,
      autoValues,
    );
    setDraft(next);
  };

  const selectRecipient = async (recipient: RecipientRecord) => {
    try {
      await switchCurrentRecipient(recipient);
      await refreshCurrentData(readCurrentRecipient());
      return true;
    } catch (error) {
      console.error('Не удалось выбрать реципиента для направления:', error);
      return false;
    }
  };

  const examinationValues = useMemo<ProtocolValues>(
    () => ({
      ...(currentRecipient?.profile ?? {}),
      recipientId: currentRecipient ? String(currentRecipient.id) : '',
      recipientName: currentRecipient?.fullName ?? '',
    }),
    [currentRecipient],
  );

  const updateExamination = async (changes: ProtocolValues) => {
    if (!currentRecipient) return;

    try {
      const updatedRecipient = await updateRecipient(currentRecipient.id, {
        ...currentRecipient.profile,
        ...changes,
        recipientId: String(currentRecipient.id),
        recipientName: currentRecipient.fullName,
      });
      await switchCurrentRecipient(updatedRecipient);
      await refreshCurrentData(readCurrentRecipient());
    } catch (error) {
      console.error('Не удалось обновить данные медицинского обследования реципиента:', error);
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
      key="indications"
      className={styles.fillSection}
      role="button"
      tabIndex={0}
      onClick={() => setEditor('indications')}
      onKeyDown={(event) =>
        activateOnKeyboard(event, () => setEditor('indications'))
      }
    >
      <AdaptiveRuledField
        label="Показания к трансфузии:"
        value={formatIndications(draft.indicationValues)}
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
        <span className={styles.valueLine}>{displayValue(draft.quantity)}</span>
      </div>
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

  const printSecondPage = () => {
    document.body.classList.add('print-individual-selection-page-2');

    try {
      window.print();
    } finally {
      document.body.classList.remove('print-individual-selection-page-2');
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
          <div className="print-actions">
            <button type="button" className="clear-button" onClick={() => void clear()}>
              Очистить бланк
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setRegistryOpen(true)}
            >
              Реципиенты
            </button>
            <button type="button" className="print-button" onClick={() => window.print()}>
              Печать
            </button>
            {hasSecondPage && (
              <button
                type="button"
                className="secondary-button"
                onClick={printSecondPage}
              >
                Печать страницы 2
              </button>
            )}
          </div>
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

      {editor === 'indications' && (
        <IndividualSelectionIndicationsModal
          values={draft.indicationValues}
          onChange={updateIndications}
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
          onLocalChange={updateFields}
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
          onClose={() => setRegistryOpen(false)}
        />
      )}
    </main>
  );
};
