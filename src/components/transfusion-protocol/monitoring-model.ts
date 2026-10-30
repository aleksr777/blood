import type { ProtocolFieldConfig, ProtocolValues } from './protocol-types';

export const MONITORING_PERIODS = [
  { prefix: 'before', title: 'Перед началом переливания' },
  { prefix: 'hour1', title: 'Через 1 час после переливания' },
  { prefix: 'hour2', title: 'Через 2 часа после переливания' },
] as const;

export const getMonitoringFields = (prefix: string): ProtocolFieldConfig[] => [
  { name: `${prefix}Bp`, label: 'АД, мм рт. ст.' },
  {
    name: `${prefix}Pulse`,
    label: 'Частота пульса, уд/мин',
    type: 'number',
    min: '1',
    max: '999',
    step: '1',
  },
  {
    name: `${prefix}Temperature`,
    label: 'Температура, °C',
    type: 'number',
    min: '20',
    max: '50',
    step: '0.1',
  },
  // Keep the existing key so previously saved combined text remains intact.
  {
    name: `${prefix}Urine`,
    label: 'Диурез, мл',
    type: 'number',
    min: '0',
    max: '9999',
    step: 'any',
  },
  { name: `${prefix}UrineColor`, label: 'Цвет мочи' },
];

const NUMERIC_VOLUME = /^(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?$/i;

export const getDiuresisInputValue = (value = '') => {
  const numeric = value
    .trim()
    .replace(/\s*мл$/iu, '')
    .trim();
  return NUMERIC_VOLUME.test(numeric) && Number.isFinite(Number(numeric.replace(',', '.')))
    ? numeric.replace(',', '.')
    : '';
};

export const formatMonitoringUrine = (values: ProtocolValues, prefix: string) => {
  const volume = values[`${prefix}Urine`]?.trim() ?? '';
  const diuresis = NUMERIC_VOLUME.test(volume) ? `${volume.replace('.', ',')} мл` : volume;
  return [diuresis, values[`${prefix}UrineColor`]]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(', ');
};
