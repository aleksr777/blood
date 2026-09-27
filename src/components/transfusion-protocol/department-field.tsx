import { useState, type KeyboardEvent } from 'react';
import {
  loadDepartmentHistory,
  removeDepartment,
  renameDepartment,
} from './department-history';
import styles from './protocol-editor.module.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

type HistoryItemProps = {
  value: string;
  onRename: (oldValue: string, newValue: string) => void;
  onRemove: (value: string) => void;
};

const HistoryItem = ({ value, onRename, onRemove }: HistoryItemProps) => {
  const [draft, setDraft] = useState(value);

  const commit = () => {
    const nextValue = draft.trim();
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
      event.currentTarget.blur();
    }
  };

  return (
    <div className={styles.historyRow}>
      <input
        className={styles.historyInput}
        aria-label={`Изменить сохранённое отделение: ${value}`}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
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

export const DepartmentField = ({ value, onChange }: Props) => {
  const [history, setHistory] = useState(loadDepartmentHistory);

  const rename = (oldValue: string, newValue: string) => {
    const nextValue = newValue.trim();
    setHistory(renameDepartment(oldValue, nextValue));
    if (value === oldValue) onChange(nextValue);
  };

  const remove = (item: string) => {
    setHistory(removeDepartment(item));
  };

  return (
    <div className={styles.departmentField}>
      <input
        name="department"
        type="text"
        list="department-history-options"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id="department-history-options">
        {history.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>

      {history.length > 0 && (
        <div className={styles.history}>
          <div className={styles.historyTitle}>Ранее введённые отделения</div>
          {history.map((item) => (
            <HistoryItem key={item} value={item} onRename={rename} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  );
};
