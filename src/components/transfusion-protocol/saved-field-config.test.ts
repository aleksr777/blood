import { beforeEach, expect, it, vi } from 'vitest';
import { rememberSavedOption } from '../../storage/repositories/saved-options';
import { getSavedOptionCategory, persistProtocolOptions } from './saved-field-config';
import { URINE_COLOR_FIELDS, URINE_COLOR_OPTION_CATEGORY } from '../../domain/urine-color-options';

beforeEach(() => vi.clearAllMocks());

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

it('uses one color list for all periods and never remembers numeric diuresis as an option', () => {
  persistProtocolOptions({
    beforeUrine: '100',
    hour1Urine: '200',
    beforeUrineColor: 'Жёлтая',
    hour1UrineColor: 'Светло-жёлтая',
    hour2UrineColor: 'Светлая',
  });
  expect(rememberSavedOption).toHaveBeenCalledTimes(3);
  for (const color of ['Жёлтая', 'Светло-жёлтая', 'Светлая']) {
    expect(rememberSavedOption).toHaveBeenCalledWith(URINE_COLOR_OPTION_CATEGORY, color);
  }
  for (const field of URINE_COLOR_FIELDS) {
    expect(getSavedOptionCategory(field)).toBe(URINE_COLOR_OPTION_CATEGORY);
  }
  for (const prefix of ['before', 'hour1', 'hour2']) {
    expect(getSavedOptionCategory(`${prefix}Urine`)).toBeNull();
  }
});
