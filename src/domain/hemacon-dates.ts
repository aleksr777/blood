const isIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const getHemaconDateOrderWarning = (values: Record<string, string>) => {
  const collection = values.collectionDate ?? '';
  const expiration = values.expirationDate ?? '';
  if (!isIsoDate(collection) || !isIsoDate(expiration) || collection < expiration) return '';
  return 'Дата заготовки должна быть раньше даты окончания срока годности.';
};
