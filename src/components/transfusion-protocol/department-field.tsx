import { useEffect, useRef, useState } from 'react';
import { DepartmentHistoryItem } from './department-history-item';
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

export const DepartmentField = ({ value, onChange }: Props) => {
  const [history, setHistory] = useState(loadDepartmentHistory);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);

  const rename = (oldValue: string, newValue: string) => {
    const nextValue = newValue.trim();
    setHistory(renameDepartment(oldValue, nextValue));
    if (value === oldValue) onChange(nextValue);
  };

  const remove = (item: string) => {
    const nextHistory = removeDepartment(item);
    setHistory(nextHistory);
    if (nextHistory.length === 0) setOpen(false);
  };

  const select = (item: string) => {
    onChange(item);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={styles.departmentField}>
      <div className={styles.departmentControl}>
        <input
          name="department"
          type="text"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {history.length > 0 && (
          <button
            type="button"
            className={styles.historyToggle}
            aria-label="Показать ранее введённые отделения"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            ▾
          </button>
        )}
      </div>

      {open && history.length > 0 && (
        <div className={styles.historyDropdown}>
          {history.map((item) => (
            <DepartmentHistoryItem
              key={item}
              value={item}
              onSelect={select}
              onRename={rename}
              onRemove={remove}
            />
          ))}
        </div>
      )}
    </div>
  );
};
