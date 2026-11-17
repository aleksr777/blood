import { selectedBloodComponentGroup } from '../../domain/blood-components';
import { formatComponentUnitNumber } from './component-unit-number';
import { formatDonorAntigensForComponent } from './donor-model';
import { LabeledCell } from './form-controls';
import type { ProtocolValues } from './protocol-types';

export const DonorComponentRow = ({ values }: { values: ProtocolValues }) => {
  const isErythrocytes =
    selectedBloodComponentGroup(values, values.componentName) === 'erythrocytes';
  const cellSpan = isErythrocytes ? 2 : 3;
  return (
    <tr>
      <LabeledCell
        colSpan={cellSpan}
        className={`span-${cellSpan}`}
        label="N единицы компонента крови"
        value={formatComponentUnitNumber(values.componentUnitNumber)}
      />
      <LabeledCell
        colSpan={cellSpan}
        className={`span-${cellSpan}`}
        label="Количество (мл)"
        value={values.amountMl}
      />
      {isErythrocytes && (
        <LabeledCell
          colSpan={cellSpan}
          className={`span-${cellSpan}`}
          label="Антигены эритроцитов донора"
          value={formatDonorAntigensForComponent(values)}
        />
      )}
    </tr>
  );
};
