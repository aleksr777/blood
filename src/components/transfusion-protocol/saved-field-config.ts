import { persistDocumentOptions } from '../../storage/repositories/document-options';
import { BLOOD_COMPONENTS, getBloodComponentNameCategory } from '../../domain/blood-components';
import type { ProtocolValues } from './protocol-types';
import { REAGENTS } from './reagent-defaults';
import { URINE_COLOR_FIELDS, SHARED_SAVED_OPTION_GROUPS } from '../../domain/shared-saved-options';

const sharedCategories = new Map<string, string>(
  SHARED_SAVED_OPTION_GROUPS.flatMap(({ category, fields }) =>
    fields.map((field) => [field, category] as const),
  ),
);
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

// Values are persisted only by the successful document-save workflow.
export const persistProtocolOptions = (values: ProtocolValues) => {
  const group = values.componentGroup || values.indicationComponent || '';
  const componentCategory = getBloodComponentNameCategory(group);
  const fixedNames = BLOOD_COMPONENTS.find(({ value }) => value === group)?.names ?? [];

  return persistDocumentOptions({
    department: values.department,
    options: [
      ...(componentCategory
        ? [{ category: componentCategory, value: values.componentName, fixedOptions: fixedNames }]
        : []),
      ...[...SAVED_OPTION_FIELDS].map((fieldName) => ({
        category: getSavedOptionCategory(fieldName)!,
        value: values[fieldName],
      })),
    ],
  });
};
