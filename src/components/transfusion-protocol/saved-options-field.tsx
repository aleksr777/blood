import { FormInput } from '../form-input/form-input';
import { useSavedDocumentScope } from '../saved-document/saved-document-scope';
import { useRef, useState } from 'react';
import { useSavedOptions } from './use-saved-options';
import { SavedOptionItem } from './saved-option-item';
import { EmptyInputOption } from './empty-input-option';
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
  disabled?: boolean;
  wrapOptions?: boolean;
  departments?: boolean;
  toggleLabel?: string;
  onChange: (value: string, previousOptionValue?: string) => void;
};

export const SavedOptionsField = ({
  name,
  label,
  category,
  value,
  fixedOptions = [],
  disabled = false,
  wrapOptions = false,
  departments = false,
  toggleLabel,
  onChange,
}: Props) => {
  const isolated = useSavedDocumentScope();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const manualValue = useRef<string | null>(null);
  const { rootRef, dropdownRef, dropdownState } = useOverlayDropdown(open, setOpen);
  const { items, status, rename, remove } = useSavedOptions({
    category,
    value,
    onChange,
    isolated,
    departments,
  });

  const emptyText =
    status === 'loading'
      ? 'Загрузка...'
      : status === 'error'
        ? 'Не удалось загрузить список'
        : 'Сохранённых вариантов нет';

  const normalizedFixedOptions = new Set(fixedOptions.map(normalizeValue));
  const isFixed = (option: string) => normalizedFixedOptions.has(normalizeValue(option));
  const editableItems = items.filter((item) => !isFixed(item.value));
  const hasFixedOptions = fixedOptions.length > 0;
  const isListed =
    isFixed(value) ||
    editableItems.some((item) => normalizeValue(item.value) === normalizeValue(value));
  const readOnly = hasFixedOptions && Boolean(value) && isListed && value !== manualValue.current;

  return (
    <div ref={rootRef} className={styles.departmentField}>
      <div className={styles.departmentControl}>
        <FormInput
          ref={inputRef}
          name={name}
          aria-label={label}
          type="text"
          autoComplete="off"
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          onChange={(event) => {
            manualValue.current = event.target.value;
            onChange(event.target.value);
          }}
        />
        <button
          type="button"
          className={styles.historyToggle}
          aria-label={toggleLabel ?? `Показать сохранённые варианты: ${label}`}
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
        >
          ▾
        </button>
      </div>
      <div
        ref={dropdownRef}
        className={[styles.historyDropdown, wrapOptions ? styles.historyDropdownWrap : '']
          .filter(Boolean)
          .join(' ')}
        data-state={dropdownState}
        aria-hidden={dropdownState !== 'open'}
      >
        {hasFixedOptions && (
          <EmptyInputOption
            label={label}
            onSelect={() => {
              manualValue.current = '';
              onChange('');
              setOpen(false);
              inputRef.current?.focus();
            }}
          />
        )}
        {editableItems.length === 0 && fixedOptions.length === 0 ? (
          <div className={styles.historyEmpty}>{emptyText}</div>
        ) : (
          editableItems.map((item) => (
            <SavedOptionItem
              editable
              key={item.id}
              item={item}
              label={label}
              onSelect={(selected) => {
                manualValue.current = null;
                onChange(selected.value);
                setOpen(false);
              }}
              onRename={rename}
              onRemove={remove}
            />
          ))
        )}
        {fixedOptions.map((option) => (
          <div key={option} className={styles.historyFixedRow}>
            <button
              type="button"
              className={styles.historyValue}
              title={option}
              onClick={() => {
                manualValue.current = null;
                onChange(option);
                setOpen(false);
              }}
            >
              {option}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
