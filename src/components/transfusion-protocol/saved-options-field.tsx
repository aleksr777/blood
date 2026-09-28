import { useEffect, useRef, useState } from 'react';
import {
  loadSavedOptions,
  removeSavedOption,
  renameSavedOption,
  type SavedOptionRecord,
} from '../../storage/repositories/saved-options';
import { SavedOptionItem } from './saved-option-item';
import styles from './protocol-editor.module.css';

type Props = {
  name: string;
  label: string;
  category: string;
  value: string;
  onChange: (value: string) => void;
};

export const SavedOptionsField = ({ name, label, category, value, onChange }: Props) => {
  const [items, setItems] = useState<SavedOptionRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setStatus('loading');

    void loadSavedOptions(category)
      .then((nextItems) => {
        if (!active) return;
        setItems(nextItems);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        console.error(`Не удалось загрузить список ${category}:`, error);
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [category]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const rename = async (item: SavedOptionRecord, nextValue: string) => {
    try {
      setItems(await renameSavedOption(category, item.id, nextValue.trim()));
      if (value === item.value) onChange(nextValue.trim());
    } catch (error) {
      console.error(`Не удалось изменить значение ${category}:`, error);
    }
  };

  const remove = async (item: SavedOptionRecord) => {
    const previous = items;
    setItems((current) => current.filter(({ id }) => id !== item.id));
    if (value === item.value) onChange('');

    try {
      setItems(await removeSavedOption(category, item.id));
    } catch (error) {
      setItems(previous);
      if (value === item.value) onChange(item.value);
      console.error(`Не удалось удалить значение ${category}:`, error);
    }
  };

  const emptyText =
    status === 'loading'
      ? 'Загрузка...'
      : status === 'error'
        ? 'Не удалось загрузить список'
        : 'Сохранённых вариантов нет';

  return (
    <div ref={rootRef} className={styles.departmentField}>
      <div className={styles.departmentControl}>
        <input
          name={name}
          type="text"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className={styles.historyToggle}
          aria-label={`Показать сохранённые варианты: ${label}`}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          ▾
        </button>
      </div>
      {open && (
        <div className={styles.historyDropdown}>
          {items.length === 0 ? (
            <div className={styles.historyEmpty}>{emptyText}</div>
          ) : (
            items.map((item) => (
              <SavedOptionItem
                key={item.id}
                item={item}
                label={label}
                onSelect={(selected) => {
                  onChange(selected.value);
                  setOpen(false);
                }}
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
