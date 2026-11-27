import { dateParts } from './temporal-value';
import styles from './date-picker.module.css';

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

type Props = {
  year: number;
  month: number;
  value: string;
  onSelect: (value: string) => void;
};

export const DatePickerDays = ({ year, month, value, onSelect }: Props) => {
  const first = new Date(0);
  first.setUTCHours(0, 0, 0, 0);
  first.setUTCFullYear(year, month, 1);
  const offset = (first.getUTCDay() + 6) % 7;
  const today = new Date();
  const current = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className={styles.days}>
      {weekdays.map((day) => (
        <span key={day} className={styles.weekday}>
          {day}
        </span>
      ))}
      {Array.from({ length: 42 }, (_, index) => {
        const date = new Date(0);
        date.setUTCHours(0, 0, 0, 0);
        date.setUTCFullYear(year, month, index - offset + 1);
        const iso = `${String(date.getUTCFullYear()).padStart(4, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
        const isOtherMonth = date.getUTCMonth() !== month;
        return (
          <button
            key={iso}
            type="button"
            className={styles.day}
            data-outside={isOtherMonth || undefined}
            aria-label={new Intl.DateTimeFormat('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
            }).format(date)}
            aria-current={iso === current ? 'date' : undefined}
            aria-pressed={iso === value}
            disabled={!dateParts(iso)}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onSelect(iso);
            }}
          >
            {date.getUTCDate()}
          </button>
        );
      })}
    </div>
  );
};
