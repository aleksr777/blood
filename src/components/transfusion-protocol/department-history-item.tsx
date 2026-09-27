import { useState, type KeyboardEvent } from 'react';
import styles from './protocol-editor.module.css';

type Props = {
  value: string;
  onSelect: (value: string) => void;
  onRename: (oldValue: string, newValue: string) => void;
  onRemove: (value: string) => void;
};

export const DepartmentHistoryItem = ({ value, onSelect, onRename, onRemove }: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const startEditing = () => {
    setDraft(value);
    setEditing(true);
  };

  const commit = () => {
    if (!editing) return;

    const nextValue = draft.trim();
    setEditing(false);
    if (nextValue === value) return;
    onRename(value, nextValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }

    if (event.key === 'Escape') {
      setDraft(value);
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
          aria-label={`Изменить сохранённое отделение: ${value}`}
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
          onClick={() => onSelect(value)}
        >
          {value}
        </button>
      )}

      <button
        type="button"
        className={styles.historyEdit}
        aria-label={`Изменить отделение: ${value}`}
        title="Изменить"
        onClick={startEditing}
      >
        ✎
      </button>
      <button
        type="button"
        className={styles.historyDelete}
        aria-label={`Удалить отделение: ${value}`}
        title="Удалить"
        onClick={() => onRemove(value)}
      >
        ×
      </button>
    </div>
  );
};
