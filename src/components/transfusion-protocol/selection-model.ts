import type { ProtocolValues } from './protocol-types';

export const SELECTION_STATUS = {
  notPerformed: 'not-performed',
  performed: 'performed',
} as const;

export type SelectionStatus = (typeof SELECTION_STATUS)[keyof typeof SELECTION_STATUS];

const SELECTION_DETAIL_FIELDS = [
  'selectionOrganization',
  'selectionDate',
  'responsiblePerson',
  'compatibilityConclusion',
] as const;

export const getSelectionStatus = (values: ProtocolValues): SelectionStatus | '' => {
  const status = values.selectionStatus;
  if (status === SELECTION_STATUS.notPerformed || status === SELECTION_STATUS.performed) {
    return status;
  }

  // Preserve existing records created before the status selector was added.
  return SELECTION_DETAIL_FIELDS.some((field) => values[field]?.trim())
    ? SELECTION_STATUS.performed
    : '';
};
