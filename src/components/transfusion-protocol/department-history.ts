const STORAGE_KEY = 'blood.protocol.departments';

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');

const unique = (values: string[]) => {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = value.toLocaleLowerCase('ru-RU');
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const loadDepartmentHistory = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(stored)) return [];

    return unique(
      stored.filter((value): value is string => typeof value === 'string').map(normalize),
    );
  } catch {
    return [];
  }
};

const writeDepartmentHistory = (values: string[]) => {
  const nextValues = unique(values.map(normalize));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextValues));
  return nextValues;
};

export const rememberDepartment = (value: string) => {
  const department = normalize(value);
  if (!department) return loadDepartmentHistory();

  const history = loadDepartmentHistory().filter(
    (item) => item.toLocaleLowerCase('ru-RU') !== department.toLocaleLowerCase('ru-RU'),
  );

  return writeDepartmentHistory([department, ...history]);
};

export const renameDepartment = (oldValue: string, newValue: string) => {
  const replacement = normalize(newValue);
  if (!replacement) return removeDepartment(oldValue);

  const history = loadDepartmentHistory().map((item) => (item === oldValue ? replacement : item));
  return writeDepartmentHistory(history);
};

export const removeDepartment = (value: string) =>
  writeDepartmentHistory(loadDepartmentHistory().filter((item) => item !== value));
