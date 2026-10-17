import type { ProtocolValues } from './protocol-types';

export const DONOR_ANTIGENS = [
  { name: 'donorAntigenC', symbol: 'C', label: 'C' },
  { name: 'donorAntigenc', symbol: 'c', label: 'c' },
  { name: 'donorAntigenCw', symbol: 'Cʷ', label: 'Cʷ' },
  { name: 'donorAntigenE', symbol: 'E', label: 'E' },
  { name: 'donorAntigene', symbol: 'e', label: 'e' },
  { name: 'donorAntigenK', symbol: 'K', label: 'K' },
  { name: 'donorAntigenk', symbol: 'k', label: 'k' },
] as const;

const HEMACON_DATA_FIELDS = [
  'componentName',
  'collectionOrganization',
  'donorAbo',
  'donorRh',
  'donorAntigens',
  'componentUnitNumber',
  'amountMl',
  'collectionDate',
  'expirationDate',
  ...DONOR_ANTIGENS.map(({ name }) => name),
] as const;

export const hasHemaconData = (values: ProtocolValues) =>
  HEMACON_DATA_FIELDS.some((field) => Boolean(values[field]?.trim()));

export const formatDonorAntigens = (values: ProtocolValues) => {
  const hasStructured = DONOR_ANTIGENS.some(({ name }) => Boolean(values[name]));
  if (!hasStructured) return values.donorAntigens ?? '';

  return DONOR_ANTIGENS
    .flatMap(({ name, symbol }) => (values[name] ? [`${symbol}${values[name]}`] : []))
    .join(' ');
};
