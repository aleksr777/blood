import { forwardRef, useImperativeHandle, useRef, type ComponentPropsWithoutRef } from 'react';
import styles from './temporal-input.module.css';

type Props = Omit<ComponentPropsWithoutRef<'input'>, 'type'> & { type: 'date' | 'time' };

export const TemporalInput = forwardRef<HTMLInputElement, Props>(
  ({ type, readOnly, disabled, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => inputRef.current!, []);

    const clear = () => {
      const input = inputRef.current;
      if (!input || input.disabled || input.readOnly || !input.value) return;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(input, '');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
    };

    return (
      <span className={styles.control}>
        <input {...props} ref={inputRef} type={type} readOnly={readOnly} disabled={disabled} />
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
