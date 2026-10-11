import { ProtocolFieldControl } from './protocol-field-control';
import type { ProtocolFieldConfig, ProtocolValues } from './protocol-types';
import styles from './monitoring-fields.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
};

const GROUPS: Array<{
  title: string;
  fields: ProtocolFieldConfig[];
}> = [
  {
    title: 'Перед началом переливания',
    fields: [
      { name: 'beforeBp', label: 'АД, мм рт. ст.' },
      { name: 'beforePulse', label: 'Частота пульса, уд/мин', type: 'number' },
      { name: 'beforeTemperature', label: 'Температура, °C', type: 'number', step: '0.1' },
      { name: 'beforeUrine', label: 'Диурез, цвет мочи' },
    ],
  },
  {
    title: 'Через 1 час после переливания',
    fields: [
      { name: 'hour1Bp', label: 'АД, мм рт. ст.' },
      { name: 'hour1Pulse', label: 'Частота пульса, уд/мин', type: 'number' },
      { name: 'hour1Temperature', label: 'Температура, °C', type: 'number', step: '0.1' },
      { name: 'hour1Urine', label: 'Диурез, цвет мочи' },
    ],
  },
  {
    title: 'Через 2 часа после переливания',
    fields: [
      { name: 'hour2Bp', label: 'АД, мм рт. ст.' },
      { name: 'hour2Pulse', label: 'Частота пульса, уд/мин', type: 'number' },
      { name: 'hour2Temperature', label: 'Температура, °C', type: 'number', step: '0.1' },
      { name: 'hour2Urine', label: 'Диурез, цвет мочи' },
    ],
  },
];

export const MonitoringFields = ({ values, onChange }: Props) => {
  const changeValue = (name: string, value: string) => onChange({ [name]: value });

  return (
    <div className={styles.root}>
      {GROUPS.map((group) => (
        <fieldset key={group.title} className={styles.group}>
          <legend>{group.title}</legend>
          <div className={styles.fields}>
            {group.fields.map((field) => (
              <ProtocolFieldControl
                key={field.name}
                field={field}
                value={values[field.name] ?? ''}
                onChange={changeValue}
                onValuesChange={onChange}
              />
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
};
