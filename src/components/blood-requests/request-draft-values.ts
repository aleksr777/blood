const stringValues = (value: unknown): Record<string, string> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(
        Object.entries(value).filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string',
        ),
      )
    : {};

// Both request forms have string fields plus maps for indications, the saved
// recipient profile and autofill. Restore only the fields belonging to this form.
export const restoreRequestDraft = <T extends Record<string, unknown>>(
  blank: T,
  source: unknown,
): T => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return blank;
  const values = source as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(blank).map(([name, initial]) => [
      name,
      typeof initial === 'string'
        ? typeof values[name] === 'string'
          ? values[name]
          : initial
        : stringValues(values[name]),
    ]),
  ) as T;
};
