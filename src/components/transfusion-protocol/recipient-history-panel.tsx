import { useEffect, useState } from 'react';
import type {
  BloodRequestRecord,
  ProtocolRecord,
  RecipientRecord,
  RegistrationRecord,
} from '../../storage/repositories/recipients';
import { formatRecipientAge } from './recipient-demographics';
import { formatDate } from './protocol-types';
import styles from './recipient-database.module.css';

type Props = {
  recipient: RecipientRecord | null;
  records: ProtocolRecord[];
  registrationRecords: RegistrationRecord[];
  individualSelectionDirectionRecords: BloodRequestRecord[];
  componentRequestRecords: BloodRequestRecord[];
  onOpenRecord?: (record: ProtocolRecord, recipient: RecipientRecord) => void;
  onOpenRegistrationRecord?: (
    record: RegistrationRecord,
    recipient: RecipientRecord,
  ) => void;
  onOpenIndividualSelectionDirectionRecord?: (
    record: BloodRequestRecord,
    recipient: RecipientRecord,
  ) => void;
  onOpenComponentRequestRecord?: (
    record: BloodRequestRecord,
    recipient: RecipientRecord,
  ) => void;
  onUseRecipient?: (recipient: RecipientRecord) => boolean | Promise<boolean>;
  onDisconnectRecipient?: (recipient: RecipientRecord) => void | Promise<void>;
  currentRecipientId?: number | null;
  onEdit: (recipient: RecipientRecord) => void;
  onDelete: (recipient: RecipientRecord) => void;
  onDeleteRecord: (record: ProtocolRecord) => void;
  onDeleteRegistrationRecord: (record: RegistrationRecord) => void;
  onDeleteBloodRequestRecord: (record: BloodRequestRecord) => void;
};

type RecordCategory =
  | 'protocols'
  | 'registrations'
  | 'individual-selection-directions'
  | 'component-requests';

const formatUpdated = (value: number) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));

const stringValue = (record: BloodRequestRecord, name: string) => {
  const value = record.values[name];
  return typeof value === 'string' ? value : '';
};

const requestRecordTitle = (record: BloodRequestRecord) => {
  const date = formatDate(stringValue(record, 'directionDate'));
  const component = stringValue(record, 'requiredComponent').trim();

  return [date || 'дата не указана', component].filter(Boolean).join(' · ');
};

export const RecipientHistoryPanel = ({
  recipient,
  records,
  registrationRecords,
  individualSelectionDirectionRecords,
  componentRequestRecords,
  onOpenRecord,
  onOpenRegistrationRecord,
  onOpenIndividualSelectionDirectionRecord,
  onOpenComponentRequestRecord,
  onUseRecipient,
  onDisconnectRecipient,
  currentRecipientId = null,
  onEdit,
  onDelete,
  onDeleteRecord,
  onDeleteRegistrationRecord,
  onDeleteBloodRequestRecord,
}: Props) => {
  const [category, setCategory] = useState<RecordCategory | null>(null);
  const demographics = recipient
    ? [
        recipient.profile.recipientBirthDate
          ? `Дата рождения: ${formatDate(recipient.profile.recipientBirthDate)}`
          : '',
        recipient.profile.recipientSex
          ? `Пол: ${recipient.profile.recipientSex}`
          : '',
        recipient.profile.recipientBirthDate
          ? `Возраст: ${formatRecipientAge(recipient.profile.recipientBirthDate)}`
          : '',
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  useEffect(() => {
    setCategory(null);
  }, [recipient?.id]);

  const requestRecords =
    category === 'individual-selection-directions'
      ? individualSelectionDirectionRecords
      : componentRequestRecords;
  const requestOpen =
    category === 'individual-selection-directions'
      ? onOpenIndividualSelectionDirectionRecord
      : onOpenComponentRequestRecord;

  const categoryHeading =
    category === 'protocols'
      ? 'Протоколы трансфузии'
      : category === 'registrations'
        ? 'Листы регистрации трансфузий'
        : category === 'individual-selection-directions'
          ? 'Направления на индивидуальный подбор'
          : 'Заявки в трансфузиологический кабинет';

  return (
    <section className={styles.panel}>
      {!recipient ? (
        <div className={styles.empty}>Выберите реципиента слева.</div>
      ) : (
        <>
          <div className={styles.header}>
            <div>
              <h3 className={styles.title}>{recipient.fullName}</h3>
              <div className={styles.meta}>Карточка № {recipient.id}</div>
              {demographics && <div className={styles.meta}>{demographics}</div>}
            </div>
            <div className={styles.headerActions}>
              {onUseRecipient && (
                <button
                  type="button"
                  className={styles.action}
                  disabled={recipient.id === currentRecipientId}
                  onClick={() => onUseRecipient(recipient)}
                >
                  Выбрать
                </button>
              )}
              {onDisconnectRecipient && recipient.id === currentRecipientId && (
                <button
                  type="button"
                  className={styles.disconnectAction}
                  title="Снять реципиента как текущего"
                  onClick={() => onDisconnectRecipient(recipient)}
                >
                  Отключить
                </button>
              )}
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={() => onEdit(recipient)}
              >
                Редактировать
              </button>
              <button
                type="button"
                className={styles.dangerAction}
                onClick={() => onDelete(recipient)}
              >
                Удалить
              </button>
            </div>
          </div>

          {category === null ? (
            <div className={styles.categories} aria-label="Категории бланков">
              <button
                type="button"
                className={styles.categoryButton}
                onClick={() => setCategory('protocols')}
              >
                <span className={styles.categoryTitle}>Протоколы трансфузии</span>
                <span className={styles.categoryMeta}>
                  Сохранено: {recipient.protocolCount}
                </span>
              </button>

              <button
                type="button"
                className={styles.categoryButton}
                onClick={() => setCategory('registrations')}
              >
                <span className={styles.categoryTitle}>
                  Листы регистрации трансфузий
                </span>
                <span className={styles.categoryMeta}>
                  Сохранено: {recipient.registrationCount}
                </span>
              </button>

              <button
                type="button"
                className={styles.categoryButton}
                onClick={() => setCategory('individual-selection-directions')}
              >
                <span className={styles.categoryTitle}>
                  Направления на индивидуальный подбор
                </span>
                <span className={styles.categoryMeta}>
                  Сохранено: {recipient.individualSelectionDirectionCount}
                </span>
              </button>

              <button
                type="button"
                className={styles.categoryButton}
                onClick={() => setCategory('component-requests')}
              >
                <span className={styles.categoryTitle}>
                  Заявки в трансфузиологический кабинет
                </span>
                <span className={styles.categoryMeta}>
                  Сохранено: {recipient.componentRequestCount}
                </span>
              </button>
            </div>
          ) : (
            <>
              <div className={styles.categoryHeader}>
                <button
                  type="button"
                  className={styles.categoryBack}
                  onClick={() => setCategory(null)}
                >
                  ← К категориям
                </button>
                <div className={styles.categoryHeading}>{categoryHeading}</div>
              </div>

              {category === 'protocols' ? (
                <div className={styles.records}>
                  {records.length === 0 && (
                    <div className={styles.empty}>
                      Сохранённых протоколов пока нет.
                    </div>
                  )}
                  {records.map((record) => (
                    <div key={record.id} className={styles.record}>
                      <div>
                        <div className={styles.recordTitle}>
                          Трансфузия:{' '}
                          {formatDate(record.values.transfusionDate) ||
                            'дата не указана'}
                        </div>
                        <div className={styles.meta}>
                          Изменён: {formatUpdated(record.updatedAt)}
                        </div>
                      </div>
                      <div className={styles.recordActions}>
                        {onOpenRecord && (
                          <button
                            type="button"
                            className={styles.open}
                            onClick={() => onOpenRecord(record, recipient)}
                          >
                            Открыть
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.recordDelete}
                          onClick={() => onDeleteRecord(record)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : category === 'registrations' ? (
                <div className={styles.records}>
                  {registrationRecords.length === 0 && (
                    <div className={styles.empty}>
                      Сохранённых листов регистрации трансфузий пока нет.
                    </div>
                  )}
                  {registrationRecords.map((record) => (
                    <div key={record.id} className={styles.record}>
                      <div>
                        <div className={styles.recordTitle}>
                          Лист регистрации
                        </div>
                        <div className={styles.meta}>
                          Изменён: {formatUpdated(record.updatedAt)}
                        </div>
                      </div>
                      <div className={styles.recordActions}>
                        {onOpenRegistrationRecord && (
                          <button
                            type="button"
                            className={styles.open}
                            onClick={() =>
                              onOpenRegistrationRecord(record, recipient)
                            }
                          >
                            Открыть
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.recordDelete}
                          onClick={() => onDeleteRegistrationRecord(record)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.records}>
                  {requestRecords.length === 0 && (
                    <div className={styles.empty}>
                      Сохранённых бланков пока нет.
                    </div>
                  )}
                  {requestRecords.map((record) => (
                    <div key={record.id} className={styles.record}>
                      <div>
                        <div className={styles.recordTitle}>
                          {requestRecordTitle(record)}
                        </div>
                        <div className={styles.meta}>
                          Изменён: {formatUpdated(record.updatedAt)}
                        </div>
                      </div>
                      <div className={styles.recordActions}>
                        {requestOpen && (
                          <button
                            type="button"
                            className={styles.open}
                            onClick={() => requestOpen(record, recipient)}
                          >
                            Открыть
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.recordDelete}
                          onClick={() => onDeleteBloodRequestRecord(record)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
};
