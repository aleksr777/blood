import type { ProtocolValues } from './protocol-types';

export const OBSTETRIC_UNKNOWN = 'Не известно';
const OBSTETRIC_NONE = 'Не было';
const OBSTETRIC_HISTORY_FIELDS = [
  'recipientPregnanciesCount',
  'recipientBirthsCount',
  'recipientSpontaneousAbortionsCount',
  'recipientHemolyticDiseaseNewbornHistory',
] as const;

const isObstetricValueUnknown = (value?: string) =>
  value?.trim().toLocaleLowerCase('ru-RU').replace(/\s+/g, '') === 'неизвестно';

const isObstetricCountNone = (value?: string) =>
  /^0+$/.test(value?.trim() ?? '') || value?.trim().toLocaleLowerCase('ru-RU') === 'не было';

export const obstetricCountLabel = (value: string) =>
  isObstetricValueUnknown(value)
    ? OBSTETRIC_UNKNOWN
    : isObstetricCountNone(value)
      ? OBSTETRIC_NONE
      : value;

// Old documents have one status for the entire history. Keep that meaning until
// the user explicitly edits an individual field, without changing the snapshot.
export const obstetricValuesForEditing = (values: ProtocolValues): ProtocolValues =>
  Object.fromEntries(
    OBSTETRIC_HISTORY_FIELDS.map((name) => [
      name,
      values.recipientObstetricHistoryStatus === 'unknown'
        ? OBSTETRIC_UNKNOWN
        : (values[name] ?? ''),
    ]),
  );

const COUNT_FIELDS = [
  [
    'recipientPregnanciesCount',
    'Количество беременностей',
    'Беременностей не было',
    ['беременность', 'беременности', 'беременностей'],
  ],
  ['recipientBirthsCount', 'Количество родов', 'Родов не было', ['раз', 'раза', 'раз']],
  [
    'recipientSpontaneousAbortionsCount',
    'Количество самопроизвольных абортов',
    'Самопроизвольных абортов не было',
    ['самопроизвольный аборт', 'самопроизвольных аборта', 'самопроизвольных абортов'],
  ],
] as const;

const countWord = (count: number, forms: readonly [string, string, string]) => {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
};

export const hasNoPregnancies = (values: ProtocolValues) =>
  isObstetricCountNone(values.recipientPregnanciesCount);

export const isNewbornHistoryBlocked = (values: ProtocolValues) =>
  hasNoPregnancies(values) ||
  isObstetricCountNone(values.recipientBirthsCount) ||
  isObstetricValueUnknown(values.recipientBirthsCount);

const isObstetricHistoryUnknown = (values: ProtocolValues) =>
  values.recipientObstetricHistoryStatus === 'unknown' ||
  OBSTETRIC_HISTORY_FIELDS.every((name) => isObstetricValueUnknown(values[name]));

export const formatObstetricHistory = (values: ProtocolValues) => {
  if (isObstetricHistoryUnknown(values)) return 'Не известен';
  if (hasNoPregnancies(values)) return 'Беременностей не было';

  const parts = COUNT_FIELDS.flatMap(([name, label, zeroText, forms]) => {
    const value = values[name]?.trim();
    if (!value) return [];
    if (isObstetricValueUnknown(value)) return [`${label} неизвестно`];
    if (isObstetricCountNone(value)) return [zeroText];
    const count = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(count)) return [`${label}: ${value}`];
    const countText = `${count} ${countWord(count, forms)}`;
    return [
      name === 'recipientBirthsCount'
        ? `Роды — ${countText}`
        : name === 'recipientPregnanciesCount'
          ? `В анамнезе ${countText}`
          : `${countText} в анамнезе`,
    ];
  });

  const newbornHistory = values.recipientHemolyticDiseaseNewbornHistory?.trim();
  if (newbornHistory && !isNewbornHistoryBlocked(values)) {
    switch (newbornHistory.toLocaleLowerCase('ru-RU')) {
      case 'да':
        parts.push('Гемолитическая болезнь новорождённых отмечалась');
        break;
      case 'нет':
        parts.push('Гемолитическая болезнь новорождённых не отмечалась');
        break;
      default:
        parts.push(
          isObstetricValueUnknown(newbornHistory)
            ? 'Сведения о гемолитической болезни новорождённых неизвестны'
            : `Гемолитическая болезнь новорождённых: ${newbornHistory}`,
        );
    }
  }
  return parts.length ? `${parts.join('. ')}.` : '';
};
