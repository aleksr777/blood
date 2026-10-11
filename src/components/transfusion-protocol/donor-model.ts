import type { ProtocolValues } from './protocol-types';

export const DONOR_ANTIGENS = [
  { name: 'donorAntigenC', symbol: 'C', label: 'C (RH2)' },
  { name: 'donorAntigenc', symbol: 'c', label: 'c (RH4)' },
  { name: 'donorAntigenCw', symbol: 'Cʷ', label: 'Cʷ (RH8)' },
  { name: 'donorAntigenE', symbol: 'E', label: 'E (RH3)' },
  { name: 'donorAntigene', symbol: 'e', label: 'e (RH5)' },
  { name: 'donorAntigenK', symbol: 'K', label: 'K (KEL1; Kell)' },
  { name: 'donorAntigenk', symbol: 'k', label: 'k (KEL2; Cellano)' },
] as const;

export const formatDonorAntigens = (values: ProtocolValues) => {
  const hasStructured = DONOR_ANTIGENS.some(({ name }) => Boolean(values[name]));
  if (!hasStructured) return values.donorAntigens ?? '';

  return DONOR_ANTIGENS
    .flatMap(({ name, symbol }) => (values[name] ? [`${symbol}${values[name]}`] : []))
    .join(' ');
};
