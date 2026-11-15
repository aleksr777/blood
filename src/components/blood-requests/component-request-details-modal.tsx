import { BloodComponentSelector } from '../blood-component-selector/blood-component-selector';
import Modal from '../modal/modal';
import { BLOOD_COMPONENTS, selectedBloodComponentGroup } from '../../domain/blood-components';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import type { ComponentRequestDetailsValues } from './component-request-details-types';
import { ComponentRequestQuantityFields } from './component-request-quantity-fields';
import { ComponentRequestIndividualSelectionFields } from './component-request-selection-fields';
import { componentCatalogForGroup } from './component-request-catalog';
import { TRANSFUSION_INDICATIONS, indicationOptionsForComponent } from './component-request-447n';
import styles from './component-request-details-modal.module.css';

type Props = {
  values: ComponentRequestDetailsValues;
  onChange: (values: Record<string, string>) => void;
  onIndicationsChange: (values: ProtocolValues) => void;
  onClose: () => void;
};

export const ComponentRequestDetailsModal = ({
  values,
  onChange,
  onIndicationsChange,
  onClose,
}: Props) => {
  const group = selectedBloodComponentGroup(values.indicationValues, values.requiredComponent);
  const hasSelectedComponent = BLOOD_COMPONENTS.some(({ value }) => value === group);
  const catalogOptions = componentCatalogForGroup(group);
  // Keep older saved requests readable even when a code is no longer selectable.
  const selectedCode = values.componentCode;
  const indications = indicationOptionsForComponent(values.componentCode, group);
  const selectedIndication = TRANSFUSION_INDICATIONS.find(
    ({ code }) => code === values.transfusionIndicationCode,
  );

  const selectComponent = ({ code, name }: { code: string; name: string }) => {
    const options = indicationOptionsForComponent(code, group);
    onChange({
      componentCode: code,
      requiredComponent: name,
      ...(values.transfusionIndicationCode &&
      !options.some((item) => item.code === values.transfusionIndicationCode)
        ? { transfusionIndicationCode: '' }
        : {}),
    });
  };

  return (
    <Modal title="Компонент крови и показания" onClose={onClose} className={styles.modal}>
      <div className={styles.root}>
        <BloodComponentSelector
          group={group}
          lastSelectedGroup={values.indicationValues.lastSelectedComponentGroup}
          name={values.requiredComponent}
          inputName="requiredComponent"
          catalogOptions={catalogOptions}
          selectedCode={selectedCode}
          onCodedChange={selectComponent}
          onChange={({ group: nextGroup, name }) => {
            const previousGroup = group || values.indicationValues.lastSelectedComponentGroup;
            const switched = Boolean(nextGroup && previousGroup && nextGroup !== previousGroup);
            onIndicationsChange({
              componentGroup: nextGroup,
              indicationComponent: nextGroup,
              lastSelectedComponentGroup: nextGroup || previousGroup,
            });
            onChange({
              requiredComponent: switched ? '' : name,
              ...(switched ? { componentCode: '', transfusionIndicationCode: '' } : {}),
            });
          }}
        />

        <fieldset
          className={styles.dependentFields}
          disabled={!hasSelectedComponent}
          data-component-dependent
        >
          <ComponentRequestQuantityFields
            values={values}
            indications={indications}
            selectedIndication={selectedIndication}
            onChange={onChange}
          />
          <ComponentRequestIndividualSelectionFields values={values} onChange={onChange} />
        </fieldset>
        <p className={styles.note}>
          Коды показаний приведены по приложению № 18 к приказу № 447н. Выбор кода должен
          соответствовать клиническим данным реципиента.
        </p>
      </div>
    </Modal>
  );
};
