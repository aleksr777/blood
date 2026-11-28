import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from 'react';
import { DatePicker } from './date-picker';
import { TimePicker } from './time-picker';
import {
  formatDateInput,
  formatTemporalDraft,
  parseDateInput,
  parseTimeInput,
} from './temporal-value';
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
    const pendingCaret = useRef<number | null>(null);
    const [localValue, setLocalValue] = useState(String(defaultValue ?? ''));
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const committed = value === undefined ? localValue : String(value);
    const display = type === 'date' ? formatDateInput(committed) : committed;
    useImperativeHandle(ref, () => inputRef.current!, []);

    useLayoutEffect(() => {
      if (pendingCaret.current === null) return;
      inputRef.current?.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }, [draft]);

    const publish = (next: string) => {
      if (disabled || readOnly || next === committed) return;
      if (value === undefined) setLocalValue(next);
      onValueChange?.(next);
    };

    const choose = (next: string) => {
      setDraft(type === 'date' ? formatDateInput(next) : next);
      publish(next);
    };

    const edit = (raw: string, caret: number) => {
      const next = formatTemporalDraft(type, raw);
      const precedingDigits = raw.slice(0, caret).replace(/\D/g, '').length;
      const digitPositions = [...next.matchAll(/\d/g)];
      pendingCaret.current =
        caret === raw.length
          ? next.length
          : precedingDigits === 0
            ? 0
            : (digitPositions[precedingDigits - 1]?.index ?? next.length - 1) + 1;
      setDraft(next);
      const parsed = type === 'date' ? parseDateInput(next) : parseTimeInput(next);
      if (parsed !== null) publish(parsed);
    };

    return (
      <span className={`${styles.control} ${type === 'time' ? styles.timeControl : ''}`}>
        <input
          {...props}
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={type === 'date' ? '--.--.----' : '--:--'}
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
            edit(event.target.value, event.target.selectionStart ?? event.target.value.length);
          }}
          onKeyDown={(event) => {
            const input = event.currentTarget;
            const caret = input.selectionStart;
            const separator = type === 'date' ? '.' : ':';
            if (
              event.key === 'Backspace' &&
              caret !== null &&
              caret === input.selectionEnd &&
              caret >= 2 &&
              input.value[caret - 1] === separator
            ) {
              event.preventDefault();
              edit(`${input.value.slice(0, caret - 2)}${input.value.slice(caret)}`, caret - 2);
            }
            if (
              event.key === 'Delete' &&
              caret !== null &&
              caret === input.selectionEnd &&
              input.value[caret] === separator &&
              caret + 1 < input.value.length
            ) {
              event.preventDefault();
              edit(`${input.value.slice(0, caret)}${input.value.slice(caret + 2)}`, caret);
            }
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
