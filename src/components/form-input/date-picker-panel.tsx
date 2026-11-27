import { useState } from 'react';
import { DatePickerDays } from './date-picker-days';
import { dateParts } from './temporal-value';
import styles from './date-picker.module.css';

const months = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

export const DatePickerPanel = ({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (value: string) => void;
}) => {
  const today = new Date();
  const initial = dateParts(value);
  const [year, setYear] = useState(initial?.year ?? today.getFullYear());
  const [month, setMonth] = useState((initial?.month ?? today.getMonth() + 1) - 1);
  const [yearDraft, setYearDraft] = useState(String(initial?.year ?? today.getFullYear()));

  const navigate = (delta: number) => {
    const date = new Date(0);
    date.setUTCFullYear(year, month + delta, 1);
    const nextYear = date.getUTCFullYear();
    if (nextYear < 1 || nextYear > 9999) return;
    setYear(nextYear);
    setMonth(date.getUTCMonth());
    setYearDraft(String(nextYear));
  };

  const applyYear = () => {
    const next = Number(yearDraft);
    if (/^\d{1,4}$/.test(yearDraft) && next >= 1 && next <= 9999) setYear(next);
    else setYearDraft(String(year));
  };

  return (
    <>
      <div className={styles.header}>
        <button type="button" aria-label="Предыдущий месяц" onClick={() => navigate(-1)}>
          ‹
        </button>
        <span>{months[month]}</span>
        <input
          aria-label="Год календаря"
          inputMode="numeric"
          value={yearDraft}
          onChange={(event) => setYearDraft(event.target.value.replace(/\D/g, '').slice(0, 4))}
          onBlur={applyYear}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              applyYear();
            }
          }}
        />
        <button type="button" aria-label="Следующий месяц" onClick={() => navigate(1)}>
          ›
        </button>
      </div>
      <DatePickerDays year={year} month={month} value={value} onSelect={onSelect} />
      <button
        type="button"
        className={styles.today}
        onClick={() => {
          const now = new Date();
          onSelect(
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
          );
        }}
      >
        Сегодня
      </button>
    </>
  );
};
