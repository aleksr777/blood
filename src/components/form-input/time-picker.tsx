import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getPickerPosition } from './picker-position';
import styles from './time-picker.module.css';
import { TimePickerPanel } from './time-picker-panel';
import { hours, minutes } from './time-picker-values';

type Props = {
  disabled?: boolean;
  getValue: () => string;
  onChange: (value: string) => void;
};

export const TimePicker = ({ disabled, getValue, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target) &&
        !popupRef.current?.contains(event.target)
      )
        setOpen(false);
    };
    const hideOnScroll = (event: Event) => {
      if (event.target instanceof Node && popupRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    window.addEventListener('pointerdown', outside, true);
    window.addEventListener('scroll', hideOnScroll, true);
    window.addEventListener('resize', hideOnScroll);
    return () => {
      window.removeEventListener('pointerdown', outside, true);
      window.removeEventListener('scroll', hideOnScroll, true);
      window.removeEventListener('resize', hideOnScroll);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    popupRef.current
      ?.querySelectorAll<HTMLElement>('[role="option"][aria-selected="true"]')
      .forEach((option) => {
        const list = option.parentElement;
        if (list) list.scrollTop = Math.max(0, option.offsetTop - list.clientHeight / 2);
      });
  }, [open]);

  const toggle = () => {
    if (!open) {
      if (rootRef.current) {
        setPosition(getPickerPosition(rootRef.current, 124, 240));
        setContainer(rootRef.current.closest('dialog') ?? document.body);
      }
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
      {open &&
        container &&
        createPortal(
          <TimePickerPanel
            ref={popupRef}
            position={position}
            selectedHour={selectedHour}
            selectedMinute={selectedMinute}
            onSelectHour={(hour) => choose(hour, selectedMinute)}
            onSelectMinute={(minute) => choose(selectedHour, minute)}
            onEscape={() => {
              setOpen(false);
              triggerRef.current?.focus();
            }}
          />,
          container,
        )}
    </span>
  );
};
