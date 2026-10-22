import { ProtocolFieldControl } from './protocol-field-control';
import type { ProtocolFieldConfig, ProtocolValues } from './protocol-types';
import { getDiuresisInputValue, getMonitoringFields, MONITORING_PERIODS } from './monitoring-model';
import styles from './monitoring-fields.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
};

export const MonitoringFields = ({ values, onChange }: Props) => {
  const changeValue = (name: string, value: string) => onChange({ [name]: value });
  const renderField = (field: ProtocolFieldConfig) => {
    const value = values[field.name] ?? '';
    if (field.name.endsWith('Urine')) {
      const numericValue = getDiuresisInputValue(value);
      return (
        <label key={field.name}>
          <span>{field.label}</span>
          <input
            name={field.name}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={numericValue}
            onChange={(event) => {
              const next = event.target.value;
              if (!next || (Number.isFinite(Number(next)) && Number(next) >= 0)) {
                changeValue(field.name, next);
              }
            }}
          />
          {value && !numericValue && (
            <small className={styles.legacyValue}>Ранее введено: {value}</small>
          )}
        </label>
      );
    }
    return (
      <ProtocolFieldControl key={field.name} field={field} value={value} onChange={changeValue} />
    );
  };

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
