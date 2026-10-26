import { DONOR_ANTIGENS } from '../transfusion-protocol/donor-model';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import { REGISTRATION_TRANSFUSION_ROWS_FIELD } from '../transfusion-registration/registration-transfusion-table';

const HEMACON_FIELDS = [
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
];

export const clearProtocolHemacon = (values: ProtocolValues): ProtocolValues => ({
  ...values,
  ...Object.fromEntries(HEMACON_FIELDS.map((name) => [name, ''])),
});

export const clearRegistrationTable = (values: ProtocolValues): ProtocolValues => ({
  ...values,
  [REGISTRATION_TRANSFUSION_ROWS_FIELD]: '[]',
});

export const clearComponentRequestSelection = <T extends Record<string, unknown>>(
  values: T,
): T => ({
  ...values,
  requiredComponent: '',
  componentAbo: '',
  componentRh: '',
  quantity: '',
});
