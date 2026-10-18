import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import {
  readCurrentRecipient,
  switchCurrentRecipient,
  type CurrentRecipient,
} from '../../storage/repositories/current-recipient';
import { loadProtocolDraft } from '../../storage/repositories/protocol-draft';
import type { RecipientRecord } from '../../storage/repositories/recipients';
import { SiteNavigation } from '../site-navigation/site-navigation';
import { RecipientDatabaseModal } from '../transfusion-protocol/recipient-database-modal';
import { formatRecipientAge } from '../transfusion-protocol/recipient-demographics';
import { formatRecipientAntigens } from '../transfusion-protocol/recipient-examination-model';
import {
  formatHistoryValue,
  HISTORY_STATUS,
  getHistoryStatus,
} from '../transfusion-protocol/recipient-history-model';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import {
  RequestEditorModal,
  type RequestEditorField,
} from './request-editor-modal';
import styles from './individual-selection-direction.module.css';

const STORAGE_KEY = 'blood:individual-selection-direction-draft';
const ORGANIZATION = 'ФБУЗ "Медико-санитарная часть №32" ФМБА России, г. Заречный.';

type AutoField =
  | 'requiredComponent'
  | 'quantity'
  | 'recipientAboRh'
  | 'recipientPhenotype'
  | 'recipientName'
  | 'recipientAge'
  | 'department'
  | 'medicalRecordNumber'
  | 'transfusionHistory'
  | 'obstetricHistory'
  | 'recipientSex';

type DirectionDraft = Record<AutoField, string> & {
  sourceRecipientId: string;
  diagnosis: string;
  allergyHistory: string;
  directionDate: string;
  doctorPhone: string;
  autoValues: Partial<Record<AutoField, string>>;
};

type Editor =
  | 'component'
  | 'recipient'
  | 'transfusion'
  | 'obstetric'
  | 'allergy'
  | 'footer'
  | null;

const AUTO_FIELDS: AutoField[] = [
  'requiredComponent',
  'quantity',
  'recipientAboRh',
  'recipientPhenotype',
  'recipientName',
  'recipientAge',
  'department',
  'medicalRecordNumber',
  'transfusionHistory',
  'obstetricHistory',
  'recipientSex',
];

const COMPONENT_FIELDS: RequestEditorField[] = [
  {
    name: 'requiredComponent',
    label: 'Наименование требуемого компонента',
    wide: true,
  },
  { name: 'quantity', label: 'Количество', wide: true },
  {
    name: 'recipientAboRh',
    label: 'Группа крови и резус-фактор реципиента',
    wide: true,
  },
  { name: 'recipientPhenotype', label: 'Фенотип реципиента', wide: true },
];

const RECIPIENT_FIELDS: RequestEditorField[] = [
  { name: 'recipientName', label: 'Ф.И.О. реципиента', wide: true },
  { name: 'recipientAge', label: 'Возраст' },
  { name: 'department', label: 'Отделение' },
  { name: 'medicalRecordNumber', label: '№ истории болезни' },
  { name: 'diagnosis', label: 'Диагноз', type: 'textarea', wide: true },
];

const TRANSFUSION_FIELDS: RequestEditorField[] = [
  {
    name: 'transfusionHistory',
    label: 'Гемотрансфузионный анамнез',
    type: 'textarea',
    wide: true,
  },
];

const OBSTETRIC_FIELDS: RequestEditorField[] = [
  {
    name: 'obstetricHistory',
    label: 'Акушерский анамнез анамнез у женщин',
    type: 'textarea',
    wide: true,
  },
];

const ALLERGY_FIELDS: RequestEditorField[] = [
  {
    name: 'allergyHistory',
    label: 'Аллергоанамнез',
    type: 'textarea',
    wide: true,
  },
];

const FOOTER_FIELDS: RequestEditorField[] = [
  { name: 'directionDate', label: 'Дата направления', type: 'date' },
  { name: 'doctorPhone', label: 'Телефон лечащего врача', wide: true },
];

const emptyDraft = (): DirectionDraft => ({
  sourceRecipientId: '',
  requiredComponent: '',
  quantity: '',
  recipientAboRh: '',
  recipientPhenotype: '',
  recipientName: '',
  recipientAge: '',
  department: '',
  medicalRecordNumber: '',
  transfusionHistory: '',
  obstetricHistory: '',
  recipientSex: '',
  diagnosis: '',
  allergyHistory: '',
  directionDate: '',
  doctorPhone: '',
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
    const next = {
      ...blank,
      ...Object.fromEntries(
        Object.entries(parsed).filter(([, value]) => typeof value === 'string'),
      ),
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

  const previous = formatHistoryValue(
    values,
    'previousTransfusionsStatus',
    'previousTransfusions',
  );
  if (previous) parts.push(`Трансфузии: ${previous}`);

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

  const amount = values.amountMl?.trim();

  return {
    requiredComponent: values.componentName?.trim() ?? '',
    quantity: amount ? `${amount} мл` : '',
    recipientAboRh: [values.recipientAbo, values.recipientRh]
      .filter(Boolean)
      .join(' '),
    recipientPhenotype: formatRecipientAntigens(values),
    recipientName: recipient.fullName,
    recipientAge: formatRecipientAge(values.recipientBirthDate),
    department: values.department?.trim() ?? '',
    medicalRecordNumber: values.medicalRecordNumber?.trim() ?? '',
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

const formatDirectionDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return '';

  const months = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];
  const month = months[Number(match[2]) - 1];
  if (!month) return '';

  return `"${String(Number(match[3])).padStart(2, '0')}" ${month} ${match[1]} г`;
};

export const IndividualSelectionDirection = () => {
  const [draft, setDraft] = useState<DirectionDraft>(loadDraft);
  const [editor, setEditor] = useState<Editor>(null);
  const [registryOpen, setRegistryOpen] = useState(false);
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

  const editorConfig = useMemo(() => {
    switch (editor) {
      case 'component':
        return {
          title: 'Компонент крови',
          fields: COMPONENT_FIELDS,
          values: draft,
        };
      case 'recipient':
        return {
          title: 'Данные реципиента',
          fields: RECIPIENT_FIELDS,
          values: draft,
        };
      case 'transfusion':
        return {
          title: 'Гемотрансфузионный анамнез',
          fields: TRANSFUSION_FIELDS,
          values: draft,
        };
      case 'obstetric':
        return draft.recipientSex === 'Женский'
          ? {
              title: 'Акушерский анамнез',
              fields: OBSTETRIC_FIELDS,
              values: draft,
            }
          : null;
      case 'allergy':
        return {
          title: 'Аллергоанамнез',
          fields: ALLERGY_FIELDS,
          values: draft,
        };
      case 'footer':
        return {
          title: 'Оформление направления',
          fields: FOOTER_FIELDS,
          values: draft,
        };
      default:
        return null;
    }
  }, [draft, editor]);

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
          </div>
        </div>
      </header>

      <div className={styles.sheetWrap}>
        <section className={styles.sheet} aria-label="Направление на индивидуальный подбор">
          <h1 className={styles.title}>
            Направление на индивидуальный подбор компонентов крови.
          </h1>

          <div
            className={styles.fillSection}
            role="button"
            tabIndex={0}
            onClick={() => setEditor('component')}
            onKeyDown={(event) =>
              activateOnKeyboard(event, () => setEditor('component'))
            }
          >
            <div className={styles.fieldBlock}>
              <div className={styles.singleLine}>
                <span>Наименование требуемого компонента:</span>
                <span className={styles.valueLine}>
                  {displayValue(draft.requiredComponent)}
                </span>
              </div>
              <div className={styles.extraLine} />
            </div>
            <div className={styles.singleLine}>
              <span>Количество:</span>
              <span className={styles.valueLine}>{displayValue(draft.quantity)}</span>
            </div>
            <div className={styles.singleLine}>
              <span>Группа крови и резус-фактор реципиента:</span>
              <span className={styles.valueLine}>
                {displayValue(draft.recipientAboRh)}
              </span>
            </div>
            <div className={styles.singleLine}>
              <span>Фенотип реципиента:</span>
              <span className={styles.valueLine}>
                {displayValue(draft.recipientPhenotype)}
              </span>
            </div>
          </div>

          <div
            className={styles.fillSection}
            role="button"
            tabIndex={0}
            onClick={() => setEditor('recipient')}
            onKeyDown={(event) =>
              activateOnKeyboard(event, () => setEditor('recipient'))
            }
          >
            <div className={styles.fieldBlock}>
              <div className={styles.singleLine}>
                <span>Ф.И.О. реципиента:</span>
                <span className={styles.valueLine}>
                  {displayValue(draft.recipientName)}
                </span>
              </div>
              <div className={styles.extraLine} />
            </div>
            <div className={styles.singleLine}>
              <span>Возраст:</span>
              <span className={styles.valueLine}>
                {displayValue(draft.recipientAge)}
              </span>
            </div>
            <div className={styles.staticLine}>Организация: {ORGANIZATION}</div>
            <div className={styles.singleLine}>
              <span>Отделение:</span>
              <span className={styles.valueLine}>{displayValue(draft.department)}</span>
            </div>
            <div className={styles.singleLine}>
              <span>№ истории болезни:</span>
              <span className={styles.valueLine}>
                {displayValue(draft.medicalRecordNumber)}
              </span>
            </div>
            <div className={styles.multilineBlock}>
              <span className={styles.multilineLabel}>Диагноз:</span>
              <div className={styles.multilineValue}>{draft.diagnosis}</div>
            </div>
          </div>

          <div
            className={styles.fillSection}
            role="button"
            tabIndex={0}
            onClick={() => setEditor('transfusion')}
            onKeyDown={(event) =>
              activateOnKeyboard(event, () => setEditor('transfusion'))
            }
          >
            <div className={styles.multilineBlock}>
              <span className={styles.multilineLabel}>Гемотрансфузионный анамнез:</span>
              <div className={styles.multilineValue}>{draft.transfusionHistory}</div>
            </div>
          </div>

          <div
            className={[
              styles.fillSection,
              draft.recipientSex === 'Женский' ? '' : styles.fillSectionInactive,
            ].filter(Boolean).join(' ')}
            role={draft.recipientSex === 'Женский' ? 'button' : undefined}
            tabIndex={draft.recipientSex === 'Женский' ? 0 : -1}
            onClick={() => {
              if (draft.recipientSex === 'Женский') setEditor('obstetric');
            }}
            onKeyDown={(event) => {
              if (draft.recipientSex === 'Женский') {
                activateOnKeyboard(event, () => setEditor('obstetric'));
              }
            }}
          >
            <div className={styles.multilineBlock}>
              <span className={styles.multilineLabel}>
                Акушерский анамнез анамнез у женщин:
              </span>
              <div className={styles.multilineValue}>{draft.obstetricHistory}</div>
            </div>
          </div>

          <div
            className={styles.fillSection}
            role="button"
            tabIndex={0}
            onClick={() => setEditor('allergy')}
            onKeyDown={(event) =>
              activateOnKeyboard(event, () => setEditor('allergy'))
            }
          >
            <div className={styles.multilineBlock}>
              <span className={styles.multilineLabel}>Аллергоанамнез:</span>
              <div className={styles.multilineValue}>{draft.allergyHistory}</div>
            </div>
          </div>

          <div
            className={styles.fillSection}
            role="button"
            tabIndex={0}
            onClick={() => setEditor('footer')}
            onKeyDown={(event) =>
              activateOnKeyboard(event, () => setEditor('footer'))
            }
          >
            <div className={styles.directionDate}>
              Дата направления: {formatDirectionDate(draft.directionDate)}
            </div>

            <div className={styles.signatureLineRow}>
              <span>Подпись лечащего врача:</span>
              <span className={styles.signatureBlank} />
            </div>
            <div className={styles.singleLine}>
              <span>Телефон лечащего врача:</span>
              <span className={styles.valueLine}>
                {displayValue(draft.doctorPhone)}
              </span>
            </div>

            <div className={styles.transfusionHead}>
              Зав. трансфузиологическим кабинетом:
            </div>
          </div>
        </section>
      </div>

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
