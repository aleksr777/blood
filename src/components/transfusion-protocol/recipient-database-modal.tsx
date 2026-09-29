import { useEffect, useState } from 'react';
import {
  listProtocolRecords,
  searchRecipients,
  type ProtocolRecord,
  type RecipientRecord,
} from '../../storage/repositories/recipients';
import Modal from '../modal/modal';
import { RecipientHistoryPanel } from './recipient-history-panel';
import { formatDate } from './protocol-types';
import styles from './recipient-database.module.css';

type Props = {
  onClose: () => void;
  onOpenRecord: (record: ProtocolRecord) => void;
  onNewProtocol: (recipient: RecipientRecord) => void;
};

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
          setSelected((current) =>
            current && !items.some(({ id }) => id === current.id) ? null : current,
          );
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

        <RecipientHistoryPanel
          recipient={selected}
          records={records}
          onOpenRecord={onOpenRecord}
          onNewProtocol={onNewProtocol}
        />
      </div>
    </Modal>
  );
};
