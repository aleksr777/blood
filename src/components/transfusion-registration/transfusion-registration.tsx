import { useEffect, useState } from 'react';
import {
  adoptCurrentRecipientFromValues,
  hasRecipientProfileDifference,
  mergeRecipientProfileValues,
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
import { clearRecipientLinkedValues } from '../../storage/repositories/recipient-linked-values';
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
import { parseRegistrationTransfusionRows } from './registration-transfusion-table';
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
  const [values, setValues] = useState<ProtocolValues>(() => {
    if (!initialRecord) return {};

    const currentRecipient = readCurrentRecipient();
    const previousRecipientId = initialRecord.recipientId;
    const recipientChanged =
      currentRecipient !== null && currentRecipient.id !== previousRecipientId;
    const baseValues = recipientChanged
      ? clearRecipientLinkedValues(initialRecord.values, previousRecipientId)
      : initialRecord.values;

    return {
      ...baseValues,
      ...(currentRecipient
        ? recipientProfileValuesForForms(currentRecipient)
        : {
            recipientId: String(previousRecipientId),
          }),
    };
  });
  const [recordId, setRecordId] = useState<number | null>(() => {
    if (!initialRecord) return null;

    const currentRecipient = readCurrentRecipient();
    if (!currentRecipient) return initialRecord.id;

    const recipientChanged = currentRecipient.id !== initialRecord.recipientId;
    const profileChanged =
      recipientChanged || hasRecipientProfileDifference(initialRecord.values, currentRecipient);

    return profileChanged ? null : initialRecord.id;
  });
  const [draftLoaded, setDraftLoaded] = useState(Boolean(initialRecord));
  const [registryOpen, setRegistryOpen] = useState(false);
  const [registryRecipientId, setRegistryRecipientId] = useState<number | null>(null);
  const [patientDetailsOpen, setPatientDetailsOpen] = useState(false);
  const [tableEditorOpen, setTableEditorOpen] = useState(false);
  const [status, setStatus] = useState('');

  const currentRecipientId = Number(values.recipientId);
  const currentRecipientAvailable = Number.isFinite(currentRecipientId) && currentRecipientId > 0;
  const storedCurrentRecipient = readCurrentRecipient();
  const currentRecipientProfile =
    storedCurrentRecipient?.id === currentRecipientId ? storedCurrentRecipient.profile : {};
  const birthDateParts = getBirthDateParts(values.recipientBirthDate);
  const recipientAge = formatRecipientAge(values.recipientBirthDate);
  const registrationRows = parseRegistrationTransfusionRows(values);

  useEffect(() => {
    if (initialRecord) {
      window.sessionStorage.removeItem(PENDING_REGISTRATION_RECORD_KEY);
      return;
    }

    let active = true;
    void loadRegistrationDraft()
      .then((draft) => {
        if (!active) return;

        if (Object.keys(draft.values).length > 0) {
          const currentRecipient = readCurrentRecipient();

          if (!currentRecipient) {
            if (draft.registrationRecordId === null) {
              adoptCurrentRecipientFromValues(draft.values);
            }
            setValues(draft.values);
            setRecordId(draft.registrationRecordId);
            return;
          }

          const previousRecipientId = Number(draft.values.recipientId);
          const recipientChanged =
            Number.isFinite(previousRecipientId) &&
            previousRecipientId > 0 &&
            previousRecipientId !== currentRecipient.id;
          const baseValues = recipientChanged
            ? clearRecipientLinkedValues(draft.values, previousRecipientId)
            : draft.values;
          const profileChanged =
            recipientChanged || hasRecipientProfileDifference(draft.values, currentRecipient);

          setValues({
            ...baseValues,
            ...recipientProfileValuesForForms(currentRecipient),
          });
          setRecordId(
            profileChanged && draft.registrationRecordId !== null
              ? null
              : draft.registrationRecordId,
          );
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

      setRecordId(result.registrationRecordId);
      setValues(result.registrationValues);

      if (result.changed) {
        setStatus(
          result.protocolSaved || result.registrationSaved
            ? 'Бланки предыдущего реципиента автоматически сохранены. Выбран новый реципиент.'
            : `Выбран реципиент: ${recipient.fullName}.`,
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

  const openRegistrationRecord = async (record: RegistrationRecord, recipient: RecipientRecord) => {
    const switched = await selectRecipient(recipient);
    if (!switched) return;

    const currentRecipient = readCurrentRecipient();
    const profileChanged = currentRecipient
      ? hasRecipientProfileDifference(record.values, currentRecipient)
      : false;

    setRecordId(profileChanged ? null : record.id);
    setValues({
      ...record.values,
      ...(currentRecipient
        ? recipientProfileValuesForForms(currentRecipient)
        : {
            recipientId: String(record.recipientId),
          }),
    });
    setRegistryRecipientId(null);
    setRegistryOpen(false);
    setStatus(
      profileChanged
        ? 'Сохранённый лист регистрации открыт с актуальными данными текущего реципиента. При сохранении будет создан новый бланк.'
        : 'Сохранённый лист регистрации открыт.',
    );
  };

  const openProtocolRecord = async (record: ProtocolRecord, recipient: RecipientRecord) => {
    const switched = await selectRecipient(recipient);
    if (!switched) return;

    try {
      const currentRecipient = readCurrentRecipient();
      const profileChanged = currentRecipient
        ? hasRecipientProfileDifference(record.values, currentRecipient)
        : false;

      await saveProtocolDraft({
        values: currentRecipient
          ? mergeRecipientProfileValues(record.values, currentRecipient)
          : { ...record.values, recipientId: String(record.recipientId) },
        protocolRecordId: profileChanged ? null : record.id,
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

    if (recordId !== null) {
      setStatus(
        afterPrint
          ? 'Сохранённый лист регистрации не изменён.'
          : 'Сохранённый лист регистрации не изменён. Исходная запись оставлена без изменений.',
      );
      return true;
    }

    try {
      const record = await saveRegistrationRecord(values);
      setRecordId(record.id);
      const savedValues = {
        ...values,
        recipientId: String(record.recipientId),
      };
      setValues(savedValues);
      adoptCurrentRecipientFromValues(savedValues);
      setStatus(
        afterPrint ? 'Лист регистрации сохранён после печати.' : 'Лист регистрации сохранён.',
      );
      return true;
    } catch (error) {
      console.error('Не удалось сохранить лист регистрации:', error);
      setStatus(error instanceof Error ? error.message : 'Не удалось сохранить лист регистрации.');
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
    const storedRecipient = readCurrentRecipient();
    setRegistryRecipientId(
      storedRecipient?.id ?? (currentRecipientAvailable ? currentRecipientId : null),
    );
    setRegistryOpen(true);
  };

  const updatePatientDetails = (nextValues: ProtocolValues) => {
    if (!Object.entries(nextValues).some(([key, value]) => (values[key] ?? '') !== value)) return;
    const editingSavedRecord = recordId !== null;
    if (editingSavedRecord) {
      setRecordId(null);
    }

    const merged = { ...values, ...nextValues };
    setValues(merged);

    void syncCurrentRecipientProfile(nextValues, {
      kind: 'registration',
      values: merged,
      recordId: editingSavedRecord ? null : recordId,
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

  const handleRecipientDeleted = (recipientId: number) => {
    if (Number(values.recipientId) !== recipientId) return;

    setRecordId(null);
    setValues(clearRecipientLinkedValues(values, recipientId));
    setRegistryRecipientId(null);
    setStatus('Реципиент удалён. Связанные с ним данные удалены из текущего листа регистрации.');
  };

  const handleRecipientDisconnected = (recipientId: number) => {
    if (Number(values.recipientId) !== recipientId) return;

    setRecordId(null);
    setValues(clearRecipientLinkedValues(values, recipientId));
    setRegistryRecipientId(null);
    setStatus(
      'Текущий реципиент отключён. Связанные с ним данные удалены из текущего листа регистрации.',
    );
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
              Приложение № 3 к приказу Министерства здравоохранения Российской Федерации от 5
              августа 2022 г. № 530н
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
              <span className="registration-blank registration-blank--age">{recipientAge}</span>
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
          onApply={(nextValues) => {
            if (recordId !== null) {
              setRecordId(null);
            }
            setValues((current) => ({ ...current, ...nextValues }));
          }}
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
          initialRecipientName={readCurrentRecipient()?.fullName ?? values.recipientName ?? ''}
          onUseRecipient={selectRecipient}
          onOpenRecord={(record, recipient) => void openProtocolRecord(record, recipient)}
          onOpenRegistrationRecord={(record, recipient) =>
            void openRegistrationRecord(record, recipient)
          }
          onRecipientDeleted={handleRecipientDeleted}
          onRecipientDisconnected={handleRecipientDisconnected}
          onClose={() => {
            setRegistryRecipientId(null);
            setRegistryOpen(false);
          }}
        />
      )}
    </main>
  );
};
