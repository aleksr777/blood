import { CustomSelectField } from './custom-select-field';
import styles from './blood-group-select-field.module.css';

export const ABO_OPTIONS = ['O(I)', 'A(II)', 'B(III)', 'AB(IV)'];
export const RH_OPTIONS = ['Rh(+)', 'Rh(-)'];
export const ANTIGEN_OPTIONS = ['+', '-'];

export type BloodGroupTone = 'positive' | 'negative' | 'neutral';

export const normalizeBloodGroupRh = (value?: string) => {
  if (value === 'Rh(D)+' || value === 'Rh(+)') return 'Rh(+)';
  if (value === 'Rh(D)-' || value === 'Rh(-)') return 'Rh(-)';
  return '';
};

export const getBloodGroupTone = (rh?: string): BloodGroupTone => {
  const normalized = normalizeBloodGroupRh(rh);
  if (normalized === 'Rh(-)') return 'negative';
  if (normalized === 'Rh(+)') return 'positive';
  return 'neutral';
};

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
