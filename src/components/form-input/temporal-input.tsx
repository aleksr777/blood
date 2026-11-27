import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from 'react';
import { DatePicker } from './date-picker';
import { TimePicker } from './time-picker';
import { formatDateInput, parseDateInput, parseTimeInput } from './temporal-value';
import styles from './temporal-input.module.css';

type Props = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'onChange'> & {
  type: 'date' | 'time';
  onValueChange?: (value: string) => void;
};

export const TemporalInput = forwardRef<HTMLInputElement, Props>(
  (
    {
      type,
      value,
      defaultValue,
      onValueChange,
      readOnly,
      disabled,
      onFocus,
      onBlur,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [localValue, setLocalValue] = useState(String(defaultValue ?? ''));
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const committed = value === undefined ? localValue : String(value);
    const display = type === 'date' ? formatDateInput(committed) : committed;
    useImperativeHandle(ref, () => inputRef.current!, []);

    const publish = (next: string) => {
      if (disabled || readOnly || next === committed) return;
      if (value === undefined) setLocalValue(next);
      onValueChange?.(next);
    };

    const choose = (next: string) => {
      setDraft(type === 'date' ? formatDateInput(next) : next);
      publish(next);
    };

    return (
      <span className={`${styles.control} ${type === 'time' ? styles.timeControl : ''}`}>
        <input
          {...props}
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={type === 'date' ? 'ДД.ММ.ГГГГ' : 'ЧЧ:ММ'}
          maxLength={type === 'date' ? 10 : 5}
          className={props.className}
          value={editing ? draft : display}
          readOnly={readOnly}
          disabled={disabled}
          onFocus={(event) => {
            setDraft(display);
            setEditing(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setEditing(false);
            onBlur?.(event);
          }}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            const parsed = type === 'date' ? parseDateInput(next) : parseTimeInput(next);
            if (parsed !== null) publish(parsed);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setEditing(false);
              event.currentTarget.blur();
            }
            onKeyDown?.(event);
          }}
        />
        {type === 'date' && !readOnly && (
          <DatePicker disabled={disabled} value={committed} onChange={choose} />
        )}
        {type === 'time' && !readOnly && (
          <TimePicker disabled={disabled} getValue={() => committed} onChange={choose} />
        )}
        {!readOnly && (
          <button
            type="button"
            className={styles.clear}
            aria-label={type === 'date' ? 'Очистить дату' : 'Очистить время'}
            title={type === 'date' ? 'Очистить дату' : 'Очистить время'}
            disabled={disabled}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              inputRef.current?.focus();
              choose('');
            }}
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </span>
    );
  },
);
TemporalInput.displayName = 'TemporalInput';
