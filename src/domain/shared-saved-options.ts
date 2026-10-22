export const URINE_COLOR_OPTION_CATEGORY = 'urineColor';

export const URINE_COLOR_FIELDS = [
  'beforeUrineColor',
  'hour1UrineColor',
  'hour2UrineColor',
] as const;

export const REAGENT_MANUFACTURER_OPTION_CATEGORY = 'reagentManufacturer';

export const REAGENT_MANUFACTURER_FIELDS = [
  'reagentAntiAManufacturer',
  'reagentAntiBManufacturer',
  'reagentAntiABManufacturer',
  'reagentAntiDManufacturer',
] as const;

export const SHARED_SAVED_OPTION_GROUPS = [
  { category: URINE_COLOR_OPTION_CATEGORY, fields: URINE_COLOR_FIELDS },
  { category: REAGENT_MANUFACTURER_OPTION_CATEGORY, fields: REAGENT_MANUFACTURER_FIELDS },
] as const;
