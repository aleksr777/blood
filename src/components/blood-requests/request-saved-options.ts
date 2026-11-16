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
import { componentCatalogForGroup } from './component-request-catalog';
import { codedComponentOptionCategory, formatCodedComponent } from '../../domain/coded-component';
import type { RequestEditorField } from './request-editor-modal';
import {
  INDIVIDUAL_SELECTION_INDICATIONS,
  INDIVIDUAL_SELECTION_REASON_CATEGORY,
} from './component-request-447n';

type RequestOptionValues = {
  department?: string;
  requiredComponent?: string;
  componentCode?: string;
  indicationValues?: ProtocolValues;
  individualSelectionRequired?: string;
  individualSelectionCode?: string;
  individualSelectionIndications?: string;
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
  const selectionReason =
    values.individualSelectionRequired === undefined
      ? values.individualSelectionIndications
      : values.individualSelectionRequired === 'yes'
        ? values.individualSelectionCode
        : '';
  if (
    group &&
    selectionReason &&
    !INDIVIDUAL_SELECTION_INDICATIONS.some(({ code }) => code === selectionReason)
  ) {
    choices.push({
      category: INDIVIDUAL_SELECTION_REASON_CATEGORY,
      value: selectionReason,
      fixedOptions: INDIVIDUAL_SELECTION_INDICATIONS.map(({ label }) => label),
    });
  }
  if (componentCategory && values.requiredComponent) {
    choices.push({
      category: componentCategory,
      value: values.requiredComponent,
      fixedOptions: fixedNames,
    });
  }
  if (componentCategory && values.componentCode?.trim() && values.requiredComponent?.trim()) {
    choices.push({
      category: codedComponentOptionCategory(group),
      value: formatCodedComponent({
        code: values.componentCode.trim(),
        name: values.requiredComponent.trim(),
      }),
      fixedOptions: componentCatalogForGroup(group).map(formatCodedComponent),
    });
  }

  return persistDocumentOptions({ department: values.department, options: choices });
};
