import { expect, it } from 'vitest';
import { normalizeDirectionIndications } from './direction-indications';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';

it.each<[ProtocolValues | undefined, string, string]>([
  [undefined, '', 'erythrocytes'],
  [{ indicationRbcHemicHypoxia: '1' }, 'Нестандартное наименование', 'erythrocytes'],
  [{ componentGroup: 'plasma-cryo', indicationComponent: 'erythrocytes' }, '', 'plasma-cryo'],
  [{ indicationComponent: 'platelets', indicationPlateletCount: '50' }, '', 'platelets'],
  [{}, 'Свежезамороженная плазма', 'plasma-cryo'],
  [{ componentGroup: 'platelets' }, 'Отмытые эритроциты', 'platelets'],
])(
  'restores a direction group without replacing an existing selection: %j, %s',
  (values, name, group) => {
    const original = values && { ...values };
    expect(normalizeDirectionIndications(values, name)).toEqual({
      ...values,
      componentGroup: group,
      indicationComponent: group,
    });
    expect(values).toEqual(original);
  },
);
