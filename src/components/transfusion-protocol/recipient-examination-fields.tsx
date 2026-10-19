import { CustomSelectField } from './custom-select-field';
import { ANTIBODY_STATUS, RECIPIENT_ANTIGENS } from './recipient-examination-model';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-examination-fields.module.css';
type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
  showAlloimmuneAntibodies?: boolean;
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
  tone,
}: {
  name: string;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  emptyLabel?: string;
  emptyDisplayLabel?: string;
  compact?: boolean;
  tone?: 'positive' | 'negative';
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
      tone={tone}
      onChange={onChange}
    />
  </div>
);
const normalizeRh = (value?: string) => {
  if (value === 'Rh(D)+' || value === 'Rh(+)') return 'Rh(+)';
  if (value === 'Rh(D)-' || value === 'Rh(-)') return 'Rh(-)';
  return '';
};

export const RecipientExaminationFields = ({
  values,
  onChange,
  showAlloimmuneAntibodies = true,
}: Props) => {
  const recipientRh = normalizeRh(values.recipientRh);
  const bloodGroupTone =
    recipientRh === 'Rh(-)' ? 'negative' : recipientRh === 'Rh(+)' ? 'positive' : undefined;

  const setStatus = (status: string) => onChange({
    alloimmuneAntibodyStatus: status,
      alloimmuneAntibodies: '',
      ...(status === ANTIBODY_STATUS.notFound
        ? { alloimmuneAntibodyDescription: '' }
        : {}),
    });
  return (
    <div className={styles.root}>
      <div className={styles.topGrid}>
        <SelectField
          name="recipientAbo"
          label="Группа крови AB0"
          options={['O(I)', 'A(II)', 'B(III)', 'AB(IV)']}
          value={values.recipientAbo ?? ''}
          tone={bloodGroupTone}
          onChange={(value) => onChange({ recipientAbo: value })}
        />
        <SelectField
          name="recipientRh"
          label="Резус-принадлежность"
          options={['Rh(+)', 'Rh(-)']}
          value={recipientRh}
          tone={bloodGroupTone}
          onChange={(value) => onChange({ recipientRh: value })}
        />
      </div>

      <div className={styles.groupTitle}>Антигены:</div>
      <div className={styles.antigenGrid}>
        {RECIPIENT_ANTIGENS.map(({ name, label }) => (
          <SelectField
            key={name}
            name={name}
            label={label}
            options={['+', '-']}
            value={values[name] ?? ''}
            emptyLabel=""
            emptyDisplayLabel=""
            compact
            onChange={(value) => onChange({ [name]: value, recipientAntigens: '' })}
          />
        ))}
      </div>

      {showAlloimmuneAntibodies && (
        <fieldset className={styles.antibodies}>
          <legend>Аллоиммунные антитела</legend>
          <div className={styles.radioGroup}>
            <label className={styles.radio}>
              <input
                type="radio"
                name="alloimmuneAntibodyStatus"
                checked={values.alloimmuneAntibodyStatus === ANTIBODY_STATUS.notFound}
                onChange={() => setStatus(ANTIBODY_STATUS.notFound)}
              />
              <span>не найдены</span>
            </label>
            <label className={styles.radio}>
              <input
                type="radio"
                name="alloimmuneAntibodyStatus"
                checked={values.alloimmuneAntibodyStatus === ANTIBODY_STATUS.found}
                onChange={() => setStatus(ANTIBODY_STATUS.found)}
              />
              <span>найдены</span>
            </label>
          </div>
          {values.alloimmuneAntibodyStatus === ANTIBODY_STATUS.found && (
            <label className={styles.description}>
              <span>Описание найденных антител</span>
              <textarea
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
