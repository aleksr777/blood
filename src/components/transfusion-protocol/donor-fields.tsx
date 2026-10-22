import {
  ABO_OPTIONS,
  ANTIGEN_OPTIONS,
  BloodGroupSelectField,
  getBloodGroupTone,
  normalizeBloodGroupRh,
  RH_OPTIONS,
} from './blood-group-select-field';
import { DONOR_ANTIGENS } from './donor-model';
import { inferBloodComponentGroup } from '../../domain/blood-components';
import { BloodComponentSelector } from '../blood-component-selector/blood-component-selector';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-examination-fields.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
};

export const DonorFields = ({ values, onChange }: Props) => {
  const selectedComponent =
    values.componentGroup ||
    values.indicationComponent ||
    inferBloodComponentGroup(values.componentName);
  const donorRh = normalizeBloodGroupRh(values.donorRh);
  const bloodGroupTone = getBloodGroupTone(donorRh);

  return (
    <div className={styles.root}>
      <BloodComponentSelector
        group={selectedComponent}
        name={values.componentName ?? ''}
        onChange={({ group, name }) =>
          onChange({ componentGroup: group, indicationComponent: group, componentName: name })
        }
      />

      <div className={styles.topGrid}>
        <BloodGroupSelectField
          name="donorAbo"
          label="Группа крови AB0"
          options={ABO_OPTIONS}
          value={values.donorAbo ?? ''}
          tone={bloodGroupTone}
          onChange={(value) => onChange({ donorAbo: value })}
        />
        <BloodGroupSelectField
          name="donorRh"
          label="Резус-принадлежность"
          options={RH_OPTIONS}
          value={donorRh}
          tone={bloodGroupTone}
          onChange={(value) => onChange({ donorRh: value })}
        />
      </div>

      <div className={styles.groupTitle}>Антигены:</div>
      <div className={styles.antigenGrid}>
        {DONOR_ANTIGENS.map(({ name, label }) => (
          <BloodGroupSelectField
            key={name}
            name={name}
            label={label}
            options={ANTIGEN_OPTIONS}
            value={values[name] ?? ''}
            emptyLabel="Не выбрано"
            emptyDisplayLabel=""
            compact
            antigen
            onChange={(value) => onChange({ [name]: value, donorAntigens: '' })}
          />
        ))}
      </div>
    </div>
  );
};
