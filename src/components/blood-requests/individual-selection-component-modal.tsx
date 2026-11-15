import { IndividualSelectionReasonSelect } from './individual-selection-reason-select';
import Modal from '../modal/modal';
import { IndicationsFields } from '../transfusion-protocol/indications-fields';
import {
  BloodComponentSelector,
  type BloodComponentSelection,
} from '../blood-component-selector/blood-component-selector';
import { BLOOD_COMPONENTS, selectedBloodComponentGroup } from '../../domain/blood-components';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import { BoundedIntegerInput } from '../bounded-integer-input/bounded-integer-input';
import styles from './individual-selection-component-modal.module.css';

type Props = {
  requiredComponent: string;
  quantity: string;
  individualSelectionIndications: string;
  indicationValues: ProtocolValues;
  onLocalChange: (values: Record<string, string>) => void;
  onIndicationsChange: (values: ProtocolValues) => void;
  onClose: () => void;
};

export const IndividualSelectionComponentModal = ({
  requiredComponent,
  quantity,
  individualSelectionIndications,
  indicationValues,
  onLocalChange,
  onIndicationsChange,
  onClose,
}: Props) => {
  const component = selectedBloodComponentGroup(indicationValues, requiredComponent);
  const effectiveIndicationValues = {
    ...indicationValues,
    componentGroup: component,
    indicationComponent: component,
  };
  const hasSelectedComponent = BLOOD_COMPONENTS.some(({ value }) => value === component);
  const handleIndicationsChange = (changes: ProtocolValues) => {
    onIndicationsChange({
      ...(component ? { componentGroup: component, indicationComponent: component } : {}),
      ...changes,
    });
  };

  const handleComponentChange = ({ group, name }: BloodComponentSelection) => {
    if (
      group !== indicationValues.componentGroup ||
      group !== indicationValues.indicationComponent
    ) {
      handleIndicationsChange({
        componentGroup: group,
        indicationComponent: group,
        lastSelectedComponentGroup: group || component,
      });
    }
    onLocalChange({ requiredComponent: name });
  };

  return (
    <Modal title="Выбор компонента и показания" onClose={onClose} className={styles.modal}>
      <div className={styles.root}>
        <BloodComponentSelector
          group={component ?? ''}
          lastSelectedGroup={indicationValues.lastSelectedComponentGroup}
          name={requiredComponent}
          inputName="requiredComponent"
          onChange={handleComponentChange}
        />

        <fieldset
          className={styles.dependentFields}
          disabled={!hasSelectedComponent}
          data-component-dependent
        >
          <div className={styles.localGrid}>
            <label className={styles.quantityField}>
              <span>Количество доз</span>
              <BoundedIntegerInput
                name="quantity"
                min={1}
                max={99}
                value={quantity}
                onChange={(value) => onLocalChange({ quantity: value })}
              />
            </label>
          </div>

          {hasSelectedComponent && (
            <section className={styles.indicationsSection}>
              <h3 className={styles.sectionTitle}>Показания к трансфузии</h3>
              <IndicationsFields
                values={effectiveIndicationValues}
                showComponentSelector={false}
                onChange={handleIndicationsChange}
              />
            </section>
          )}

          <div className={styles.localGrid}>
            <IndividualSelectionReasonSelect
              value={individualSelectionIndications}
              onChange={(value) => onLocalChange({ individualSelectionIndications: value })}
            />
          </div>
        </fieldset>
      </div>
    </Modal>
  );
};
