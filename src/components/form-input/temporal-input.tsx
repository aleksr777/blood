import { forwardRef, useImperativeHandle, useRef, type ComponentPropsWithoutRef } from 'react';
import { TimePicker } from './time-picker';
import styles from './temporal-input.module.css';

type Props = Omit<ComponentPropsWithoutRef<'input'>, 'type'> & { type: 'date' | 'time' };

export const TemporalInput = forwardRef<HTMLInputElement, Props>(
  ({ type, readOnly, disabled, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => inputRef.current!, []);

    const updateValue = (value: string) => {
      const input = inputRef.current;
      if (!input || input.disabled || input.readOnly || input.value === value) return;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    const clear = () => {
      const input = inputRef.current;
      if (!input || input.disabled || input.readOnly) return;
      updateValue('');
      input.focus();
    };

    return (
      <span className={`${styles.control} ${type === 'time' ? styles.timeControl : ''}`}>
        <input
          {...props}
          ref={inputRef}
          type={type}
          className={[props.className, type === 'time' ? styles.time : styles.date]
            .filter(Boolean)
            .join(' ')}
          readOnly={readOnly}
          disabled={disabled}
          onKeyDown={(event) => {
            if (
              type === 'time' &&
              ((event.altKey && event.key === 'ArrowDown') || event.key === 'F4')
            ) {
              event.preventDefault();
            }
            props.onKeyDown?.(event);
          }}
        />
        {type === 'date' && !readOnly && (
          <button
            type="button"
            className={styles.picker}
            aria-label="Выбрать дату"
            title="Выбрать дату"
            disabled={disabled}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              const input = inputRef.current;
              if (input?.showPicker) input.showPicker();
              else input?.focus();
            }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
              <path d="M7.5 3v4M16.5 3v4M3.5 10h17" strokeLinecap="round" />
            </svg>
          </button>
        )}
        {type === 'time' && !readOnly && (
          <TimePicker
            disabled={disabled}
            getValue={() => inputRef.current?.value ?? ''}
            onChange={updateValue}
          />
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
              clear();
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
