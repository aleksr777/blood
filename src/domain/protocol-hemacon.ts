import { isClockTime, isIsoDate, isLocalDateTime } from './date-time';

export const normalizeComponentUnitNumber = (value?: string) => (value ?? '').replace(/\D/g, '');

type RequiredField = {
  name: string;
  label: string;
  block: 'donor' | 'general';
  valid: (value: string) => boolean;
};

const hasText = (value: string) => Boolean(value.trim());
const requiredFields: RequiredField[] = [
  { name: 'componentName', label: 'наименование компонента', block: 'donor', valid: hasText },
  {
    name: 'componentUnitNumber',
    label: 'полный номер гемакона (14 цифр)',
    block: 'donor',
    valid: (value) => normalizeComponentUnitNumber(value).length === 14,
  },
  { name: 'donorAbo', label: 'группу крови гемакона', block: 'donor', valid: hasText },
  { name: 'collectionDate', label: 'дату заготовки гемакона', block: 'donor', valid: isIsoDate },
  {
    name: 'expirationDate',
    label: 'дату окончания срока годности гемакона',
    block: 'donor',
    valid: isIsoDate,
  },
  {
    name: 'requestDateTime',
    label: 'дату и время подачи заявки',
    block: 'general',
    valid: isLocalDateTime,
  },
  { name: 'transfusionDate', label: 'дату трансфузии', block: 'general', valid: isIsoDate },
  { name: 'startTime', label: 'время начала трансфузии', block: 'general', valid: isClockTime },
  { name: 'endTime', label: 'время окончания трансфузии', block: 'general', valid: isClockTime },
];

export const getMissingProtocolFields = (values: Record<string, string>) =>
  requiredFields.filter(({ name, valid }) => !valid(values[name] ?? ''));

export const getProtocolHemaconWarning = (values: Record<string, string>) => {
  const missing = getMissingProtocolFields(values);
  return missing.length
    ? `Сохранение и печать протокола недоступны.\n\nЗаполните обязательные поля:\n\n${missing.map(({ label }) => `• ${label}`).join('\n')}.`
    : '';
};
