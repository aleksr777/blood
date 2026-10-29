import { useEffect, useRef } from 'react';
import type { RecipientRecord } from '../../storage/repositories/recipients';
import { RecipientListItem } from './recipient-list-item';
import styles from './recipient-database.module.css';

type Props = {
  query: string;
  loading: boolean;
  recipients: RecipientRecord[];
  selected: RecipientRecord | null;
  currentRecipientId?: number | null;
  onUseRecipient?: (recipient: RecipientRecord) => boolean | Promise<boolean>;
  onDisconnectRecipient?: (recipient: RecipientRecord) => void | Promise<void>;
  onQueryChange: (value: string) => void;
  onSelect: (recipient: RecipientRecord) => void;
  onCreate: () => void;
};

export const RecipientListPanel = ({
  query,
  loading,
  recipients,
  selected,
  currentRecipientId = null,
  onUseRecipient,
  onDisconnectRecipient,
  onQueryChange,
  onSelect,
  onCreate,
}: Props) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !selected) return undefined;

    let frame: number;
    const scrollToSelected = () => {
      const item = list.querySelector<HTMLElement>(`[data-recipient-id="${selected.id}"]`);
      if (!item) return;
      if (!list.clientHeight || item.querySelector('[data-animating="true"]')) {
        frame = window.requestAnimationFrame(scrollToSelected);
        return;
      }

      const listRect = list.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const actionBottom =
        item.querySelector('[data-animated-reveal] button')?.getBoundingClientRect().bottom ??
        itemRect.bottom;
      const targetScrollTop = Math.max(
        0,
        list.scrollTop + (itemRect.top - listRect.top) - (list.clientHeight - itemRect.height) / 2,
        list.scrollTop + actionBottom - listRect.bottom,
      );

      list.scrollTo({
        top: targetScrollTop,
        behavior: 'auto',
      });
    };
    frame = window.requestAnimationFrame(scrollToSelected);

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
          <RecipientListItem
            key={recipient.id}
            recipient={recipient}
            selected={selected?.id === recipient.id}
            current={currentRecipientId === recipient.id}
            onSelect={onSelect}
            onUseRecipient={onUseRecipient}
            onDisconnectRecipient={onDisconnectRecipient}
          />
        ))}
      </div>
    </section>
  );
};
