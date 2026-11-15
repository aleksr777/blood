import { rememberDepartment } from './departments';
import { rememberSavedOption } from './saved-options';

export type DocumentOption = {
  category: string;
  value?: string;
  fixedOptions?: readonly string[];
};

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU');

// Call only after the document record has been successfully written to the database.
// A failed dictionary update must not turn a successfully saved document into an error.
export const persistDocumentOptions = async ({
  department,
  options,
}: {
  department?: string;
  options: readonly DocumentOption[];
}) => {
  const jobs: Array<Promise<unknown>> = [];
  if (department?.trim()) {
    jobs.push(
      rememberDepartment(department.trim()).catch((error: unknown) =>
        console.error('Не удалось сохранить вариант отделения:', error),
      ),
    );
  }

  const seen = new Set<string>();
  for (const { category, value, fixedOptions = [] } of options) {
    const key = normalize(value ?? '');
    if (!category || !key || fixedOptions.some((option) => normalize(option) === key)) continue;
    const uniqueKey = `${category}:\u0000${key}`;
    if (seen.has(uniqueKey)) continue;
    seen.add(uniqueKey);
    jobs.push(
      rememberSavedOption(category, value!.trim()).catch((error: unknown) =>
        console.error(`Не удалось сохранить вариант ${category}:`, error),
      ),
    );
  }

  await Promise.all(jobs);
};
