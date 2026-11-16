import { FormInput } from '../form-input/form-input';
import { useRef, useState } from 'react';
import type { DepartmentRecord } from '../../storage/repositories/departments';
import { useDepartmentHistory } from './use-department-history';
import { DepartmentHistoryItem } from './department-history-item';
import { EmptyInputOption } from './empty-input-option';
import { useOverlayDropdown } from './use-overlay-dropdown';
import styles from './protocol-editor.module.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export const DepartmentField = ({ value, onChange }: Props) => {
  const { history, loading, loadFailed, isolated, rename, remove } = useDepartmentHistory(
    value,
    onChange,
  );
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { rootRef, dropdownState } = useOverlayDropdown(open, setOpen);
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
        <FormInput
          ref={inputRef}
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

      <div
        className={styles.historyDropdown}
        data-state={dropdownState}
        aria-hidden={dropdownState !== 'open'}
      >
        <EmptyInputOption
          label="Отделение"
          onSelect={() => {
            onChange('');
            setOpen(false);
            inputRef.current?.focus();
          }}
        />
        {history.length === 0 ? (
          <div className={styles.historyEmpty}>{emptyText}</div>
        ) : (
          history.map((item) => (
            <DepartmentHistoryItem
              editable={!isolated}
              key={item.id}
              item={item}
              onSelect={select}
              onRename={rename}
              onRemove={remove}
            />
          ))
        )}
      </div>
    </div>
  );
};
