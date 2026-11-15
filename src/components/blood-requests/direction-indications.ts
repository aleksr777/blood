import {
  inferBloodComponentGroup,
  selectedBloodComponentGroup,
} from '../../domain/blood-components';
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

type DirectionComponentValues = {
  requiredComponent: string;
  quantity: string;
  individualSelectionIndications: string;
  indicationValues: ProtocolValues;
};

export const visibleDirectionComponentValues = <T extends DirectionComponentValues>(
  values: T,
): T =>
  selectedBloodComponentGroup(values.indicationValues, values.requiredComponent)
    ? values
    : {
        ...values,
        requiredComponent: '',
        quantity: '',
        individualSelectionIndications: '',
        indicationValues: {},
      };
