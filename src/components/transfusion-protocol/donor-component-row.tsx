import { selectedBloodComponentGroup } from '../../domain/blood-components';
import { formatComponentUnitNumber } from './component-unit-number';
import { formatDonorAntigensForComponent } from './donor-model';
import { LabeledCell } from './form-controls';
import type { ProtocolValues } from './protocol-types';

export const DonorComponentRow = ({ values }: { values: ProtocolValues }) => {
  const isErythrocytes =
    selectedBloodComponentGroup(values, values.componentName) === 'erythrocytes';
  return (
    <tr>
      <LabeledCell
        colSpan={2}
        label="N единицы компонента крови"
        value={formatComponentUnitNumber(values.componentUnitNumber)}
      />
      <LabeledCell
        colSpan={isErythrocytes ? 1 : 4}
        label="Количество (мл)"
        value={values.amountMl}
      />
      {isErythrocytes && (
        <LabeledCell
          colSpan={3}
          className="span-3"
          label="Антигены эритроцитов донора"
          value={formatDonorAntigensForComponent(values)}
        />
      )}
    </tr>
  );
};
