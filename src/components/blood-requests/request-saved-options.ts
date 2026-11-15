import {
  BLOOD_COMPONENTS,
  getBloodComponentNameCategory,
  inferBloodComponentGroup,
} from '../../domain/blood-components';
import {
  persistDocumentOptions,
  type DocumentOption,
} from '../../storage/repositories/document-options';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import type { RequestEditorField } from './request-editor-modal';

type RequestOptionValues = {
  department?: string;
  requiredComponent?: string;
  indicationValues?: ProtocolValues;
};

export const persistRequestOptions = (
  values: RequestOptionValues,
  fields: readonly RequestEditorField[],
) => {
  const group =
    values.indicationValues?.componentGroup ||
    values.indicationValues?.indicationComponent ||
    inferBloodComponentGroup(values.requiredComponent);
  const componentCategory = getBloodComponentNameCategory(group);
  const fixedNames = BLOOD_COMPONENTS.find(({ value }) => value === group)?.names ?? [];
  const choices: DocumentOption[] = fields.flatMap(({ name, savedOptionsCategory }) => {
    const value = (values as Record<string, unknown>)[name];
    return savedOptionsCategory && typeof value === 'string'
      ? [{ category: savedOptionsCategory, value }]
      : [];
  });
  if (componentCategory && values.requiredComponent) {
    choices.push({
      category: componentCategory,
      value: values.requiredComponent,
      fixedOptions: fixedNames,
    });
  }

  return persistDocumentOptions({ department: values.department, options: choices });
};
