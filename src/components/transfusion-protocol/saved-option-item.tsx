import { useState, type KeyboardEvent } from 'react';
import type { SavedOptionRecord } from '../../storage/repositories/saved-options';
import styles from './protocol-editor.module.css';

type Props = {
  item: SavedOptionRecord;
  label: string;
  onSelect: (item: SavedOptionRecord) => void;
  onRename: (item: SavedOptionRecord, value: string) => void;
  onRemove: (item: SavedOptionRecord) => void;
};

export const SavedOptionItem = ({ item, label, onSelect, onRename, onRemove }: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.value);

  const save = () => {
    if (!editing) return;
    const nextValue = draft.trim();
    setEditing(false);
    if (nextValue !== item.value) onRename(item, nextValue);
  };

  const cancel = () => {
    setDraft(item.value);
    setEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      save();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    }
  };

  return (
    <div className={styles.historyRow}>
      {editing ? (
        <input
          autoFocus
          className={styles.historyInput}
          aria-label={`Изменить: ${label}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <button
          type="button"
          className={styles.historyValue}
          title="Подставить значение"
          onClick={() => onSelect(item)}
        >
          {item.value}
        </button>
      )}
      {editing ? (
        <button
          type="button"
          className={styles.historySave}
          aria-label="Сохранить изменение"
          title="Сохранить"
          onClick={save}
        >
          ✓
        </button>
      ) : (
        <button
          type="button"
          className={styles.historyEdit}
          aria-label="Изменить значение"
          title="Изменить"
          onClick={() => {
            setDraft(item.value);
            setEditing(true);
          }}
        >
          ✎
        </button>
      )}
      <button
        type="button"
        className={styles.historyDelete}
        aria-label="Удалить значение"
        title="Удалить"
        onClick={() => onRemove(item)}
      >
        ×
      </button>
    </div>
  );
};
