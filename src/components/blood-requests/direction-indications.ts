import { inferBloodComponentGroup } from '../../domain/blood-components';
import { getIndicationComponent } from '../transfusion-protocol/indications-model';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';

export const normalizeDirectionIndications = (
  values: ProtocolValues = {},
  componentName = '',
): ProtocolValues => {
  const groupWasCleared = values.componentGroup === '' && values.indicationComponent === '';
  const component = groupWasCleared
    ? ''
    : getIndicationComponent(values) || inferBloodComponentGroup(componentName) || 'erythrocytes';

  return { ...values, componentGroup: component, indicationComponent: component };
};
