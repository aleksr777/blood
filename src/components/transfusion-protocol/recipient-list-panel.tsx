import type { RecipientRecord } from '../../storage/repositories/recipients';
import { formatDate } from './protocol-types';
import styles from './recipient-database.module.css';

type Props = {
  query: string;
  loading: boolean;
  recipients: RecipientRecord[];
  selected: RecipientRecord | null;
  onQueryChange: (value: string) => void;
  onSelect: (recipient: RecipientRecord) => void;
};

export const RecipientListPanel = ({
  query,
  loading,
  recipients,
  selected,
  onQueryChange,
  onSelect,
}: Props) => (
  <section className={styles.panel}>
    <label className={styles.label} htmlFor="recipient-search">
      Поиск по ФИО или дате рождения
    </label>
    <input
      id="recipient-search"
      className={styles.search}
      value={query}
      placeholder="Например: Иванов или 14.03.1980"
      onChange={(event) => onQueryChange(event.target.value)}
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
          onClick={() => onSelect(recipient)}
        >
          <span className={styles.personName}>{recipient.fullName}</span>
          <span className={styles.meta}>
            {formatDate(recipient.birthDate)} · бланков: {recipient.protocolCount}
          </span>
        </button>
      ))}
    </div>
  </section>
);
