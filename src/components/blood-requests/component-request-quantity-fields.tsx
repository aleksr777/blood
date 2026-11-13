import { BoundedIntegerInput } from '../bounded-integer-input/bounded-integer-input';
import { indicationOptionsForComponent, TRANSFUSION_INDICATIONS } from './component-request-447n';
import type { ComponentRequestDetailsValues } from './component-request-details-types';
import styles from './component-request-details-modal.module.css';

type Props = {
  values: ComponentRequestDetailsValues;
  indications: ReturnType<typeof indicationOptionsForComponent>;
  selectedIndication: (typeof TRANSFUSION_INDICATIONS)[number] | undefined;
  onChange: (values: Record<string, string>) => void;
};

export const ComponentRequestQuantityFields = ({
  values,
  indications,
  selectedIndication,
  onChange,
}: Props) => (
    <div className={styles.grid}>
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
);
