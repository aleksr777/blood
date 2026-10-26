import { AnimatedMessage } from '../animated-reveal/animated-message';
import { SavedDocumentPage } from '../saved-document/saved-document-page';
import { savedDocumentTitle } from '../saved-document/saved-document-title';
import { useSavedDocumentList } from '../saved-document/saved-document-list';
import ui from '../../styles/ui';
import { useEffect, useState } from 'react';
import {
  adoptCurrentRecipientFromValues,
  hasRecipientProfileDifference,
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
import { clearRecipientLinkedValues } from '../../storage/repositories/recipient-linked-values';
import {
  saveRegistrationRecord,
  updateRegistrationRecord,
  type RecipientRecord,
  type RegistrationRecord,
} from '../../storage/repositories/recipients';
import { useDocumentState, type SavedDocumentMode } from '../saved-document/use-document-state';
import { usePendingSavedDocument } from '../saved-document/saved-document-navigation';
import { SavedDocumentBar } from '../saved-document/saved-document-bar';
import { clearRegistrationTable } from '../saved-document/working-form-cleanup';
import { SiteNavigation } from '../site-navigation/site-navigation';
import { formatRecipientAge } from '../transfusion-protocol/recipient-demographics';
import { RecipientDatabaseModal } from '../transfusion-protocol/recipient-database-modal';
import { formatDate, type ProtocolValues } from '../transfusion-protocol/protocol-types';
import { RegistrationPatientDetailsModal } from './registration-patient-details-modal';
import { parseRegistrationTransfusionRows } from './registration-transfusion-table';
import { RegistrationTransfusionsModal } from './registration-transfusions-modal';

const ROW_COUNT = 14;
export const TransfusionRegistration = () => {
  const documentState = useDocumentState<ProtocolValues>(() => ({}), clearRegistrationTable);
  const {
    values,
    setValues,
    open: openSavedDocument,
    setWorkingValues,
    isActive: hasSavedDocument,
  } = documentState;
  const [recordId, setRecordId] = useState<number | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [registryOpen, setRegistryOpen] = useState(false);
  const savedList = useSavedDocumentList({
    kind: 'registration',
    record: documentState.record,
    open: registryOpen,
    onOpen: () => setRegistryOpen(true),
  });
  const [registryRecipientId, setRegistryRecipientId] = useState<number | null>(null);
  const [patientDetailsOpen, setPatientDetailsOpen] = useState(false);
  const [tableEditorOpen, setTableEditorOpen] = useState(false);
  const [status, setStatus] = useState('');

  const currentRecipientId = Number(values.recipientId);
  const currentRecipientAvailable = Number.isFinite(currentRecipientId) && currentRecipientId > 0;
  const storedCurrentRecipient = readCurrentRecipient();
  const recipientBirthDate = formatDate(values.recipientBirthDate);
  const savedAt = documentState.record?.createdAt ?? documentState.record?.updatedAt;
  const savedDate = savedAt ? new Date(savedAt).toISOString().slice(0, 10) : undefined;
  const recipientAge = documentState.active
    ? (values.recipientAge ??
      (savedDate ? formatRecipientAge(values.recipientBirthDate, savedDate) : ''))
    : formatRecipientAge(values.recipientBirthDate);
  const registrationRows = parseRegistrationTransfusionRows(values);

  usePendingSavedDocument('registration', (record, mode) => {
    void openRegistrationRecord(record, mode);
  });

  useEffect(() => {
    let active = true;
    void loadRegistrationDraft()
      .then((draft) => {
        if (!active) return;

        if (draft.registrationRecordId !== null) {
          if (!hasSavedDocument())
            openSavedDocument(
              { id: draft.registrationRecordId, recipientId: Number(draft.values.recipientId) },
              draft.values,
            );
          const recipient = readCurrentRecipient();
          setWorkingValues(recipient ? recipientProfileValuesForForms(recipient) : {});
          setRecordId(null);
          return;
        }
        if (Object.keys(draft.values).length > 0) {
          const currentRecipient = readCurrentRecipient();

          if (!currentRecipient) {
            if (draft.registrationRecordId === null) {
              adoptCurrentRecipientFromValues(draft.values);
            }
            setWorkingValues(draft.values);
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

          setWorkingValues({
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
          setWorkingValues(recipientProfileValuesForForms(currentRecipient));
        }
      })
      .catch((error: unknown) =>
        console.error('Не удалось загрузить текущий лист регистрации:', error),
      )
      .finally(() => active && setDraftLoaded(true));

    return () => {
      active = false;
    };
  }, [openSavedDocument, setWorkingValues, hasSavedDocument]);

  useEffect(() => {
    if (!draftLoaded) return;

    if (Object.keys(documentState.workingValues).length === 0) {
      void clearRegistrationDraft().catch((error: unknown) =>
        console.error('Не удалось очистить текущий лист регистрации:', error),
      );
      return;
    }

    void saveRegistrationDraft({
      values: documentState.workingValues,
      registrationRecordId: recordId,
      updatedAt: Date.now(),
    }).catch((error: unknown) =>
      console.error('Не удалось сохранить текущий лист регистрации:', error),
    );
  }, [draftLoaded, recordId, documentState.workingValues]);

  const selectRecipient = async (recipient: RecipientRecord) => {
    try {
      documentState.close();
      const result = await switchCurrentRecipient(recipient, {
        kind: 'registration',
        values: documentState.workingValues,
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

  const openRegistrationRecord = async (
    record: RegistrationRecord,
    mode: SavedDocumentMode = 'view',
  ) => {
    documentState.open(record, record.values, mode);
    setPatientDetailsOpen(false);
    setTableEditorOpen(false);
    setRegistryRecipientId(null);
    setRegistryOpen(false);
    setStatus('');
  };

  const save = async (afterPrint = false) => {
    if (documentState.active) {
      if (afterPrint || !documentState.editing || !documentState.record) return true;
      try {
        const record = await updateRegistrationRecord(documentState.record.id, {
          ...values,
          recipientId: String(documentState.record.recipientId),
        });
        documentState.open(record, record.values);
        documentState.setWorkingValues(clearRegistrationTable);
        setPatientDetailsOpen(false);
        setTableEditorOpen(false);
        setStatus('Изменения сохранены в исходном листе регистрации.');
        return true;
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Не удалось сохранить изменения.');
        return false;
      }
    }
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
      const record = await saveRegistrationRecord({
        ...values,
        recipientAge: formatRecipientAge(values.recipientBirthDate),
      });
      setRecordId(record.id);
      const savedValues = {
        ...record.values,
        recipientId: String(record.recipientId),
      };
      setValues(savedValues);
      adoptCurrentRecipientFromValues(savedValues);
      documentState.open(record, savedValues);
      documentState.setWorkingValues(clearRegistrationTable(savedValues));
      setRecordId(null);
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
    if (documentState.active) return;
    const currentRecipient = readCurrentRecipient();
    setValues(currentRecipient ? recipientProfileValuesForForms(currentRecipient) : {});
    setRecordId(null);
    setRegistryRecipientId(null);
    setStatus('');
  };

  const openRecipients = () => {
    const storedRecipient = readCurrentRecipient();
    setRegistryRecipientId(
      storedRecipient?.id ?? (currentRecipientAvailable ? currentRecipientId : null),
    );
    setRegistryOpen(true);
  };

  const updatePatientDetails = (nextValues: ProtocolValues) => {
    if (documentState.active) {
      setValues((current) => ({
        ...current,
        ...nextValues,
        ...('recipientBirthDate' in nextValues
          ? {
              recipientAge: savedDate
                ? formatRecipientAge(nextValues.recipientBirthDate, savedDate)
                : '',
            }
          : {}),
      }));
      return;
    }
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
    const recipient = readCurrentRecipient();
    if (!recipient) return;
    setRegistryRecipientId(recipient.id);
    setRegistryOpen(true);
  };

  const handleRecipientDeleted = (recipientId: number) => {
    if (documentState.record?.recipientId === recipientId) documentState.close();
    if (Number(documentState.workingValues.recipientId) !== recipientId) return;

    setRecordId(null);
    documentState.setWorkingValues(
      clearRecipientLinkedValues(documentState.workingValues, recipientId),
    );
    setRegistryRecipientId(null);
    setStatus('Реципиент удалён. Связанные с ним данные удалены из текущего листа регистрации.');
  };

  const handleRecipientDisconnected = (recipientId: number) => {
    if (Number(documentState.workingValues.recipientId) !== recipientId) return;

    setRecordId(null);
    documentState.setWorkingValues(
      clearRecipientLinkedValues(documentState.workingValues, recipientId),
    );
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
    <SavedDocumentPage className="registration-app-shell" mode={documentState.mode}>
      <header className="app-header registration-header">
        <div className="toolbar-wrap">
          <SiteNavigation
            current="registration"
            showRecipient={!documentState.active}
            recipientName={storedCurrentRecipient?.fullName ?? ''}
            recipientAbo={storedCurrentRecipient?.profile.recipientAbo ?? ''}
            recipientRh={storedCurrentRecipient?.profile.recipientRh ?? ''}
            currentRecipientAvailable={Boolean(storedCurrentRecipient)}
            onOpenCurrentRecipient={openCurrentRecipient}
          />
          <SavedDocumentBar
            onReturnToList={savedList.returnToList}
            document={documentState}
            title={savedDocumentTitle('registration', values)}
          />
          <div className="print-actions" aria-label="Панель действий">
            {!documentState.active && (
              <button
                type="button"
                className={`${ui.dangerButton} ${ui.toolbarButton} clear-button`}
                onClick={clearBlank}
              >
                Очистить бланк
              </button>
            )}
            <button
              type="button"
              className={`${ui.secondaryButton} ${ui.toolbarButton} secondary-button`}
              onClick={openRecipients}
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
              onClick={print}
            >
              Печать страницы 1
            </button>
          </div>
          <AnimatedMessage message={status} className="toolbar-status" />
        </div>
      </header>

      <div className="registration-sheet-wrap" data-document-paper>
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
            role={documentState.readOnly ? undefined : 'button'}
            tabIndex={documentState.readOnly ? -1 : 0}
            aria-label="Данные реципиента. Нажмите для заполнения"
            onClick={() => !documentState.readOnly && setPatientDetailsOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (!documentState.readOnly) setPatientDetailsOpen(true);
              }
            }}
          >
            <div className="registration-patient-line registration-patient-line--name">
              <span>Фамилия, имя, отчество (при наличии):</span>
              <span className="registration-blank registration-blank--name">
                {values.recipientName ?? ''}
              </span>
            </div>

            <div className="registration-patient-line registration-patient-line--meta">
              <span className="registration-meta-group">
                <span>Дата рождения:</span>
                <span className="registration-blank registration-blank--date">
                  {recipientBirthDate}
                </span>
              </span>
              <span className="registration-meta-group">
                <span>Пол:</span>
                <span className="registration-blank registration-blank--sex">
                  {values.recipientSex ?? ''}
                </span>
              </span>
              <span className="registration-meta-group">
                <span>Возраст:</span>
                <span className="registration-blank registration-blank--age">{recipientAge}</span>
              </span>
              <span className="registration-meta-group">
                <span>№ медицинской карты:</span>
                <span className="registration-blank registration-blank--card">
                  {values.medicalRecordNumber ?? ''}
                </span>
              </span>
              <span>№ палаты</span>
              <span className="registration-blank registration-blank--room" />
            </div>
          </div>

          <div
            className="registration-table-section"
            role={documentState.readOnly ? undefined : 'button'}
            tabIndex={documentState.readOnly ? -1 : 0}
            aria-label="Таблица регистрации трансфузий. Нажмите для заполнения"
            onClick={() => !documentState.readOnly && setTableEditorOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (!documentState.readOnly) setTableEditorOpen(true);
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

      {tableEditorOpen && !documentState.readOnly && (
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

      {patientDetailsOpen && !documentState.readOnly && (
        <RegistrationPatientDetailsModal
          values={{ ...values, recipientAge }}
          savedDocument={documentState.active}
          onChange={updatePatientDetails}
          onOpenRecipients={openRecipientsFromPatientDetails}
          onSelectRecipient={documentState.active ? () => false : selectRecipient}
          onClose={() => setPatientDetailsOpen(false)}
        />
      )}

      {registryOpen && (
        <RecipientDatabaseModal
          initialList={savedList.initialList}
          initialRecipientId={registryRecipientId}
          initialRecipientName={readCurrentRecipient()?.fullName ?? values.recipientName ?? ''}
          onUseRecipient={selectRecipient}
          onOpenRegistrationRecord={(record, _recipient, mode) =>
            void openRegistrationRecord(record, mode)
          }
          onRecipientDeleted={handleRecipientDeleted}
          onRecipientDisconnected={handleRecipientDisconnected}
          onClose={() => {
            setRegistryRecipientId(null);
            setRegistryOpen(false);
          }}
        />
      )}
    </SavedDocumentPage>
  );
};
