import type { ProtocolFieldConfig, ProtocolValues } from './protocol-types';

export const MONITORING_PERIODS = [
  { prefix: 'before', title: 'Перед началом переливания' },
  { prefix: 'hour1', title: 'Через 1 час после переливания' },
  { prefix: 'hour2', title: 'Через 2 часа после переливания' },
] as const;

export const getMonitoringFields = (prefix: string): ProtocolFieldConfig[] => [
  { name: `${prefix}Bp`, label: 'АД, мм рт. ст.' },
  { name: `${prefix}Pulse`, label: 'Частота пульса, уд/мин', type: 'number' },
  { name: `${prefix}Temperature`, label: 'Температура, °C', type: 'number', step: '0.1' },
  // Keep the existing key so previously saved combined text remains intact.
  { name: `${prefix}Urine`, label: 'Диурез' },
  { name: `${prefix}UrineColor`, label: 'Цвет мочи' },
];

export const formatMonitoringUrine = (values: ProtocolValues, prefix: string) =>
  [values[`${prefix}Urine`], values[`${prefix}UrineColor`]]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(', ');
