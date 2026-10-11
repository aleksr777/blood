import { CustomSelectField } from './custom-select-field';
import { DONOR_ANTIGENS } from './donor-model';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-examination-fields.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
};

const SelectField = ({
  name,
  label,
  options,
  value,
  onChange,
  emptyLabel,
  emptyDisplayLabel,
  compact = false,
}: {
  name: string;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  emptyLabel?: string;
  emptyDisplayLabel?: string;
  compact?: boolean;
}) => (
  <div className={styles.selectField}>
    <div className={styles.label}>{label}</div>
    <CustomSelectField
      name={name}
      label={label}
      options={options}
      value={value}
      emptyLabel={emptyLabel}
      emptyDisplayLabel={emptyDisplayLabel}
      compact={compact}
      onChange={onChange}
    />
  </div>
);

export const DonorFields = ({ values, onChange }: Props) => (
  <div className={styles.root}>
    <div className={styles.topGrid}>
      <SelectField
        name="donorAbo"
        label="Группа крови донора AB0"
        options={['O(I)', 'A(II)', 'B(III)', 'AB(IV)']}
        value={values.donorAbo ?? ''}
        onChange={(value) => onChange({ donorAbo: value })}
      />
    </div>

    <div className={styles.groupTitle}>Антигены:</div>
    <div className={styles.antigenGrid}>
      {DONOR_ANTIGENS.map(({ name, label }) => (
        <SelectField
          key={name}
          name={name}
          label={label}
          options={['+', '-']}
          value={values[name] ?? ''}
          emptyLabel=""
          emptyDisplayLabel=""
          compact
          onChange={(value) => onChange({ [name]: value, donorAntigens: '' })}
        />
      ))}
    </div>
  </div>
);
