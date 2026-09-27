import { useState, type KeyboardEvent } from 'react';
import type { DepartmentRecord } from '../../storage/repositories/departments';
import styles from './protocol-editor.module.css';

type Props = {
  item: DepartmentRecord;
  onSelect: (item: DepartmentRecord) => void;
  onRename: (item: DepartmentRecord, newValue: string) => void;
  onRemove: (item: DepartmentRecord) => void;
};

export const DepartmentHistoryItem = ({ item, onSelect, onRename, onRemove }: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.name);

  const startEditing = () => {
    setDraft(item.name);
    setEditing(true);
  };

  const commit = () => {
    if (!editing) return;

    const nextValue = draft.trim();
    setEditing(false);
    if (nextValue === item.name) return;
    onRename(item, nextValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }

    if (event.key === 'Escape') {
      setDraft(item.name);
      setEditing(false);
      event.currentTarget.blur();
    }
  };

  return (
    <div className={styles.historyRow}>
      {editing ? (
        <input
          autoFocus
          className={styles.historyInput}
          aria-label={`Изменить сохранённое отделение: ${item.name}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <button
          type="button"
          className={styles.historyValue}
          title="Подставить в поле «Отделение»"
          onClick={() => onSelect(item)}
        >
          {item.name}
        </button>
      )}

      <button
        type="button"
        className={styles.historyEdit}
        aria-label={`Изменить отделение: ${item.name}`}
        title="Изменить"
        onClick={startEditing}
      >
        ✎
      </button>
      <button
        type="button"
        className={styles.historyDelete}
        aria-label={`Удалить отделение: ${item.name}`}
        title="Удалить"
        onClick={() => onRemove(item)}
      >
        ×
      </button>
    </div>
  );
};
