import { useState } from 'react';
import { DatePickerDays } from './date-picker-days';
import { dateParts, formatDateInput } from './temporal-value';
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
const yearsPerPage = 20;
const yearPageStart = (year: number) => Math.floor((year - 1) / yearsPerPage) * yearsPerPage + 1;

export const DatePickerPanel = ({
  value,
  onSelect,
  showToday = true,
}: {
  value: string;
  onSelect: (value: string) => void;
  showToday?: boolean;
}) => {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const initial = dateParts(value);
  const [year, setYear] = useState(initial?.year ?? today.getFullYear());
  const [month, setMonth] = useState((initial?.month ?? today.getMonth() + 1) - 1);
  const [choosingYear, setChoosingYear] = useState(false);
  const [firstYear, setFirstYear] = useState(() =>
    yearPageStart(initial?.year ?? today.getFullYear()),
  );

  const navigate = (delta: number) => {
    const date = new Date(0);
    date.setUTCFullYear(year, month + delta, 1);
    const nextYear = date.getUTCFullYear();
    if (nextYear < 1 || nextYear > 9999) return;
    setYear(nextYear);
    setMonth(date.getUTCMonth());
  };

  return (
    <>
      {showToday && (
        <button type="button" className={styles.today} onClick={() => onSelect(todayIso)}>
          Сегодня {formatDateInput(todayIso)}
        </button>
      )}
      <div className={styles.header}>
        {choosingYear ? (
          <>
            <button
              type="button"
              aria-label="Предыдущие 20 лет"
              disabled={firstYear === 1}
              onClick={() => setFirstYear(firstYear - yearsPerPage)}
            >
              ‹
            </button>
            <span className={styles.yearRange}>
              {firstYear}–{Math.min(firstYear + yearsPerPage - 1, 9999)}
            </span>
            <button
              type="button"
              aria-label="Следующие 20 лет"
              disabled={firstYear + yearsPerPage > 9999}
              onClick={() => setFirstYear(firstYear + yearsPerPage)}
            >
              ›
            </button>
          </>
        ) : (
          <>
            <button type="button" aria-label="Предыдущий месяц" onClick={() => navigate(-1)}>
              ‹
            </button>
            <span>{months[month]}</span>
            <button
              type="button"
              className={styles.yearTrigger}
              aria-label="Выбрать год"
              aria-expanded={choosingYear}
              onClick={() => {
                setFirstYear(yearPageStart(year));
                setChoosingYear(true);
              }}
            >
              {year}
            </button>
            <button type="button" aria-label="Следующий месяц" onClick={() => navigate(1)}>
              ›
            </button>
          </>
        )}
      </div>
      {choosingYear ? (
        <div className={styles.years} role="group" aria-label="Выбор года">
          {Array.from({ length: yearsPerPage }, (_, index) => firstYear + index)
            .filter((option) => option <= 9999)
            .map((option) => (
              <button
                key={option}
                type="button"
                className={styles.year}
                aria-pressed={option === year}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setYear(option);
                  setChoosingYear(false);
                }}
              >
                {option}
              </button>
            ))}
        </div>
      ) : (
        <DatePickerDays year={year} month={month} value={value} onSelect={onSelect} />
      )}
    </>
  );
};
