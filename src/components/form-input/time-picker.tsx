import { useEffect, useRef, useState } from 'react';
import styles from './time-picker.module.css';
import { TimePickerColumn } from './time-picker-column';

type Props = {
  disabled?: boolean;
  getValue: () => string;
  onChange: (value: string) => void;
};

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

export const TimePicker = ({ disabled, getValue, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
  const [openAbove, setOpenAbove] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    window.addEventListener('pointerdown', outside, true);
    return () => window.removeEventListener('pointerdown', outside, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    rootRef.current
      ?.querySelectorAll<HTMLElement>('[role="option"][aria-selected="true"]')
      .forEach((option) => {
        const list = option.parentElement;
        if (list) list.scrollTop = Math.max(0, option.offsetTop - list.clientHeight / 2);
      });
  }, [open]);

  const toggle = () => {
    if (!open) {
      const bounds = rootRef.current?.getBoundingClientRect();
      const dialog = rootRef.current?.closest('dialog');
      const top = Math.max(0, dialog?.getBoundingClientRect().top ?? 0);
      const bottom = Math.min(
        window.innerHeight,
        dialog?.getBoundingClientRect().bottom ?? window.innerHeight,
      );
      setOpenAbove(
        Boolean(
          bounds && bottom - bounds.bottom < 240 && bounds.top - top > bottom - bounds.bottom,
        ),
      );
      const [hour = '', minute = ''] = getValue().split(':');
      setSelectedHour(hours.includes(hour) ? hour : '');
      setSelectedMinute(minutes.includes(minute) ? minute : '');
    }
    setOpen((value) => !value);
  };
  const choose = (hour: string, minute: string) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    if (hour && minute) onChange(`${hour}:${minute}`);
  };

  return (
    <span className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        ref={triggerRef}
        aria-label="Выбрать время"
        aria-expanded={open}
        title="Выбрать время"
        disabled={disabled}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          toggle();
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <span
          className={`${styles.popup} ${openAbove ? styles.above : ''}`}
          role="group"
          aria-label="Выбор времени"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              triggerRef.current?.focus();
            }
          }}
        >
          <TimePickerColumn
            label="Часы"
            values={hours}
            selected={selectedHour}
            onSelect={(hour) => choose(hour, selectedMinute)}
          />
          <TimePickerColumn
            label="Минуты"
            values={minutes}
            selected={selectedMinute}
            onSelect={(minute) => choose(selectedHour, minute)}
          />
        </span>
      )}
    </span>
  );
};
