import { forwardRef } from 'react';
import { TimePickerColumn } from './time-picker-column';
import { hours, minutes } from './time-picker-values';
import styles from './time-picker.module.css';

type Props = {
  position: { top: number; left: number };
  selectedHour: string;
  selectedMinute: string;
  onSelectHour: (value: string) => void;
  onSelectMinute: (value: string) => void;
  onEscape: () => void;
};

export const TimePickerPanel = forwardRef<HTMLSpanElement, Props>(
  ({ position, selectedHour, selectedMinute, onSelectHour, onSelectMinute, onEscape }, ref) => (
    <span
      ref={ref}
      className={styles.popup}
      style={position}
      role="group"
      aria-label="Выбор времени"
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        onEscape();
      }}
    >
      <TimePickerColumn
        label="Часы"
        values={hours}
        selected={selectedHour}
        onSelect={onSelectHour}
      />
      <TimePickerColumn
        label="Минуты"
        values={minutes}
        selected={selectedMinute}
        onSelect={onSelectMinute}
      />
    </span>
  ),
);
TimePickerPanel.displayName = 'TimePickerPanel';
