export const isIsoDate = (value = '') => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const isClockTime = (value = '') =>
  /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?$/.test(value);

export const isLocalDateTime = (value = '') => {
  const parts = value.split('T');
  return parts.length === 2 && isIsoDate(parts[0]) && isClockTime(parts[1]);
};

// Fixed-width local calendar values sort without time-zone or daylight-saving conversion.
// Missing dates sort last; a missing time sorts after known times on the same date.
export const transfusionOrderKey = (date = '', time = '') => {
  if (!isIsoDate(date)) return '\uffff';
  const [clock, fraction = ''] = time.split('.');
  const normalizedTime = `${clock.length === 5 ? `${clock}:00` : clock}.${fraction.padEnd(3, '0')}`;
  const clockKey = isClockTime(time) ? normalizedTime : '24:00';
  return `${date}T${clockKey}`;
};
