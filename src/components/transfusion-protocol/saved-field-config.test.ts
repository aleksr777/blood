import { expect, it, vi } from 'vitest';
import { rememberSavedOption } from '../../storage/repositories/saved-options';
import { getSavedOptionCategory, persistProtocolOptions } from './saved-field-config';

vi.mock('../../storage/repositories/saved-options', () => ({
  rememberSavedOption: vi.fn(async () => []),
}));
vi.mock('../../storage/repositories/departments', () => ({
  rememberDepartment: vi.fn(async () => []),
}));

it('remembers editable series and manufacturer options for each reagent', () => {
  expect(getSavedOptionCategory('reagentAntiASeries')).not.toBe(
    getSavedOptionCategory('reagentAntiBSeries'),
  );
  expect(getSavedOptionCategory('reagentAntiAManufacturer')).toBe('reagentAntiAManufacturer');
  expect(getSavedOptionCategory('reagentAntiDManufacturer')).toBe('reagentAntiDManufacturer');
  persistProtocolOptions({
    reagentAntiASeries: 'A-123',
    reagentAntiBSeries: 'B-456',
    reagentAntiAManufacturer: 'Производитель',
  });
  expect(rememberSavedOption).toHaveBeenCalledWith('reagentAntiASeries', 'A-123');
  expect(rememberSavedOption).toHaveBeenCalledWith('reagentAntiBSeries', 'B-456');
  expect(rememberSavedOption).toHaveBeenCalledWith('reagentAntiAManufacturer', 'Производитель');
});

it('remembers the two editable monitoring lists for all periods', () => {
  persistProtocolOptions({
    beforeUrine: '100 мл',
    hour1Urine: '200 мл',
    hour2UrineColor: 'Светлая',
  });
  expect(rememberSavedOption).toHaveBeenCalledWith('beforeUrine', '100 мл');
  expect(rememberSavedOption).toHaveBeenCalledWith('hour1Urine', '200 мл');
  expect(rememberSavedOption).toHaveBeenCalledWith('hour2UrineColor', 'Светлая');
  expect(getSavedOptionCategory('beforeUrineColor')).toBe('beforeUrineColor');
});
