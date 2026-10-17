const parseIsoDate = (value?: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
};

const currentLocalDateParts = (date = new Date()) => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  day: date.getDate(),
});

export const calculateRecipientAge = (
  birthDate?: string,
  referenceDate?: string,
): number | null => {
  const birth = parseIsoDate(birthDate);
  if (!birth) return null;

  const reference = parseIsoDate(referenceDate) ?? currentLocalDateParts();

  let age = reference.year - birth.year;
  if (
    reference.month < birth.month ||
    (reference.month === birth.month && reference.day < birth.day)
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const ageWord = (age: number) => {
  const mod100 = age % 100;
  const mod10 = age % 10;

  if (mod100 >= 11 && mod100 <= 14) return 'лет';
  if (mod10 === 1) return 'год';
  if (mod10 >= 2 && mod10 <= 4) return 'года';
  return 'лет';
};

export const formatRecipientAge = (
  birthDate?: string,
  referenceDate?: string,
) => {
  const age = calculateRecipientAge(birthDate, referenceDate);
  return age === null ? '' : `${age} ${ageWord(age)}`;
};
