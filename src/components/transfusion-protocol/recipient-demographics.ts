type CalendarDate = { year: number; month: number; day: number };

const calendarTime = ({ year, month, day }: CalendarDate) => {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getTime();
};

const parseIsoDate = (value?: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;

  const year = Number(match[1]);
  if (year < 1) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(calendarTime({ year, month, day }));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
};

const currentLocalDateParts = (date = new Date()) => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  day: date.getDate(),
});

const ageDates = (birthDate?: string, referenceDate?: string) => {
  const birth = parseIsoDate(birthDate);
  if (!birth) return null;

  const reference = parseIsoDate(referenceDate) ?? currentLocalDateParts();

  let age = reference.year - birth.year;
  if (
    reference.month < birth.month ||
    (reference.month === birth.month && reference.day < birth.day)
  ) {
    age -= 1;
  }

  return age >= 0 ? { birth, reference, years: age } : null;
};

export const calculateRecipientAge = (birthDate?: string, referenceDate?: string): number | null =>
  ageDates(birthDate, referenceDate)?.years ?? null;

const ageText = (count: number, words: readonly [string, string, string]) => {
  const mod100 = count % 100;
  const mod10 = count % 10;

  const word =
    mod100 >= 11 && mod100 <= 14
      ? words[2]
      : mod10 === 1
        ? words[0]
        : mod10 >= 2 && mod10 <= 4
          ? words[1]
          : words[2];
  return `${count} ${word}`;
};

export const formatRecipientAge = (birthDate?: string, referenceDate?: string) => {
  const dates = ageDates(birthDate, referenceDate);
  if (!dates) return '';
  const { birth, reference, years } = dates;
  if (years > 0) return ageText(years, ['год', 'года', 'лет']);

  const months =
    (reference.year - birth.year) * 12 +
    reference.month -
    birth.month -
    (reference.day < birth.day ? 1 : 0);
  if (months > 0) return ageText(months, ['месяц', 'месяца', 'месяцев']);

  // Compare calendar dates in UTC so daylight-saving changes cannot lose a day.
  const days = (calendarTime(reference) - calendarTime(birth)) / 86_400_000;
  return ageText(days, ['день', 'дня', 'дней']);
};
