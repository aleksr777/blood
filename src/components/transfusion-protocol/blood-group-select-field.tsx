import { CustomSelectField } from './custom-select-field';
import styles from './blood-group-select-field.module.css';
import type { BloodGroupTone } from './blood-group-options';

type Props = {
  name: string;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  emptyLabel?: string;
  emptyDisplayLabel?: string;
  compact?: boolean;
  antigen?: boolean;
  tone?: BloodGroupTone;
};

export const BloodGroupSelectField = ({
  name,
  label,
  options,
  value,
  onChange,
  emptyLabel,
  emptyDisplayLabel,
  compact = false,
  antigen = false,
  tone,
}: Props) => {
  const antigenTone = value === '+' ? 'positive' : value === '-' ? 'negative' : 'neutral';
  const displayedTone = !value ? 'neutral' : antigen ? antigenTone : tone;

  return (
    <div
      className={[styles.field, antigen ? styles.antigenField : ''].filter(Boolean).join(' ')}
      data-blood-group-field={name}
      data-tone={displayedTone}
    >
      <div className={antigen ? styles.antigenLabel : styles.label}>{label}</div>
      <CustomSelectField
        name={name}
        label={label}
        options={options}
        value={value}
        emptyLabel={emptyLabel}
        emptyDisplayLabel={emptyDisplayLabel}
        compact={compact}
        tone={displayedTone}
        onChange={onChange}
      />
    </div>
  );
};
