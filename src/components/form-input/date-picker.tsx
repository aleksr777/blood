import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DatePickerPanel } from './date-picker-panel';
import { getPickerPosition } from './picker-position';
import styles from './date-picker.module.css';

type Props = {
  disabled?: boolean;
  showToday?: boolean;
  value: string;
  onChange: (value: string) => void;
};

export const DatePicker = ({ disabled, showToday, value, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

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

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    if (rootRef.current) {
      setPosition(getPickerPosition(rootRef.current, Math.min(288, window.innerWidth - 16), 330));
      setContainer(rootRef.current.closest('dialog') ?? document.body);
    }
    setOpen(true);
  };

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <span ref={rootRef} className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label="Выбрать дату"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Выбрать дату"
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
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M7.5 3v4M16.5 3v4M3.5 10h17" strokeLinecap="round" />
        </svg>
      </button>
      {open &&
        container &&
        createPortal(
          <div
            ref={popupRef}
            className={styles.popup}
            style={position}
            role="dialog"
            aria-label="Выбор даты"
            onKeyDown={(event) => {
              if (event.key !== 'Escape') return;
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              triggerRef.current?.focus();
            }}
          >
            <DatePickerPanel value={value} onSelect={choose} showToday={showToday} />
          </div>,
          container,
        )}
    </span>
  );
};
