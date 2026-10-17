import { useEffect, useState } from 'react';
import type {
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
  onOpenRecord?: (record: ProtocolRecord, recipient: RecipientRecord) => void;
  onOpenRegistrationRecord?: (
    record: RegistrationRecord,
    recipient: RecipientRecord,
  ) => void;
  onUseRecipient?: (recipient: RecipientRecord) => boolean | Promise<boolean>;
  onEdit: (recipient: RecipientRecord) => void;
  onDelete: (recipient: RecipientRecord) => void;
  onDeleteRecord: (record: ProtocolRecord) => void;
  onDeleteRegistrationRecord: (record: RegistrationRecord) => void;
};

type RecordCategory = 'protocols' | 'registrations';

const formatUpdated = (value: number) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));

export const RecipientHistoryPanel = ({
  recipient,
  records,
  registrationRecords,
  onOpenRecord,
  onOpenRegistrationRecord,
  onUseRecipient,
  onEdit,
  onDelete,
  onDeleteRecord,
  onDeleteRegistrationRecord,
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
                  onClick={() => onUseRecipient(recipient)}
                >
                  Выбрать
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
                <span className={styles.categoryTitle}>Листы регистрации трансфузий</span>
                <span className={styles.categoryMeta}>
                  Сохранено: {recipient.registrationCount}
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
                <div className={styles.categoryHeading}>
                  {category === 'protocols'
                    ? 'Протоколы трансфузии'
                    : 'Листы регистрации трансфузий'}
                </div>
              </div>

              {category === 'protocols' ? (
                <div className={styles.records}>
                  {records.length === 0 && (
                    <div className={styles.empty}>Сохранённых протоколов пока нет.</div>
                  )}
                  {records.map((record) => (
                    <div key={record.id} className={styles.record}>
                      <div>
                        <div className={styles.recordTitle}>
                          Трансфузия: {formatDate(record.values.transfusionDate) || 'дата не указана'}
                        </div>
                        <div className={styles.meta}>Изменён: {formatUpdated(record.updatedAt)}</div>
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
              ) : (
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
                            onClick={() => onOpenRegistrationRecord(record, recipient)}
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
              )}
            </>
          )}
        </>
      )}
    </section>
  );
};
