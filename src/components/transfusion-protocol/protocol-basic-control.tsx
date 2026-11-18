import { FormInput, FormTextarea } from '../form-input/form-input';
import { BoundedNumberInput } from '../bounded-number-input/bounded-number-input';
import type { ProtocolFieldConfig } from './protocol-types';

type Props = {
  field: ProtocolFieldConfig;
  value: string;
  onChange: (name: string, value: string) => void;
};

export const ProtocolBasicControl = ({ field, value, onChange }: Props) => {
  if (
    field.type === 'number' &&
    field.min !== undefined &&
    Number(field.min) >= 0 &&
    field.max !== undefined
  ) {
    return (
      <BoundedNumberInput
        name={field.name}
        value={value}
        min={Number(field.min)}
        max={Number(field.max)}
        step={field.step}
        readOnly={field.readOnly}
        onChange={(next) => onChange(field.name, next)}
      />
    );
  }
  if (field.type === 'textarea') {
    return (
      <FormTextarea
        name={field.name}
        value={value}
        rows={4}
        onChange={(event) => onChange(field.name, event.target.value)}
      />
    );
  }

  return (
    <FormInput
      name={field.name}
      type={field.type ?? 'text'}
      step={field.step}
      min={field.min}
      max={field.max}
      value={value}
      readOnly={field.readOnly}
      onChange={(event) => onChange(field.name, event.target.value)}
    />
  );
};
