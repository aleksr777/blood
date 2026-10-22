import { REAGENT_MANUFACTURER_FIELDS } from '../../domain/shared-saved-options';
import type { ProtocolValues } from './protocol-types';

export const updateReagentManufacturerFields = (
  values: ProtocolValues,
  previousValue: string,
  nextValue: string,
): ProtocolValues => {
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU');
  return Object.fromEntries(
    REAGENT_MANUFACTURER_FIELDS.filter(
      (name) => normalize(values[name] ?? '') === normalize(previousValue),
    ).map((name) => [name, nextValue]),
  );
};
