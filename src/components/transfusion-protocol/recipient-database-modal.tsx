import { useEffect, useState } from 'react';
import {
  listProtocolRecords,
  searchRecipients,
  type ProtocolRecord,
  type RecipientRecord,
} from '../../storage/repositories/recipients';
import Modal from '../modal/modal';
import { formatDate } from './protocol-types';
import styles from './recipient-database.module.css';

type Props = {
  onClose: () => void;
  onOpenRecord: (record: ProtocolRecord) => void;
  onNewProtocol: (recipient: RecipientRecord) => void;
};

const formatUpdated = (value: number) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));

export const RecipientDatabaseModal = ({ onClose, onOpenRecord, onNewProtocol }: Props) => {
  const [query, setQuery] = useState('');
  const [recipients, setRecipients] = useState<RecipientRecord[]>([]);
  const [selected, setSelected] = useState<RecipientRecord | null>(null);
  const [records, setRecords] = useState<ProtocolRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void searchRecipients(query)
        .then((items) => {
          if (!active) return;
          setRecipients(items);
          if (selected && !items.some(({ id }) => id === selected.id)) setSelected(null);
        })
        .catch((error: unknown) => console.error('Не удалось найти реципиентов:', error))
        .finally(() => active && setLoading(false));
    }, 120);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (!selected) {
      setRecords([]);
      return;
    }
    void listProtocolRecords(selected.id)
      .then(setRecords)
      .catch((error: unknown) => console.error('Не удалось загрузить бланки:', error));
  }, [selected]);

  return (
    <Modal title="База реципиентов" onClose={onClose} className={styles.modal}>
      <div className={styles.body}>
        <section className={styles.panel}>
          <label className={styles.label} htmlFor="recipient-search">
            Поиск по ФИО или дате рождения
          </label>
          <input
            id="recipient-search"
            className={styles.search}
            value={query}
            placeholder="Например: Иванов или 14.03.1980"
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className={styles.list}>
            {loading && <div className={styles.empty}>Поиск...</div>}
            {!loading && recipients.length === 0 && (
              <div className={styles.empty}>Реципиенты не найдены</div>
            )}
            {recipients.map((recipient) => (
              <button
                key={recipient.id}
                type="button"
                className={styles.person}
                data-selected={selected?.id === recipient.id}
                onClick={() => setSelected(recipient)}
              >
                <span className={styles.personName}>{recipient.fullName}</span>
                <span className={styles.meta}>
                  {formatDate(recipient.birthDate)} · бланков: {recipient.protocolCount}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          {!selected ? (
            <div className={styles.empty}>Выберите реципиента слева.</div>
          ) : (
            <>
              <div className={styles.header}>
                <div>
                  <h3 className={styles.title}>{selected.fullName}</h3>
                  <div className={styles.meta}>Дата рождения: {formatDate(selected.birthDate)}</div>
                </div>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => onNewProtocol(selected)}
                >
                  Новый бланк
                </button>
              </div>
              <div className={styles.records}>
                {records.length === 0 && (
                  <div className={styles.empty}>Сохранённых бланков пока нет.</div>
                )}
                {records.map((record) => (
                  <div key={record.id} className={styles.record}>
                    <div>
                      <div className={styles.recordTitle}>
                        Трансфузия: {formatDate(record.values.transfusionDate) || 'дата не указана'}
                      </div>
                      <div className={styles.meta}>Изменён: {formatUpdated(record.updatedAt)}</div>
                    </div>
                    <button
                      type="button"
                      className={styles.open}
                      onClick={() => onOpenRecord(record)}
                    >
                      Открыть
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </Modal>
  );
};
