import { CustomSelectField } from './custom-select-field';
import { DONOR_ANTIGENS } from './donor-model';
import { INDICATION_COMPONENTS } from './indications-model';
import type { ProtocolValues } from './protocol-types';
import componentStyles from './indications-fields.module.css';
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

export const DonorFields = ({ values, onChange }: Props) => {
  const legacyComponent = INDICATION_COMPONENTS.find(
    ({ label }) => label === values.componentName,
  );
  const selectedComponent = values.componentGroup || legacyComponent?.value || '';
  const componentName =
    legacyComponent && values.componentName === legacyComponent.label ? '' : values.componentName ?? '';

  return (
    <div className={styles.root}>
      <fieldset className={componentStyles.componentGroup}>
        <legend>Компонент крови</legend>
        <div className={componentStyles.componentChoices}>
          {INDICATION_COMPONENTS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={componentStyles.componentButton}
              data-component={value}
              data-selected={selectedComponent === value}
              aria-pressed={selectedComponent === value}
              onClick={() =>
                onChange({
                  componentGroup: value,
                  indicationComponent: value,
                  ...(selectedComponent !== value ? { componentName: '' } : {}),
                })
              }
            >
              {label}
            </button>
          ))}
        </div>

        {selectedComponent && (
          <label className={componentStyles.componentNameField}>
            <span>Точное наименование компонента донорской крови</span>
            <input
              name="componentName"
              value={componentName}
              onChange={(event) =>
                onChange({
                  componentGroup: selectedComponent,
                  componentName: event.target.value,
                })
              }
            />
          </label>
        )}
      </fieldset>

      <div className={styles.topGrid}>
      <SelectField
        name="donorAbo"
        label="Группа крови AB0"
        options={['O(I)', 'A(II)', 'B(III)', 'AB(IV)']}
        value={values.donorAbo ?? ''}
        onChange={(value) => onChange({ donorAbo: value })}
      />
      <SelectField
        name="donorRh"
        label="Резус-принадлежность"
        options={['Rh(D)+', 'Rh(D)-']}
        value={values.donorRh ?? ''}
        onChange={(value) => onChange({ donorRh: value })}
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
};
