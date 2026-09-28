import { useEffect, useRef, useState } from 'react';
import {
  loadDepartments,
  removeDepartment,
  renameDepartment,
  type DepartmentRecord,
} from '../../storage/repositories/departments';
import { DepartmentHistoryItem } from './department-history-item';
import styles from './protocol-editor.module.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export const DepartmentField = ({ value, onChange }: Props) => {
  const [history, setHistory] = useState<DepartmentRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;

    void loadDepartments()
      .then((items) => {
        if (!active) return;
        setHistory(items);
        setLoadFailed(false);
      })
      .catch((error: unknown) => {
        console.error('Не удалось загрузить отделения:', error);
        if (active) setLoadFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);
  const rename = async (item: DepartmentRecord, name: string) => {
    try {
      const nextName = name.trim();
      const items = await renameDepartment(item.id, nextName);
      setHistory(items);
      if (value === item.name) onChange(nextName);
    } catch (error) {
      console.error('Не удалось изменить отделение:', error);
    }
  };
  const remove = async (item: DepartmentRecord) => {
    const previousHistory = history;
    setHistory((current) => current.filter(({ id }) => id !== item.id));
    if (value === item.name) onChange('');

    try {
      setHistory(await removeDepartment(item.id));
    } catch (error) {
      setHistory(previousHistory);
      console.error('Не удалось удалить отделение:', error);
    }
  };
  const select = (item: DepartmentRecord) => {
    onChange(item.name);
    setOpen(false);
  };
  const emptyText = loadFailed
    ? 'Не удалось загрузить список'
    : loading
      ? 'Загрузка...'
      : 'Сохранённых вариантов нет';

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
        <button
          type="button"
          className={styles.historyToggle}
          aria-label="Показать ранее введённые отделения"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          ▾
        </button>
      </div>

      {open && (
        <div className={styles.historyDropdown}>
          {history.length === 0 ? (
            <div className={styles.historyEmpty}>{emptyText}</div>
          ) : (
            history.map((item) => (
              <DepartmentHistoryItem
                key={item.id}
                item={item}
                onSelect={select}
                onRename={rename}
                onRemove={remove}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
