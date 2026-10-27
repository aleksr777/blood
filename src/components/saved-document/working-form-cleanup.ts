import { DONOR_ANTIGENS } from '../transfusion-protocol/donor-model';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import { getMonitoringFields, MONITORING_PERIODS } from '../transfusion-protocol/monitoring-model';
import { REGISTRATION_TRANSFUSION_ROWS_FIELD } from '../transfusion-registration/registration-transfusion-table';

const PROTOCOL_RESET_FIELDS = [
  'componentName',
  'collectionOrganization',
  'componentUnitNumber',
  'amountMl',
  'collectionDate',
  'expirationDate',
  'donorAbo',
  'donorRh',
  'donorAntigens',
  ...DONOR_ANTIGENS.map(({ name }) => name),
  'startTime',
  'endTime',
  'doctorName',
  'nurseName',
  ...MONITORING_PERIODS.flatMap(({ prefix }) =>
    getMonitoringFields(prefix).map(({ name }) => name),
  ),
];

export const cleanProtocolDraft = (values: ProtocolValues): ProtocolValues => ({
  ...values,
  ...Object.fromEntries(PROTOCOL_RESET_FIELDS.map((name) => [name, ''])),
});

export const clearRegistrationTable = (values: ProtocolValues): ProtocolValues => ({
  ...values,
  [REGISTRATION_TRANSFUSION_ROWS_FIELD]: '[]',
});

export const cleanComponentRequestDraft = <T extends Record<string, unknown>>(values: T): T => ({
  ...values,
  requiredComponent: '',
  componentAbo: '',
  componentRh: '',
  quantity: '',
  doctorName: '',
});

export const clearIndividualSelectionStaff = <T extends Record<string, unknown>>(values: T): T => ({
  ...values,
  doctorName: '',
  doctorPhone: '',
});
