import type { ProtocolValues } from '../transfusion-protocol/protocol-types';

export type ComponentRequestDetailsValues = {
  requiredComponent: string;
  componentCode: string;
  quantity: string;
  estimatedVolumeMl: string;
  transfusionIndicationCode: string;
  individualSelectionRequired: string;
  individualSelectionCode: string;
  indicationValues: ProtocolValues;
};
