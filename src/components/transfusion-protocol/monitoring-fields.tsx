import { ProtocolFieldControl } from './protocol-field-control';
import type { ProtocolFieldConfig, ProtocolValues } from './protocol-types';
import { getMonitoringFields, MONITORING_PERIODS } from './monitoring-model';
import styles from './monitoring-fields.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
};

export const MonitoringFields = ({ values, onChange }: Props) => {
  const changeValue = (name: string, value: string) => onChange({ [name]: value });
  const renderField = (field: ProtocolFieldConfig) => (
    <ProtocolFieldControl
      key={field.name}
      field={field}
      value={values[field.name] ?? ''}
      onChange={changeValue}
    />
  );

  return (
    <div className={styles.root}>
      {MONITORING_PERIODS.map(({ prefix, title }) => {
        const fields = getMonitoringFields(prefix);
        return (
          <fieldset key={prefix} className={styles.group}>
            <legend>{title}</legend>
            <div className={styles.fields}>
              <div className={styles.vitals}>{fields.slice(0, 3).map(renderField)}</div>
              <div className={styles.urine}>{fields.slice(3).map(renderField)}</div>
            </div>
          </fieldset>
        );
      })}
    </div>
  );
};
