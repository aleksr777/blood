import { useId } from 'react';
import { BloodComponentSelector } from '../blood-component-selector/blood-component-selector';
import { BoundedIntegerInput } from '../bounded-integer-input/bounded-integer-input';
import { FormInput } from '../form-input/form-input';
import Modal from '../modal/modal';
import { Choice } from '../transfusion-protocol/indication-controls';
import { inferBloodComponentGroup } from '../../domain/blood-components';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import {
  COMPONENT_CODES,
  INDIVIDUAL_SELECTION_INDICATIONS,
  TRANSFUSION_INDICATIONS,
  indicationOptionsForComponent,
} from './component-request-447n';
import styles from './component-request-details-modal.module.css';

type Props = {
  values: {
    requiredComponent: string;
    componentCode: string;
    quantity: string;
    estimatedVolumeMl: string;
    transfusionIndicationCode: string;
    individualSelectionRequired: string;
    individualSelectionCode: string;
    indicationValues: ProtocolValues;
  };
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
  const codeListId = useId();
  const group =
    values.indicationValues.componentGroup ||
    values.indicationValues.indicationComponent ||
    inferBloodComponentGroup(values.requiredComponent);
  const indications = indicationOptionsForComponent(values.componentCode, group);
  const selectedIndication = TRANSFUSION_INDICATIONS.find(
    ({ code }) => code === values.transfusionIndicationCode,
  );

  const changeCode = (code: string) => {
    const options = indicationOptionsForComponent(code, group);
    onChange({
      componentCode: code.toUpperCase(),
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
          onChange={({ group: nextGroup, name }) => {
            onIndicationsChange({ componentGroup: nextGroup, indicationComponent: nextGroup });
            onChange({
              requiredComponent: name,
              ...(nextGroup !== group ? { componentCode: '', transfusionIndicationCode: '' } : {}),
            });
          }}
        />

        <div className={styles.grid}>
          <label className={styles.wide}>
            <span>Идентификационный код компонента (графа 6)</span>
            <FormInput
              name="componentCode"
              list={codeListId}
              value={values.componentCode}
              onChange={(event) => changeCode(event.target.value)}
              placeholder="Например, ЭВ-Л или СЗП"
            />
            <datalist id={codeListId}>
              {Object.values(COMPONENT_CODES)
                .flat()
                .map((code) => (
                  <option key={code} value={code} />
                ))}
            </datalist>
          </label>
          <label>
            <span>Количество, единиц (графа 7)</span>
            <BoundedIntegerInput
              name="quantity"
              min={1}
              max={99}
              value={values.quantity}
              onChange={(quantity) => onChange({ quantity })}
            />
          </label>
          <label>
            <span>Ориентировочный объём плазмы, мл (при необходимости)</span>
            <BoundedIntegerInput
              name="estimatedVolumeMl"
              min={1}
              max={9999}
              value={values.estimatedVolumeMl}
              onChange={(estimatedVolumeMl) => onChange({ estimatedVolumeMl })}
            />
          </label>
          <label className={styles.wide}>
            <span>Код показания к трансфузии (графа 8)</span>
            <select
              name="transfusionIndicationCode"
              value={values.transfusionIndicationCode}
              onChange={(event) => onChange({ transfusionIndicationCode: event.target.value })}
            >
              <option value="">Выберите показание</option>
              {selectedIndication && !indications.includes(selectedIndication) && (
                <option value={selectedIndication.code}>
                  {selectedIndication.code} — {selectedIndication.label}
                </option>
              )}
              {indications.map(({ code, label }) => (
                <option key={code} value={code}>
                  {code} — {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className={styles.selection}>
          <legend>Необходимость индивидуального подбора (графа 9)</legend>
          <div className={styles.options}>
            <Choice
              type="radio"
              name="request447nIndividualSelection"
              checked={values.individualSelectionRequired === 'yes'}
              onChange={() => onChange({ individualSelectionRequired: 'yes' })}
            >
              Да
            </Choice>
            <Choice
              type="radio"
              name="request447nIndividualSelection"
              checked={values.individualSelectionRequired === 'no'}
              onChange={() =>
                onChange({ individualSelectionRequired: 'no', individualSelectionCode: '' })
              }
            >
              Нет
            </Choice>
          </div>
          {values.individualSelectionRequired === 'yes' && (
            <label className={styles.selectionReason}>
              <span>Код показания для индивидуального подбора (графа 10)</span>
              <select
                name="individualSelectionCode"
                value={values.individualSelectionCode}
                onChange={(event) => onChange({ individualSelectionCode: event.target.value })}
              >
                <option value="">Выберите показание</option>
                {INDIVIDUAL_SELECTION_INDICATIONS.map(({ code, label }) => (
                  <option key={code} value={code}>
                    {code} — {label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </fieldset>
        <p className={styles.note}>
          Коды показаний приведены по приложению № 18 к приказу № 447н. Выбор кода должен
          соответствовать клиническим данным реципиента.
        </p>
      </div>
    </Modal>
  );
};
