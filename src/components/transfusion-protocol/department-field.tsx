import { useState } from 'react';
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
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {history.length > 0 && (
        <div className={styles.history}>
          <div className={styles.historyTitle}>Ранее введённые отделения</div>
          {history.map((item) => (
            <DepartmentHistoryItem
              key={item}
              value={item}
              onSelect={onChange}
              onRename={rename}
              onRemove={remove}
            />
          ))}
        </div>
      )}
    </div>
  );
};
