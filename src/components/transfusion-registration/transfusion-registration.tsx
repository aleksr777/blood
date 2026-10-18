import { useEffect, useState } from 'react';
import {
  adoptCurrentRecipientFromValues,
  readCurrentRecipient,
  recipientProfileValuesForForms,
  switchCurrentRecipient,
  syncCurrentRecipientProfile,
} from '../../storage/repositories/current-recipient';
import {
  clearRegistrationDraft,
  loadRegistrationDraft,
  saveRegistrationDraft,
} from '../../storage/repositories/registration-draft';
import { saveProtocolDraft } from '../../storage/repositories/protocol-draft';
import {
  saveRegistrationRecord,
  type ProtocolRecord,
  type RecipientRecord,
  type RegistrationRecord,
} from '../../storage/repositories/recipients';
import { SiteNavigation } from '../site-navigation/site-navigation';
import { formatRecipientAge } from '../transfusion-protocol/recipient-demographics';
import { RecipientDatabaseModal } from '../transfusion-protocol/recipient-database-modal';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import { RegistrationPatientDetailsModal } from './registration-patient-details-modal';
import {
  parseRegistrationTransfusionRows,
} from './registration-transfusion-table';
import { RegistrationTransfusionsModal } from './registration-transfusions-modal';

const ROW_COUNT = 14;
const PENDING_REGISTRATION_RECORD_KEY = 'blood:registration-open-record';

const BIRTH_MONTHS = [
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
] as const;

const getBirthDateParts = (value?: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return { day: '', month: '', year: '' };

  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex >= BIRTH_MONTHS.length) {
    return { day: '', month: '', year: '' };
  }

  return {
    day: String(Number(match[3])),
    month: BIRTH_MONTHS[monthIndex],
    year: match[1],
  };
};

const readPendingRegistrationRecord = (): RegistrationRecord | null => {
  try {
    const raw = window.sessionStorage.getItem(PENDING_REGISTRATION_RECORD_KEY);
    if (!raw) return null;

    window.sessionStorage.removeItem(PENDING_REGISTRATION_RECORD_KEY);
    const parsed = JSON.parse(raw) as Partial<RegistrationRecord>;

    if (
      typeof parsed.id !== 'number' ||
      typeof parsed.recipientId !== 'number' ||
      !parsed.values ||
      typeof parsed.values !== 'object'
    ) {
      return null;
    }

    return parsed as RegistrationRecord;
  } catch (error) {
    console.error('Не удалось восстановить лист регистрации:', error);
    return null;
  }
};

export const TransfusionRegistration = () => {
  const [initialRecord] = useState<RegistrationRecord | null>(readPendingRegistrationRecord);
  const [values, setValues] = useState<ProtocolValues>(() =>
    initialRecord
      ? {
          ...initialRecord.values,
          recipientId: String(initialRecord.recipientId),
        }
      : {},
  );
  const [recordId, setRecordId] = useState<number | null>(initialRecord?.id ?? null);
  const [draftLoaded, setDraftLoaded] = useState(Boolean(initialRecord));
  const [registryOpen, setRegistryOpen] = useState(false);
  const [registryRecipientId, setRegistryRecipientId] = useState<number | null>(null);
  const [patientDetailsOpen, setPatientDetailsOpen] = useState(false);
  const [tableEditorOpen, setTableEditorOpen] = useState(false);
  const [status, setStatus] = useState('');

  const currentRecipientId = Number(values.recipientId);
  const currentRecipientAvailable =
    Number.isFinite(currentRecipientId) && currentRecipientId > 0;
  const storedCurrentRecipient = readCurrentRecipient();
  const currentRecipientProfile =
    recordId === null && storedCurrentRecipient?.id === currentRecipientId
      ? storedCurrentRecipient.profile
      : {};
  const birthDateParts = getBirthDateParts(values.recipientBirthDate);
  const recipientAge = formatRecipientAge(values.recipientBirthDate);
  const registrationRows = parseRegistrationTransfusionRows(values);

  useEffect(() => {
    if (initialRecord) {
      void saveRegistrationDraft({
        values: {
          ...initialRecord.values,
          recipientId: String(initialRecord.recipientId),
        },
        registrationRecordId: initialRecord.id,
        updatedAt: Date.now(),
      }).catch((error: unknown) =>
        console.error('Не удалось сохранить открытый лист регистрации как текущий:', error),
      );
      return;
    }

    let active = true;
    void loadRegistrationDraft()
      .then((draft) => {
        if (!active) return;

        if (Object.keys(draft.values).length > 0) {
          const currentRecipient = readCurrentRecipient();
          if (draft.registrationRecordId !== null) {
            setValues(draft.values);
          } else if (!currentRecipient) {
            adoptCurrentRecipientFromValues(draft.values);
            setValues(draft.values);
          } else if (Number(draft.values.recipientId) === currentRecipient.id) {
            setValues({
              ...draft.values,
              ...recipientProfileValuesForForms(currentRecipient),
            });
          } else {
            setValues(draft.values);
          }
          setRecordId(draft.registrationRecordId);
          return;
        }

        const currentRecipient = readCurrentRecipient();
        if (currentRecipient) {
          setValues(recipientProfileValuesForForms(currentRecipient));
        }
      })
      .catch((error: unknown) =>
        console.error('Не удалось загрузить текущий лист регистрации:', error),
      )
      .finally(() => active && setDraftLoaded(true));

    return () => {
      active = false;
    };
  }, [initialRecord]);

  useEffect(() => {
    if (!draftLoaded) return;

    if (Object.keys(values).length === 0) {
      void clearRegistrationDraft().catch((error: unknown) =>
        console.error('Не удалось очистить текущий лист регистрации:', error),
      );
      return;
    }

    void saveRegistrationDraft({
      values,
      registrationRecordId: recordId,
      updatedAt: Date.now(),
    }).catch((error: unknown) =>
      console.error('Не удалось сохранить текущий лист регистрации:', error),
    );
  }, [draftLoaded, recordId, values]);

  const selectRecipient = async (recipient: RecipientRecord) => {
    try {
      const result = await switchCurrentRecipient(recipient, {
        kind: 'registration',
        values,
        recordId,
      });

      if (result.changed) {
        setRecordId(null);
        setValues(result.registrationValues);
        setStatus(
          result.protocolSaved || result.registrationSaved
            ? 'Бланки предыдущего реципиента автоматически сохранены. Выбран новый реципиент.'
            : `Выбран реципиент: ${recipient.fullName}.`,
        );
      } else {
        setValues(result.registrationValues);
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

  const openRegistrationRecord = async (
    record: RegistrationRecord,
    recipient: RecipientRecord,
  ) => {
    const switched = await selectRecipient(recipient);
    if (!switched) return;

    setRecordId(record.id);
    setValues({
      ...record.values,
      recipientId: String(record.recipientId),
    });
    setRegistryRecipientId(null);
    setRegistryOpen(false);
    setStatus('Сохранённый лист регистрации открыт.');
  };

  const openProtocolRecord = async (
    record: ProtocolRecord,
    recipient: RecipientRecord,
  ) => {
    const switched = await selectRecipient(recipient);
    if (!switched) return;

    try {
      await saveProtocolDraft({
        values: {
          ...record.values,
          recipientId: String(record.recipientId),
        },
        protocolRecordId: record.id,
        updatedAt: Date.now(),
      });
      setRegistryRecipientId(null);
      setRegistryOpen(false);
      window.location.hash = '#/protocol';
    } catch (error) {
      console.error('Не удалось открыть протокол трансфузии:', error);
      setStatus('Не удалось открыть протокол трансфузии.');
    }
  };

  const save = async (afterPrint = false) => {
    if (!currentRecipientAvailable || !values.recipientName?.trim()) {
      setStatus('Для сохранения выберите реципиента.');
      if (!afterPrint) {
        setRegistryRecipientId(null);
        setRegistryOpen(true);
      }
      return false;
    }

    try {
      const wasSavedRecord = recordId !== null;
      const record = await saveRegistrationRecord(recordId, values);
      setRecordId(record.id);
      const savedValues = {
        ...values,
        recipientId: String(record.recipientId),
      };
      setValues(savedValues);
      if (!wasSavedRecord) {
        adoptCurrentRecipientFromValues(savedValues);
      }
      setStatus(
        afterPrint
          ? 'Лист регистрации сохранён после печати.'
          : 'Лист регистрации сохранён.',
      );
      return true;
    } catch (error) {
      console.error('Не удалось сохранить лист регистрации:', error);
      setStatus(
        error instanceof Error
          ? error.message
          : 'Не удалось сохранить лист регистрации.',
      );
      return false;
    }
  };

  const clearBlank = () => {
    const currentRecipient = readCurrentRecipient();
    setValues(currentRecipient ? recipientProfileValuesForForms(currentRecipient) : {});
    setRecordId(null);
    setRegistryRecipientId(null);
    setStatus('');
  };

  const newBlank = () => {
    const currentRecipient = readCurrentRecipient();
    setValues(currentRecipient ? recipientProfileValuesForForms(currentRecipient) : {});
    setRecordId(null);
    setStatus(
      currentRecipient
        ? 'Создан новый лист регистрации для текущего реципиента.'
        : 'Создан новый лист регистрации.',
    );
  };

  const openRecipients = () => {
    setRegistryRecipientId(null);
    setRegistryOpen(true);
  };

  const updatePatientDetails = (nextValues: ProtocolValues) => {
    const merged = { ...values, ...nextValues };
    setValues(merged);

    void syncCurrentRecipientProfile(nextValues, {
      kind: 'registration',
      values: merged,
      recordId,
    }).catch((error: unknown) =>
      console.error('Не удалось синхронизировать данные реципиента:', error),
    );
  };

  const openRecipientsFromPatientDetails = () => {
    setPatientDetailsOpen(false);
    openRecipients();
  };

  const openCurrentRecipient = () => {
    if (!currentRecipientAvailable) return;
    setRegistryRecipientId(currentRecipientId);
    setRegistryOpen(true);
  };

  const print = () => {
    const root = document.documentElement;

    const restoreOrientation = () => {
      delete root.dataset.registrationPrintRotated;
      window.removeEventListener('afterprint', restoreOrientation);
      void save(true);
    };

    root.dataset.registrationPrintRotated = 'true';
    window.addEventListener('afterprint', restoreOrientation);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  };

  return (
    <main className="registration-app-shell">
      <header className="app-header registration-header">
        <div className="toolbar-wrap registration-toolbar-wrap">
          <SiteNavigation
            current="registration"
            recipientName={currentRecipientAvailable ? (values.recipientName ?? '') : ''}
            recipientAbo={values.recipientAbo ?? currentRecipientProfile.recipientAbo ?? ''}
            recipientRh={values.recipientRh ?? currentRecipientProfile.recipientRh ?? ''}
            currentRecipientAvailable={currentRecipientAvailable}
            onOpenCurrentRecipient={openCurrentRecipient}
          />
          <div className="print-actions" aria-label="Панель действий">
            <button type="button" className="clear-button" onClick={clearBlank}>
              Очистить бланк
            </button>
            <button type="button" className="new-button" onClick={newBlank}>
              Новый бланк
            </button>
            <button type="button" className="secondary-button" onClick={openRecipients}>
              Реципиенты
            </button>
            <button type="button" className="save-button" onClick={() => void save()}>
              Сохранить
            </button>
            <button type="button" className="print-button" onClick={print}>
              Печать страницы 1
            </button>
          </div>
          {status && (
            <div className="toolbar-status" role="status">
              {status}
            </div>
          )}
        </div>
      </header>

      <div className="registration-sheet-wrap">
        <section className="registration-sheet" aria-label="Лист регистрации трансфузии">
          <div className="registration-legal-reference">
            <div>Учетная форма № 003/у</div>
            <div>
              Приложение № 3 к приказу Министерства здравоохранения Российской Федерации от 5 августа
              2022 г. № 530н
            </div>
          </div>

          <h1 className="registration-title">
            ЛИСТ РЕГИСТРАЦИИ ТРАНСФУЗИИ (ПЕРЕЛИВАНИЯ) ДОНОРСКОЙ КРОВИ И (ИЛИ) ЕЕ КОМПОНЕНТОВ
          </h1>

          <div
            className="registration-patient-details"
            role="button"
            tabIndex={0}
            aria-label="Данные реципиента. Нажмите для заполнения"
            onClick={() => setPatientDetailsOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setPatientDetailsOpen(true);
              }
            }}
          >
            <div className="registration-patient-line registration-patient-line--name">
              <span>Фамилия, имя, отчество (при наличии)</span>
              <span className="registration-blank registration-blank--name">
                {values.recipientName ?? ''}
              </span>
            </div>

            <div className="registration-patient-line registration-patient-line--meta">
              <span>Дата рождения «</span>
              <span className="registration-blank registration-blank--day">
                {birthDateParts.day}
              </span>
              <span>»</span>
              <span className="registration-blank registration-blank--date">
                {birthDateParts.month}
              </span>
              <span className="registration-blank registration-blank--year">
                {birthDateParts.year}
              </span>
              <span>г. Пол</span>
              <span className="registration-blank registration-blank--sex">
                {values.recipientSex ?? ''}
              </span>
              <span>Возраст</span>
              <span className="registration-blank registration-blank--age">
                {recipientAge}
              </span>
              <span>№ медицинской карты</span>
              <span className="registration-blank registration-blank--card">
                {values.medicalRecordNumber ?? ''}
              </span>
              <span>№ палаты</span>
              <span className="registration-blank registration-blank--room" />
            </div>
          </div>

          <div
            className="registration-table-section"
            role="button"
            tabIndex={0}
            aria-label="Таблица регистрации трансфузий. Нажмите для заполнения"
            onClick={() => setTableEditorOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setTableEditorOpen(true);
              }
            }}
          >
            <table className="registration-table">
            <colgroup>
              <col className="registration-col-component" />
              <col className="registration-col-liters" />
              <col className="registration-col-units" />
              <col className="registration-col-date" />
              <col className="registration-col-doctor" />
              <col className="registration-col-doctor-sign" />
              <col className="registration-col-worker" />
              <col className="registration-col-nurse-sign" />
              <col className="registration-col-complications" />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2}>Наименование компонента крови</th>
                <th colSpan={2}>Количество</th>
                <th rowSpan={2}>Дата проведения трансфузии</th>
                <th rowSpan={2}>
                  Фамилия, имя, отчество (при наличии) лечащего врача (врача-специалиста),
                  проводившего трансфузию
                </th>
                <th rowSpan={2}>
                  Подпись лечащего врача (врача-специалиста), проводившего трансфузию
                </th>
                <th rowSpan={2}>
                  Фамилия, имя, отчество (при наличии) медицинского работника, ответственного за
                  выполнение трансфузии
                </th>
                <th rowSpan={2}>
                  Подпись медицинской сестры, ответственной за выполнение трансфузии
                </th>
                <th rowSpan={2}>Информация о наличии посттрансфузионных осложнений (да/нет)</th>
              </tr>
              <tr>
                <th>литр</th>
                <th>единицы</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROW_COUNT }, (_, index) => {
                const row = registrationRows[index];

                return (
                  <tr key={row?.protocolId ?? `empty-${index}`}>
                    <td>{row?.componentName || ' '}</td>
                    <td>{row?.amountLiters || ' '}</td>
                    <td>{row?.units || ' '}</td>
                    <td>{row?.transfusionDate || ' '}</td>
                    <td>{row?.doctorName || ' '}</td>
                    <td>&nbsp;</td>
                    <td>{row?.workerName || ' '}</td>
                    <td>&nbsp;</td>
                    <td>{row?.complications || ' '}</td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </section>
      </div>

      {tableEditorOpen && (
        <RegistrationTransfusionsModal
          recipientId={currentRecipientAvailable ? currentRecipientId : null}
          values={values}
          onApply={(nextValues) =>
            setValues((current) => ({ ...current, ...nextValues }))
          }
          onClose={() => setTableEditorOpen(false)}
        />
      )}

      {patientDetailsOpen && (
        <RegistrationPatientDetailsModal
          values={values}
          onChange={updatePatientDetails}
          onOpenRecipients={openRecipientsFromPatientDetails}
          onSelectRecipient={selectRecipient}
          onClose={() => setPatientDetailsOpen(false)}
        />
      )}

      {registryOpen && (
        <RecipientDatabaseModal
          initialRecipientId={registryRecipientId}
          initialRecipientName={
            registryRecipientId ? (values.recipientName ?? '') : ''
          }
          onUseRecipient={selectRecipient}
          onOpenRecord={(record, recipient) =>
            void openProtocolRecord(record, recipient)
          }
          onOpenRegistrationRecord={(record, recipient) =>
            void openRegistrationRecord(record, recipient)
          }
          onClose={() => {
            setRegistryRecipientId(null);
            setRegistryOpen(false);
          }}
        />
      )}
    </main>
  );
};
