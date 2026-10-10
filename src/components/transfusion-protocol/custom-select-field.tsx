import { useState } from 'react';
import { useOverlayDropdown } from './use-overlay-dropdown';
import styles from './protocol-editor.module.css';

type Props = {
  name: string;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  emptyLabel?: string;
  emptyDisplayLabel?: string;
  compact?: boolean;
  allowEmpty?: boolean;
};

export const CustomSelectField = ({
  name,
  label,
  options,
  value,
  onChange,
  emptyLabel = 'Не выбрано',
  emptyDisplayLabel,
  compact = false,
  allowEmpty = true,
}: Props) => {
  const [open, setOpen] = useState(false);
  const { rootRef, dropdownState } = useOverlayDropdown(open, setOpen);
  const allOptions = allowEmpty ? ['', ...options] : options;

  const select = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={styles.departmentField}>
      <button
        type="button"
        name={name}
        className={[
          styles.customSelectControl,
          compact ? styles.customSelectControlCompact : '',
        ].filter(Boolean).join(' ')}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className={[
            value ? styles.customSelectValue : styles.customSelectPlaceholder,
            value === '+' ? styles.customSelectPositive : '',
            value === '-' ? styles.customSelectNegative : '',
          ].filter(Boolean).join(' ')}
        >
          {value || emptyDisplayLabel || emptyLabel}
        </span>
        <span className={styles.customSelectArrow} aria-hidden="true">
          ▾
        </span>
      </button>

      <div
        className={[
          styles.historyDropdown,
          compact ? styles.historyDropdownCompact : '',
        ].filter(Boolean).join(' ')}
        data-state={dropdownState}
        role="listbox"
        aria-label={label}
        aria-hidden={dropdownState !== 'open'}
      >
        {allOptions.map((option) => (
          <button
            key={option || '__empty'}
            type="button"
            className={[
              styles.customSelectOption,
              option === '+' ? styles.customSelectOptionPositive : '',
              option === '-' ? styles.customSelectOptionNegative : '',
            ].filter(Boolean).join(' ')}
            role="option"
            aria-selected={value === option}
            onClick={() => select(option)}
          >
            <span>{option || emptyLabel}</span>
            {value === option && <span aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
};
