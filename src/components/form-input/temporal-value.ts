const pad = (value: number) => String(value).padStart(2, '0');

export const dateParts = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return year >= 1 &&
    year <= 9999 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? { year, month, day }
    : null;
};

export const formatDateInput = (value: string) => {
  const parts = dateParts(value);
  return parts
    ? `${pad(parts.day)}.${pad(parts.month)}.${String(parts.year).padStart(4, '0')}`
    : value;
};

export const parseDateInput = (value: string) => {
  if (value.trim() === '') return '';
  if (dateParts(value)) return value;
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const iso = `${match[3]}-${pad(Number(match[2]))}-${pad(Number(match[1]))}`;
  return dateParts(iso) ? iso : null;
};

export const parseTimeInput = (value: string) => {
  if (value.trim() === '') return '';
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(value.trim());
  if (!match || Number(match[1]) > 23) return null;
  return `${pad(Number(match[1]))}:${match[2]}`;
};

export const formatTemporalDraft = (type: 'date' | 'time', value: string) => {
  if (type === 'date') {
    const parsed = parseDateInput(value);
    if (parsed && (value.includes('-') || value.replace(/\D/g, '').length !== 8))
      return formatDateInput(parsed);
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return `${digits.slice(0, 2)}${digits.length >= 2 ? '.' : ''}${digits.slice(2, 4)}${digits.length >= 4 ? '.' : ''}${digits.slice(4)}`;
  }
  const parsed = parseTimeInput(value);
  if (parsed && value.includes(':')) return parsed;
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return `${digits.slice(0, 2)}${digits.length >= 2 ? ':' : ''}${digits.slice(2)}`;
};
