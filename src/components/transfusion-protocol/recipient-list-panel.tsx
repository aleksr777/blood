import type { RecipientRecord } from '../../storage/repositories/recipients';
import styles from './recipient-database.module.css';

type Props = {
  query: string;
  loading: boolean;
  recipients: RecipientRecord[];
  selected: RecipientRecord | null;
  onQueryChange: (value: string) => void;
  onSelect: (recipient: RecipientRecord) => void;
  onCreate: () => void;
};

export const RecipientListPanel = ({
  query,
  loading,
  recipients,
  selected,
  onQueryChange,
  onSelect,
  onCreate,
}: Props) => (
  <section className={styles.panel}>
    <div className={styles.listHeader}>
      <label className={styles.label} htmlFor="recipient-search">
        Поиск по ФИО
      </label>
      <button type="button" className={styles.createRecipient} onClick={onCreate}>
        Новый реципиент
      </button>
    </div>
    <input
      id="recipient-search"
      className={styles.search}
      value={query}
      placeholder="Например: Иванов Иван Иванович"
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
          <span className={styles.meta}>Карточка № {recipient.id} · бланков: {recipient.protocolCount}</span>
        </button>
      ))}
    </div>
  </section>
);
