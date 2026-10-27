import { useEffect, useId, useState } from 'react';
import { isObstetricValueUnknown, OBSTETRIC_UNKNOWN } from './obstetric-history';
import { useOverlayDropdown } from './use-overlay-dropdown';
import editorStyles from './protocol-editor.module.css';
import styles from './recipient-history-fields.module.css';

type Props = {
  name: string;
  label: string;
  value: string;
  maximum: number;
  onChange: (value: string) => void;
};

const displayedValue = (value: string) =>
  isObstetricValueUnknown(value) ? OBSTETRIC_UNKNOWN : value;

export const ObstetricCountField = ({ name, label, value, maximum, onChange }: Props) => {
  const [draft, setDraft] = useState(() => displayedValue(value));
  const [open, setOpen] = useState(false);
  const listId = useId();
  const { rootRef, dropdownState } = useOverlayDropdown(open, setOpen);
  const numeric = /^\d*$/.test(draft);

  useEffect(() => setDraft(displayedValue(value)), [value]);

  const select = (next: string) => {
    setDraft(next);
    onChange(next);
    setOpen(false);
  };

  return (
    <div>
      <div className={editorStyles.fieldLabel}>{label}</div>
      <div
        ref={rootRef}
        className={`${editorStyles.departmentField} ${styles.countField}`}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget) && !draft && value.trim())
            select(OBSTETRIC_UNKNOWN);
        }}
      >
        <div className={editorStyles.departmentControl}>
          <input
            name={name}
            aria-label={label}
            type={numeric ? 'number' : 'text'}
            inputMode={numeric ? 'numeric' : undefined}
            min={numeric ? 0 : undefined}
            max={numeric ? maximum : undefined}
            step={numeric ? 1 : undefined}
            readOnly={!numeric}
            placeholder="Не выбрано"
            value={draft}
            onClick={() => !numeric && setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setOpen(false);
              if (event.key === 'ArrowDown' && (!numeric || event.altKey)) {
                event.preventDefault();
                setOpen(true);
              }
              if (
                !event.ctrlKey &&
                !event.metaKey &&
                ['e', 'E', '+', '-', '.', ','].includes(event.key)
              )
                event.preventDefault();
            }}
            onChange={(event) => {
              const next = event.target.value;
              if (!/^\d{0,2}$/.test(next) || Number(next) > maximum) return;
              setDraft(next);
              if (next) onChange(next);
            }}
          />
          <button
            type="button"
            className={editorStyles.historyToggle}
            aria-label={`Варианты: ${label}`}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((current) => !current)}
          >
            ▾
          </button>
        </div>
        <div
          id={listId}
          className={editorStyles.historyDropdown}
          data-state={dropdownState}
          role="listbox"
          aria-label={label}
          aria-hidden={!open}
        >
          {open &&
            [
              OBSTETRIC_UNKNOWN,
              ...Array.from({ length: maximum + 1 }, (_, index) => String(index)),
            ].map((option) => (
              <button
                key={option}
                type="button"
                className={editorStyles.customSelectOption}
                role="option"
                aria-selected={draft === option}
                onClick={() => select(option)}
              >
                <span>{option}</span>
                {draft === option && <span aria-hidden="true">✓</span>}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
