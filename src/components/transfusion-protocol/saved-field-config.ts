import { rememberDepartment } from '../../storage/repositories/departments';
import { rememberSavedOption } from '../../storage/repositories/saved-options';
import type { ProtocolValues } from './protocol-types';
import { REAGENTS } from './reagent-defaults';
import { URINE_COLOR_FIELDS, SHARED_SAVED_OPTION_GROUPS } from '../../domain/shared-saved-options';

const sharedCategories = new Map<string, string>(
  SHARED_SAVED_OPTION_GROUPS.flatMap(({ category, fields }) =>
    fields.map((field) => [field, category] as const),
  ),
);
const sharedCategoryNames = new Set<string>(
  SHARED_SAVED_OPTION_GROUPS.map(({ category }) => category),
);

export const isSharedSavedOptionCategory = (category: string) => sharedCategoryNames.has(category);

const SAVED_OPTION_FIELDS = new Set([
  'collectionOrganization',
  'selectionOrganization',
  'responsiblePerson',
  'doctorName',
  'nurseName',
  ...REAGENTS.flatMap(({ series, manufacturer }) => [series, manufacturer]),
  ...URINE_COLOR_FIELDS,
]);

export const getSavedOptionCategory = (fieldName: string) => {
  const sharedCategory = sharedCategories.get(fieldName);
  if (sharedCategory) return sharedCategory;
  return SAVED_OPTION_FIELDS.has(fieldName) ? fieldName : null;
};

export const getComponentNameOptionCategory = (componentGroup?: string) =>
  componentGroup ? `componentName:${componentGroup}` : null;

const logStorageError = (fieldName: string, error: unknown) => {
  console.error(`Не удалось сохранить значение поля ${fieldName}:`, error);
};

export const persistProtocolOptions = (values: ProtocolValues) => {
  if (values.department) {
    void rememberDepartment(values.department).catch((error: unknown) =>
      logStorageError('department', error),
    );
  }

  const componentNameCategory = getComponentNameOptionCategory(values.componentGroup);
  if (componentNameCategory && values.componentName) {
    void rememberSavedOption(componentNameCategory, values.componentName).catch((error: unknown) =>
      logStorageError('componentName', error),
    );
  }

  SAVED_OPTION_FIELDS.forEach((fieldName) => {
    const value = values[fieldName];
    if (!value) return;

    void rememberSavedOption(getSavedOptionCategory(fieldName)!, value).catch((error: unknown) =>
      logStorageError(fieldName, error),
    );
  });
};
