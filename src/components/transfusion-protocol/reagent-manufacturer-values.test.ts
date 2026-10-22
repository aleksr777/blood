import { expect, it } from 'vitest';
import { updateReagentManufacturerFields } from './reagent-manufacturer-values';

it.each(['Новый завод', ''])(
  'updates matching manufacturers together to %j while retaining independent choices',
  (nextValue) => {
    const values = {
      reagentAntiAManufacturer: 'Завод А',
      reagentAntiBManufacturer: ' завод   а ',
      reagentAntiABManufacturer: 'ЗАВОД А',
      reagentAntiDManufacturer: 'Другой завод',
      reagentAntiASeries: '123',
    };
    const patch = updateReagentManufacturerFields(values, 'Завод А', nextValue);
    expect(patch).toEqual({
      reagentAntiAManufacturer: nextValue,
      reagentAntiBManufacturer: nextValue,
      reagentAntiABManufacturer: nextValue,
    });
    expect({ ...values, ...patch }).toMatchObject({
      reagentAntiDManufacturer: 'Другой завод',
      reagentAntiASeries: '123',
    });
  },
);
