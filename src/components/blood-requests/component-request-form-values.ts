import { BLOOD_COMPONENTS, selectedBloodComponentGroup } from '../../domain/blood-components';
import type { ComponentRequestFormValues } from './component-request-form';

export const visibleRequestComponentValues = (
  values: ComponentRequestFormValues,
): ComponentRequestFormValues => {
  const groupValues = values.indicationValues ?? {};
  const explicitGroup =
    groupValues.componentGroup !== undefined || groupValues.indicationComponent !== undefined;
  const selectedGroup = selectedBloodComponentGroup(groupValues, values.requiredComponent);
  const selected = explicitGroup
    ? BLOOD_COMPONENTS.some(({ value }) => value === selectedGroup)
    : Boolean(selectedGroup || values.requiredComponent || values.componentCode);
  if (selected) return values;

  return {
    ...values,
    requiredComponent: '',
    componentCode: '',
    quantity: '',
    estimatedVolumeMl: '',
    transfusionIndicationCode: '',
    individualSelectionRequired: '',
    individualSelectionCode: '',
  };
};
