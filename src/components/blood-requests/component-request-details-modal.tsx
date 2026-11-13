import { BloodComponentSelector } from '../blood-component-selector/blood-component-selector';
import Modal from '../modal/modal';
import { inferBloodComponentGroup } from '../../domain/blood-components';
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
  const group =
    values.indicationValues.componentGroup ||
    values.indicationValues.indicationComponent ||
    inferBloodComponentGroup(values.requiredComponent);
  const catalogOptions = componentCatalogForGroup(group);
  const selectedCode = catalogOptions.some(({ code }) => code === values.componentCode)
    ? values.componentCode
    : '';
  const indications = indicationOptionsForComponent(values.componentCode, group);
  const selectedIndication = TRANSFUSION_INDICATIONS.find(
    ({ code }) => code === values.transfusionIndicationCode,
  );

  const selectComponent = (code: string) => {
    const component = catalogOptions.find((option) => option.code === code);
    const options = indicationOptionsForComponent(component?.code || '', group);
    onChange({
      componentCode: component?.code || '',
      requiredComponent: component?.name || '',
      ...(values.transfusionIndicationCode &&
      !options.some((item) => item.code === values.transfusionIndicationCode)
        ? { transfusionIndicationCode: '' }
        : {}),
    });
  };

  return (
    <Modal
      title="Компонент крови и показания (приложение № 17)"
      onClose={onClose}
      className={styles.modal}
    >
      <div className={styles.root}>
        <BloodComponentSelector
          group={group}
          name={values.requiredComponent}
          inputName="requiredComponent"
          catalogOptions={catalogOptions}
          selectedCode={selectedCode}
          onCodeChange={selectComponent}
          onChange={({ group: nextGroup, name }) => {
            onIndicationsChange({ componentGroup: nextGroup, indicationComponent: nextGroup });
            onChange({
              requiredComponent: name,
              ...(nextGroup !== group ? { componentCode: '', transfusionIndicationCode: '' } : {}),
            });
          }}
        />

        <ComponentRequestQuantityFields
          values={values}
          indications={indications}
          selectedIndication={selectedIndication}
          onChange={onChange}
        />
        <ComponentRequestIndividualSelectionFields values={values} onChange={onChange} />
        <p className={styles.note}>
          Коды показаний приведены по приложению № 18 к приказу № 447н. Выбор кода должен
          соответствовать клиническим данным реципиента.
        </p>
      </div>
    </Modal>
  );
};
