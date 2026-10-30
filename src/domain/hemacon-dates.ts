import { isIsoDate } from './date-time';

export const getHemaconDateOrderWarning = (values: Record<string, string>) => {
  const collection = values.collectionDate ?? '';
  const expiration = values.expirationDate ?? '';
  if (!isIsoDate(collection) || !isIsoDate(expiration) || collection < expiration) return '';
  return 'Дата заготовки должна быть раньше даты окончания срока годности.';
};
