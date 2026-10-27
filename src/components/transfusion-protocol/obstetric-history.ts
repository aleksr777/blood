import type { ProtocolValues } from './protocol-types';

export const OBSTETRIC_UNKNOWN = 'Не известно';
export const OBSTETRIC_HISTORY_FIELDS = [
  'recipientPregnanciesCount',
  'recipientBirthsCount',
  'recipientSpontaneousAbortionsCount',
  'recipientHemolyticDiseaseNewbornHistory',
] as const;

export const isObstetricValueUnknown = (value?: string) =>
  value?.trim().toLocaleLowerCase('ru-RU').replace(/\s+/g, '') === 'неизвестно';

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
    'Самопроизвольные аборты в анамнезе',
    'Самопроизвольных абортов в анамнезе не было',
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
  /^0+$/.test(values.recipientPregnanciesCount?.trim() ?? '');

export const isObstetricHistoryUnknown = (values: ProtocolValues) =>
  values.recipientObstetricHistoryStatus === 'unknown' ||
  OBSTETRIC_HISTORY_FIELDS.every((name) => isObstetricValueUnknown(values[name]));

export const formatObstetricHistory = (values: ProtocolValues) => {
  if (isObstetricHistoryUnknown(values)) return 'Не известен';
  if (hasNoPregnancies(values)) return 'Беременностей не было';

  const parts = COUNT_FIELDS.flatMap(([name, label, zeroText, forms]) => {
    const value = values[name]?.trim();
    if (!value) return [];
    const count = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(count)) return [`${label}: ${value}`];
    if (count === 0) return [zeroText];
    const countText = `${count} ${countWord(count, forms)}`;
    return [
      name === 'recipientBirthsCount'
        ? `Роды в анамнезе были ${countText}`
        : `${countText} в анамнезе`,
    ];
  });

  const newbornHistory = values.recipientHemolyticDiseaseNewbornHistory?.trim();
  if (newbornHistory) {
    switch (newbornHistory.toLocaleLowerCase('ru-RU')) {
      case 'да':
        parts.push('Гемолитическая болезнь новорождённых в анамнезе отмечалась');
        break;
      case 'нет':
        parts.push('Гемолитической болезни новорождённых в анамнезе не было');
        break;
      default:
        parts.push(`Гемолитическая болезнь новорождённых в анамнезе: ${newbornHistory}`);
    }
  }
  return parts.join('; ');
};
