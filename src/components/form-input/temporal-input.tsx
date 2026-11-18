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
      <span className={styles.control}>
        <input
          {...props}
          ref={inputRef}
          type={type}
          className={[props.className, type === 'time' ? styles.time : '']
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
