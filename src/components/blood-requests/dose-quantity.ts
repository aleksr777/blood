export const sanitizeDoseQuantity = (value: string) =>
  value.replace(/\D/g, '');

const doseWord = (value: number) => {
  const lastTwo = value % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return 'доз';

  const last = value % 10;
  if (last === 1) return 'доза';
  if (last >= 2 && last <= 4) return 'дозы';
  return 'доз';
};

export const formatDoseQuantity = (value?: string) => {
  const digits = sanitizeDoseQuantity(value ?? '');
  if (!digits) return '';

  const amount = Number(digits);
  return `${digits} ${doseWord(amount)}`;
};
