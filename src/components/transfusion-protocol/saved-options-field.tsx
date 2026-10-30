import { FormInput } from '../form-input/form-input';
import { useSavedDocumentScope } from '../saved-document/saved-document-scope';
import { useEffect, useState } from 'react';
import {
  loadSavedOptions,
  removeSavedOption,
  renameSavedOption,
  rememberSavedOption,
  subscribeSavedOptions,
  type SavedOptionRecord,
} from '../../storage/repositories/saved-options';
import { SavedOptionItem } from './saved-option-item';
import { useOverlayDropdown } from './use-overlay-dropdown';
import styles from './protocol-editor.module.css';

const normalizeValue = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU');

type Props = {
  name: string;
  label: string;
  category: string;
  value: string;
  fixedOptions?: string[];
  rememberOnBlur?: boolean;
  disabled?: boolean;
  wrapOptions?: boolean;
  onChange: (value: string, previousOptionValue?: string) => void;
};

export const SavedOptionsField = ({
  name,
  label,
  category,
  value,
  fixedOptions = [],
  rememberOnBlur = false,
  disabled = false,
  wrapOptions = false,
  onChange,
}: Props) => {
  const isolated = useSavedDocumentScope();
  const [items, setItems] = useState<SavedOptionRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const { rootRef, dropdownState } = useOverlayDropdown(open, setOpen);

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

  useEffect(
    () =>
      subscribeSavedOptions(category, ({ items: nextItems, edit }) => {
        setItems(nextItems);
        setStatus('ready');
        if (!isolated && edit && normalizeValue(value) === normalizeValue(edit.previousValue)) {
          onChange(edit.value, edit.previousValue);
        }
      }),
    [category, value, onChange, isolated],
  );

  const rename = async (item: SavedOptionRecord, nextValue: string) => {
    if (isolated) return;
    try {
      await renameSavedOption(category, item.id, nextValue.trim());
    } catch (error) {
      console.error(`Не удалось изменить значение ${category}:`, error);
    }
  };

  const remove = async (item: SavedOptionRecord) => {
    if (isolated) return;
    try {
      await removeSavedOption(category, item.id);
    } catch (error) {
      console.error(`Не удалось удалить значение ${category}:`, error);
    }
  };

  const emptyText =
    status === 'loading'
      ? 'Загрузка...'
      : status === 'error'
        ? 'Не удалось загрузить список'
        : 'Сохранённых вариантов нет';

  const normalizedFixedOptions = new Set(
    fixedOptions.map((option) => option.trim().toLocaleLowerCase('ru-RU')),
  );
  const editableItems = items.filter(
    (item) => !normalizedFixedOptions.has(item.value.trim().toLocaleLowerCase('ru-RU')),
  );

  return (
    <div ref={rootRef} className={styles.departmentField}>
      <div className={styles.departmentControl}>
        <FormInput
          name={name}
          aria-label={label}
          type="text"
          autoComplete="off"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            if (!isolated && rememberOnBlur && value.trim()) {
              void rememberSavedOption(category, value).catch((error: unknown) =>
                console.error(`Не удалось сохранить значение ${category}:`, error),
              );
            }
          }}
        />
        <button
          type="button"
          className={styles.historyToggle}
          aria-label={`Показать сохранённые варианты: ${label}`}
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
        >
          ▾
        </button>
      </div>
      <div
        className={[styles.historyDropdown, wrapOptions ? styles.historyDropdownWrap : '']
          .filter(Boolean)
          .join(' ')}
        data-state={dropdownState}
        aria-hidden={dropdownState !== 'open'}
      >
        {fixedOptions.map((option) => (
          <div key={option} className={styles.historyFixedRow}>
            <button
              type="button"
              className={styles.historyValue}
              title={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              {option}
            </button>
          </div>
        ))}
        {editableItems.length === 0 && fixedOptions.length === 0 ? (
          <div className={styles.historyEmpty}>{emptyText}</div>
        ) : (
          editableItems.map((item) => (
            <SavedOptionItem
              editable={!isolated}
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
    </div>
  );
};
