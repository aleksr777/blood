import { RadioOption } from '../radio-option/radio-option';
import { FormTextarea } from '../form-input/form-input';
import {
  ABO_OPTIONS,
  ANTIGEN_OPTIONS,
  getBloodGroupTone,
  normalizeBloodGroupRh,
  RH_OPTIONS,
} from './blood-group-options';
import { BloodGroupSelectField } from './blood-group-select-field';
import { ANTIBODY_STATUS, RECIPIENT_ANTIGENS } from './recipient-examination-model';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-examination-fields.module.css';
type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
  showAlloimmuneAntibodies?: boolean;
};
export const RecipientExaminationFields = ({
  values,
  onChange,
  showAlloimmuneAntibodies = true,
}: Props) => {
  const recipientRh = normalizeBloodGroupRh(values.recipientRh);
  const bloodGroupTone = getBloodGroupTone(recipientRh);

  const setStatus = (status: string) =>
    onChange({
      alloimmuneAntibodyStatus: status,
      ...(!status ? { alloimmuneAntibodies: '' } : {}),
    });
  return (
    <div className={styles.root}>
      <div className={styles.topGrid}>
        <BloodGroupSelectField
          name="recipientAbo"
          label="Группа крови AB0"
          options={ABO_OPTIONS}
          value={values.recipientAbo ?? ''}
          tone={bloodGroupTone}
          onChange={(value) => onChange({ recipientAbo: value })}
        />
        <BloodGroupSelectField
          name="recipientRh"
          label="Резус-принадлежность"
          options={RH_OPTIONS}
          value={recipientRh}
          tone={bloodGroupTone}
          onChange={(value) => onChange({ recipientRh: value })}
        />
      </div>

      <div className={styles.groupTitle}>Антигены:</div>
      <div className={styles.antigenGrid}>
        {RECIPIENT_ANTIGENS.map(({ name, label }) => (
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
            onChange={(value) => onChange({ [name]: value, recipientAntigens: '' })}
          />
        ))}
      </div>

      {showAlloimmuneAntibodies && (
        <fieldset className={styles.antibodies}>
          <legend>Аллоиммунные антитела</legend>
          <div className={styles.radioGroup}>
            <RadioOption
              className={styles.radio}
              name="alloimmuneAntibodyStatus"
              checked={values.alloimmuneAntibodyStatus === ANTIBODY_STATUS.notFound}
              onChange={(checked) => setStatus(checked ? ANTIBODY_STATUS.notFound : '')}
            >
              не найдены
            </RadioOption>
            <RadioOption
              className={styles.radio}
              name="alloimmuneAntibodyStatus"
              checked={values.alloimmuneAntibodyStatus === ANTIBODY_STATUS.found}
              onChange={(checked) => setStatus(checked ? ANTIBODY_STATUS.found : '')}
            >
              найдены
            </RadioOption>
          </div>
          {values.alloimmuneAntibodyStatus === ANTIBODY_STATUS.found && (
            <label className={styles.description}>
              <span>Описание найденных антител</span>
              <FormTextarea
                rows={3}
                value={values.alloimmuneAntibodyDescription ?? ''}
                onChange={(event) =>
                  onChange({ alloimmuneAntibodyDescription: event.target.value })
                }
              />
            </label>
          )}
        </fieldset>
      )}
    </div>
  );
};
