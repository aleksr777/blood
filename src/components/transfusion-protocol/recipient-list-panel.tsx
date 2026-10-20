import { useEffect, useRef } from 'react';
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
}: Props) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !selected) return undefined;

    const frame = window.requestAnimationFrame(() => {
      const item = list.querySelector<HTMLElement>(
        `[data-recipient-id="${selected.id}"]`,
      );
      if (!item) return;

      const listRect = list.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const targetScrollTop =
        list.scrollTop +
        (itemRect.top - listRect.top) -
        (list.clientHeight - itemRect.height) / 2;

      list.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'auto',
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [recipients, selected]);

  return (
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
      <div ref={listRef} className={styles.list}>
        {loading && <div className={styles.empty}>Поиск...</div>}
        {!loading && recipients.length === 0 && (
          <div className={styles.empty}>Реципиенты не найдены</div>
        )}
        {recipients.map((recipient) => (
          <button
            key={recipient.id}
            type="button"
            className={styles.person}
            data-recipient-id={recipient.id}
            data-selected={selected?.id === recipient.id}
            onClick={() => onSelect(recipient)}
          >
            <span className={styles.personName}>{recipient.fullName}</span>
            <span className={styles.meta}>
              Карточка № {recipient.id} · протоколов: {recipient.protocolCount} · листов регистрации:{' '}
              {recipient.registrationCount} · направлений:{' '}
              {recipient.individualSelectionDirectionCount} · заявок:{' '}
              {recipient.componentRequestCount}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
