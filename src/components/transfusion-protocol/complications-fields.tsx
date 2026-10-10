import { ProtocolFieldControl } from './protocol-field-control';
import { COMPLICATIONS_STATUS, getComplicationsStatus } from './complications-model';
import type { ProtocolFieldConfig, ProtocolValues } from './protocol-types';
import styles from './complications-fields.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
};

const DETAIL_FIELDS: ProtocolFieldConfig[] = [
  {
    name: 'symptoms',
    label: 'Основные симптомы',
    type: 'textarea',
    wide: true,
  },
  {
    name: 'severity',
    label: 'Степень тяжести',
    type: 'select',
    options: ['Средней степени тяжести', 'Тяжёлое', 'Крайне тяжёлое'],
    wide: true,
  },
];

export const ComplicationsFields = ({ values, onChange }: Props) => {
  const status = getComplicationsStatus(values);
  const changeValue = (name: string, value: string) => onChange({ [name]: value });

  return (
    <div className={styles.root}>
      <fieldset className={styles.statusGroup}>
        <legend>Реакции и осложнения</legend>
        <div className={styles.options}>
          <label className={styles.option}>
            <input
              type="radio"
              name="complicationsStatus"
              checked={status === COMPLICATIONS_STATUS.none}
              onChange={() => onChange({ complicationsStatus: COMPLICATIONS_STATUS.none })}
            />
            <span>Не было</span>
          </label>

          <label className={styles.option}>
            <input
              type="radio"
              name="complicationsStatus"
              checked={status === COMPLICATIONS_STATUS.had}
              onChange={() => onChange({ complicationsStatus: COMPLICATIONS_STATUS.had })}
            />
            <span>Были</span>
          </label>
        </div>
      </fieldset>

      {status === COMPLICATIONS_STATUS.had && (
        <div className={styles.details}>
          {DETAIL_FIELDS.map((field) => (
            <ProtocolFieldControl
              key={field.name}
              field={field}
              value={values[field.name] ?? ''}
              onChange={changeValue}
              onValuesChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};
