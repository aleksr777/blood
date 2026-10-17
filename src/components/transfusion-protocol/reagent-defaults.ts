import type { ProtocolValues } from './protocol-types';
import { formatDate } from './protocol-types';

const STORAGE_KEY = 'blood:reagent-defaults';

export const REAGENTS = [
  {
    title: 'Цоликлон "анти-A"',
    series: 'reagentAntiASeries',
    expiration: 'reagentAntiAExpiration',
    manufacturer: 'reagentAntiAManufacturer',
  },
  {
    title: 'Цоликлон "анти-B"',
    series: 'reagentAntiBSeries',
    expiration: 'reagentAntiBExpiration',
    manufacturer: 'reagentAntiBManufacturer',
  },
  {
    title: 'Цоликлон "анти-AB"',
    series: 'reagentAntiABSeries',
    expiration: 'reagentAntiABExpiration',
    manufacturer: 'reagentAntiABManufacturer',
  },
  {
    title: 'Цоликлон "анти-D"',
    series: 'reagentAntiDSeries',
    expiration: 'reagentAntiDExpiration',
    manufacturer: 'reagentAntiDManufacturer',
  },
] as const;

export const REAGENT_DEFAULT_FIELDS = REAGENTS.flatMap(({ series, expiration, manufacturer }) => [
  series,
  expiration,
  manufacturer,
]);

const fieldSet = new Set<string>(REAGENT_DEFAULT_FIELDS);

export const hasReagentDefaultUpdate = (values: ProtocolValues) =>
  Object.keys(values).some((name) => fieldSet.has(name));

export const pickReagentDefaults = (values: ProtocolValues): ProtocolValues =>
  Object.fromEntries(REAGENT_DEFAULT_FIELDS.map((name) => [name, values[name] ?? '']));

export const loadReagentDefaults = (): ProtocolValues => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      REAGENT_DEFAULT_FIELDS.map((name) => [
        name,
        typeof parsed[name] === 'string' ? parsed[name] : '',
      ]),
    );
  } catch (error) {
    console.error('Не удалось загрузить сохранённые данные цоликлонов:', error);
    return {};
  }
};

export const saveReagentDefaults = (values: ProtocolValues) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pickReagentDefaults(values)));
  } catch (error) {
    console.error('Не удалось сохранить данные цоликлонов:', error);
  }
};

export const reagentDefaultsForNewBlank = (values: ProtocolValues): ProtocolValues => {
  const stored = loadReagentDefaults();

  if (Object.keys(stored).length > 0) {
    return stored;
  }

  const current = pickReagentDefaults(values);
  saveReagentDefaults(current);
  return current;
};

const localIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getReagentExpirationWarning = (
  title: string,
  expirationDate?: string,
  now = new Date(),
) => {
  if (!expirationDate || expirationDate >= localIsoDate(now)) return '';

  return `${title} — срок годности истёк ${formatDate(expirationDate)}`;
};

export const getExpiredReagentWarnings = (
  values: ProtocolValues,
  now = new Date(),
): string[] =>
  REAGENTS.flatMap(({ title, expiration }) => {
    const warning = getReagentExpirationWarning(title, values[expiration], now);
    return warning ? [warning] : [];
  });

export const getHemaconExpirationWarning = (
  expirationDate?: string,
  now = new Date(),
) => {
  if (!expirationDate || expirationDate >= localIsoDate(now)) return '';

  return `Срок годности гемакона истёк ${formatDate(expirationDate)}`;
};
