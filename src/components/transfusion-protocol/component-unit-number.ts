import type { ProtocolValues } from './protocol-types';

const COMPONENT_UNIT_DIGITS = 14;

const getComponentUnitDigits = (value?: string) =>
  (value ?? '').replace(/\D/g, '').slice(0, COMPONENT_UNIT_DIGITS);

export const formatComponentUnitNumber = (value?: string) => {
  const digits = getComponentUnitDigits(value);
  if (!digits) return '';

  return [digits.slice(0, 6), digits.slice(6, 12), digits.slice(12, 14)].filter(Boolean).join(' ');
};

export const getComponentUnitNumberWarning = (values: ProtocolValues) => {
  const digits = getComponentUnitDigits(values.componentUnitNumber);
  if (!digits || digits.length === COMPONENT_UNIT_DIGITS) {
    return { key: '', message: '' };
  }

  return {
    key: digits,
    message:
      `Номер единицы компонента крови введён не полностью.\n\nВведено: ${digits.length} из ${COMPONENT_UNIT_DIGITS} цифр.\n` +
      'Проверьте номер на этикетке гемакона.\nОжидаемый формат: 761022 000456 36.',
  };
};
