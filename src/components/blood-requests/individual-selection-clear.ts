import { getFormContentKey } from '../../domain/form-content';
import {
  hasStoredCurrentIndications,
  hasStoredCurrentIndividualSelectionIndications,
  readCurrentIndications,
  readCurrentIndividualSelectionIndications,
} from '../../storage/repositories/current-indications';
import { normalizeDirectionIndications } from './direction-indications';

export const getIndividualSelectionClearValues = (recipientId: number | null) => ({
  requiredComponent: '',
  quantity: '',
  medicalOrganization: '',
  directionDate: '',
  doctorName: '',
  doctorPhone: '',
  indicationValues: normalizeDirectionIndications(
    recipientId && hasStoredCurrentIndications(recipientId, 'erythrocytes')
      ? readCurrentIndications(recipientId, 'erythrocytes')
      : {},
  ),
  individualSelectionIndications:
    recipientId && hasStoredCurrentIndividualSelectionIndications(recipientId)
      ? readCurrentIndividualSelectionIndications(recipientId)
      : '',
});

export const hasIndividualSelectionValuesToClear = (
  values: Record<string, unknown>,
  cleared: ReturnType<typeof getIndividualSelectionClearValues>,
) => {
  const clearable = Object.fromEntries(Object.keys(cleared).map((name) => [name, values[name]]));
  return getFormContentKey(clearable) !== getFormContentKey(cleared);
};
