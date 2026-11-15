import { getFormContentKey } from '../../domain/form-content';
import { normalizeDirectionIndications } from './direction-indications';

export const getIndividualSelectionClearValues = () => ({
  requiredComponent: '',
  quantity: '',
  medicalOrganization: '',
  directionDate: '',
  doctorName: '',
  doctorPhone: '',
  indicationValues: normalizeDirectionIndications({}),
  individualSelectionIndications: '',
});

export const hasIndividualSelectionValuesToClear = (
  values: Record<string, unknown>,
  cleared: ReturnType<typeof getIndividualSelectionClearValues>,
) => {
  const clearable = Object.fromEntries(Object.keys(cleared).map((name) => [name, values[name]]));
  return getFormContentKey(clearable) !== getFormContentKey(cleared);
};
