import { DepartmentField } from './department-field';
import { getSavedOptionCategory } from './saved-field-config';
import { SavedOptionsField } from './saved-options-field';
import styles from './protocol-editor.module.css';
import type { ProtocolFieldConfig } from './protocol-types';

type Props = {
  field: ProtocolFieldConfig;
  value: string;
  onChange: (name: string, value: string) => void;
};

const BasicControl = ({ field, value, onChange }: Props) => {
  if (field.type === 'textarea') {
    return (
      <textarea
        name={field.name}
        value={value}
        rows={4}
        onChange={(event) => onChange(field.name, event.target.value)}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select
        name={field.name}
        value={value}
        onChange={(event) => onChange(field.name, event.target.value)}
      >
        <option value="">Не выбрано</option>
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      name={field.name}
      type={field.type ?? 'text'}
      step={field.step}
      value={value}
      onChange={(event) => onChange(field.name, event.target.value)}
    />
  );
};

export const ProtocolFieldControl = ({ field, value, onChange }: Props) => {
  const className = field.wide ? styles.wide : undefined;
  const change = (nextValue: string) => onChange(field.name, nextValue);

  if (field.name === 'department') {
    return (
      <div className={className}>
        <div className={styles.fieldLabel}>{field.label}</div>
        <DepartmentField value={value} onChange={change} />
      </div>
    );
  }

  const category = getSavedOptionCategory(field.name);
  if (category) {
    return (
      <div className={className}>
        <div className={styles.fieldLabel}>{field.label}</div>
        <SavedOptionsField
          name={field.name}
          label={field.label}
          category={category}
          value={value}
          onChange={change}
        />
      </div>
    );
  }

  return (
    <label className={className}>
      <span>{field.label}</span>
      <BasicControl field={field} value={value} onChange={onChange} />
    </label>
  );
};
