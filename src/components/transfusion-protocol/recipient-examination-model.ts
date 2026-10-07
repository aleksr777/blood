import type { ProtocolValues } from './protocol-types';

export const RECIPIENT_ANTIGENS = [
  { name: 'recipientAntigenC', symbol: 'C', label: 'C' },
  { name: 'recipientAntigenc', symbol: 'c', label: 'c' },
  { name: 'recipientAntigenCw', symbol: 'Cʷ', label: 'Cʷ' },
  { name: 'recipientAntigenE', symbol: 'E', label: 'E' },
  { name: 'recipientAntigene', symbol: 'e', label: 'e' },
  { name: 'recipientAntigenK', symbol: 'K', label: 'K' },
  { name: 'recipientAntigenk', symbol: 'k', label: 'k' },
] as const;

export const ANTIBODY_STATUS = {
  notFound: 'not-found',
  found: 'found',
} as const;

export const formatRecipientAntigens = (values: ProtocolValues) => {
  const hasStructured = RECIPIENT_ANTIGENS.some(({ name }) => Boolean(values[name]));
  if (!hasStructured) return values.recipientAntigens ?? '';

  return RECIPIENT_ANTIGENS
    .flatMap(({ name, symbol }) => (values[name] ? [`${symbol}${values[name]}`] : []))
    .join(' ');
};

export const formatAlloimmuneAntibodies = (values: ProtocolValues) => {
  if (values.alloimmuneAntibodyStatus === ANTIBODY_STATUS.notFound) return 'не найдены';
  if (values.alloimmuneAntibodyStatus === ANTIBODY_STATUS.found) {
    const description = values.alloimmuneAntibodyDescription?.trim();
    return description ? `найдены: ${description}` : 'найдены';
  }
  return values.alloimmuneAntibodies ?? '';
};
