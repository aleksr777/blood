import { useId, useState } from 'react';
import type { SavedDocumentMode } from '../saved-document/use-document-state';
import styles from './recipient-database.module.css';

export type RecipientArchiveItem = {
  id: number;
  title: string;
  onOpen: (mode: SavedDocumentMode) => void;
  onDelete: () => void;
};

export const RecipientRecordList = ({
  records,
  emptyMessage,
}: {
  records: RecipientArchiveItem[];
  emptyMessage: string;
}) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const actionsId = useId();
  const toggle = (id: number) => setSelectedId((current) => (current === id ? null : id));
  return (
    <div className={styles.records} role="list" aria-label="Сохранённые бланки">
      {records.length === 0 && <div className={styles.empty}>{emptyMessage}</div>}
      {records.map((record) => {
        const selected = selectedId === record.id;
        return (
          <div key={record.id} className={styles.record} role="listitem" data-record-id={record.id}>
            <div
              className={styles.recordSummary}
              role="button"
              tabIndex={0}
              aria-expanded={selected}
              aria-controls={selected ? actionsId : undefined}
              data-selected={selected}
              onClick={() => toggle(record.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  toggle(record.id);
                }
              }}
            >
              <div className={styles.recordTitle}>{record.title}</div>
            </div>
            {selected && (
              <div
                id={actionsId}
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
            )}
          </div>
        );
      })}
    </div>
  );
};
