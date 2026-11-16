import { selectedBloodComponentGroup } from '../../domain/blood-components';
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

const formatDonorAntigens = (values: ProtocolValues) => {
  const hasStructured = DONOR_ANTIGENS.some(({ name }) => Boolean(values[name]));
  if (!hasStructured) return values.donorAntigens ?? '';

  return DONOR_ANTIGENS.flatMap(({ name, symbol }) =>
    values[name] ? [`${symbol}${values[name]}`] : [],
  ).join(' ');
};

export const formatDonorAntigensForComponent = (values: ProtocolValues) =>
  selectedBloodComponentGroup(values, values.componentName) === 'erythrocytes'
    ? formatDonorAntigens(values)
    : '';
