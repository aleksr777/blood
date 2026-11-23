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

export const obstetricNewbornHistoryLabel = (value: string) => {
  const normalized = value.trim().toLocaleLowerCase('ru-RU');
  return normalized === 'да' ? 'Было' : normalized === 'нет' ? 'Не было' : value;
};

// Old documents have one status for the entire history. Keep that meaning until
// the user explicitly edits an individual field, without changing the snapshot.
export const obstetricValuesForEditing = (values: ProtocolValues): ProtocolValues =>
  Object.fromEntries(
    OBSTETRIC_HISTORY_FIELDS.map((name) => [
      name,
      values.recipientObstetricHistoryStatus === 'unknown'
        ? OBSTETRIC_UNKNOWN
        : name === 'recipientHemolyticDiseaseNewbornHistory'
          ? obstetricNewbornHistoryLabel(values[name] ?? '')
          : (values[name] ?? ''),
    ]),
  );

const COUNT_FIELDS = [
  [
    'recipientPregnanciesCount',
    'беременностей',
    'Беременностей не было',
    'Количество беременностей - не известно',
  ],
  ['recipientBirthsCount', 'родов', 'Родов не было', 'Количество родов - не известно'],
  [
    'recipientSpontaneousAbortionsCount',
    'самопроизвольных абортов',
    'Самопроизвольных абортов не было',
    'Количество самопроизвольных абортов - не известно',
  ],
] as const;

export const hasNoPregnancies = (values: ProtocolValues) =>
  isObstetricCountNone(values.recipientPregnanciesCount);

export const isNewbornHistoryBlocked = (values: ProtocolValues) =>
  hasNoPregnancies(values) ||
  !values.recipientBirthsCount?.trim() ||
  isObstetricCountNone(values.recipientBirthsCount) ||
  isObstetricValueUnknown(values.recipientBirthsCount);

export const formatObstetricHistory = (values: ProtocolValues) => {
  const displayed = obstetricValuesForEditing(values);
  if (hasNoPregnancies(displayed)) return 'Беременностей не было';

  const parts = COUNT_FIELDS.flatMap(([name, label, zeroText, unknownText]) => {
    const value = displayed[name].trim();
    if (!value) return [];
    if (isObstetricValueUnknown(value)) return [unknownText];
    if (isObstetricCountNone(value)) return [zeroText];
    const count = Number(value);
    const display = /^\d+$/.test(value) && Number.isSafeInteger(count) ? String(count) : value;
    return [`Количество ${label} в анамнезе - ${display}`];
  });

  const newbornHistory = displayed.recipientHemolyticDiseaseNewbornHistory.trim();
  if (newbornHistory && !isNewbornHistoryBlocked(displayed)) {
    switch (newbornHistory.toLocaleLowerCase('ru-RU')) {
      case 'да':
      case 'было':
        parts.push('В анамнезе была гемолитическая болезнь новорождённого');
        break;
      case 'нет':
      case 'не было':
        parts.push('Гемолитической болезни новорождённого в анамнезе не было');
        break;
      default:
        parts.push(
          isObstetricValueUnknown(newbornHistory)
            ? 'Наличие гемолитической болезни новорождённого в анамнезе - не известно'
            : `Гемолитическая болезнь новорождённого в анамнезе: ${newbornHistory}`,
        );
    }
  }
  return parts.length ? `${parts.join('. ')}.` : '';
};
