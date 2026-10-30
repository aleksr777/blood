import { AnimatedReveal } from '../animated-reveal/animated-reveal';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { SavedDocumentMode } from '../saved-document/use-document-state';
import styles from './recipient-database.module.css';

export type RecipientArchiveItem = {
  id: number;
  title: string;
  summary?: ReactNode;
  onOpen: (mode: SavedDocumentMode) => void;
  onDelete: () => void;
};

export const RecipientRecordList = ({
  records,
  emptyMessage,
  initialSelectedId = null,
}: {
  records: RecipientArchiveItem[];
  emptyMessage: string;
  initialSelectedId?: number | null;
}) => {
  const [selectedId, setSelectedId] = useState<number | null>(initialSelectedId);
  const listRef = useRef<HTMLDivElement>(null);
  const restored = useRef(false);
  useEffect(() => {
    if (initialSelectedId === null) return;
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-record-id="${initialSelectedId}"]`);
    if (!list || !row) {
      restored.current = false;
      return;
    }
    if (restored.current) return;
    let frame: number;
    const restore = () => {
      if (!list.clientHeight || row.querySelector('[data-animating="true"]')) {
        frame = window.requestAnimationFrame(restore);
        return;
      }
      const listRect = list.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const top =
        list.scrollTop + rowRect.top - listRect.top - (list.clientHeight - rowRect.height) / 2;
      list.scrollTo?.({ top: Math.max(0, top), behavior: 'auto' });
      restored.current = true;
    };
    frame = window.requestAnimationFrame(restore);
    return () => window.cancelAnimationFrame(frame);
  }, [initialSelectedId, records]);
  const actionsId = useId();
  const toggle = (id: number) => setSelectedId((current) => (current === id ? null : id));
  return (
    <div ref={listRef} className={styles.records} role="list" aria-label="Сохранённые бланки">
      {records.length === 0 && <div className={styles.empty}>{emptyMessage}</div>}
      {records.map((record) => {
        const selected = selectedId === record.id;
        return (
          <div
            key={record.id}
            className={record.summary ? styles.protocolRecord : styles.record}
            role="listitem"
            data-record-id={record.id}
            data-selected={selected}
          >
            <div
              className={record.summary ? styles.protocolSummary : styles.recordSummary}
              role="button"
              tabIndex={0}
              aria-expanded={selected}
              aria-controls={selected ? `${actionsId}-${record.id}` : undefined}
              data-selected={selected}
              onClick={() => toggle(record.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  toggle(record.id);
                }
              }}
            >
              {record.summary ?? <div className={styles.recordTitle}>{record.title}</div>}
            </div>
            <AnimatedReveal open={selected}>
              <div
                id={`${actionsId}-${record.id}`}
                className={styles.recordActions}
                role="group"
                aria-label="Действия с бланком"
              >
                <button type="button" className={styles.open} onClick={() => record.onOpen('view')}>
                  Посмотреть
                </button>
                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={() => record.onOpen('edit')}
                >
                  Редактировать
                </button>
                <button type="button" className={styles.recordDelete} onClick={record.onDelete}>
                  Удалить
                </button>
              </div>
            </AnimatedReveal>
          </div>
        );
      })}
    </div>
  );
};
