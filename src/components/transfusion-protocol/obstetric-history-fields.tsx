import { hasNoPregnancies, isObstetricHistoryUnknown } from './obstetric-history';
import { ProtocolFieldControl } from './protocol-field-control';
import type { ProtocolFieldConfig, ProtocolValues } from './protocol-types';
import styles from './recipient-history-fields.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
};

const DEPENDENT_COUNTS = ['recipientBirthsCount', 'recipientSpontaneousAbortionsCount'];

const FIELDS: ProtocolFieldConfig[] = [
  {
    name: 'recipientPregnanciesCount',
    label: 'Количество беременностей',
    type: 'number',
    step: '1',
    min: '0',
    max: '99',
  },
  {
    name: 'recipientBirthsCount',
    label: 'Количество родов',
    type: 'number',
    step: '1',
    min: '0',
    max: '99',
  },
  {
    name: 'recipientSpontaneousAbortionsCount',
    label: 'Самопроизвольные аборты в анамнезе',
    type: 'number',
    step: '1',
    min: '0',
    max: '99',
  },
  {
    name: 'recipientHemolyticDiseaseNewbornHistory',
    label: 'Гемолитическая болезнь новорождённого в анамнезе',
    type: 'select',
    options: ['Нет', 'Да'],
  },
];

export const ObstetricHistoryFields = ({ values, onChange }: Props) => {
  const noPregnancies = hasNoPregnancies(values);
  const unknown = isObstetricHistoryUnknown(values);
  const pregnancies = values.recipientPregnanciesCount?.trim() ?? '';
  const dependentMaximum = /^\d+$/.test(pregnancies) ? Math.min(Number(pregnancies), 99) : 99;
  return (
    <fieldset className={styles.group}>
      <legend>Акушерский анамнез</legend>
      <div className={styles.options}>
        {[
          ['known', 'Известен'],
          ['unknown', 'Не известен'],
        ].map(([status, label]) => (
          <label key={status} className={styles.option}>
            <input
              type="radio"
              name="recipientObstetricHistoryStatus"
              value={status}
              checked={unknown ? status === 'unknown' : status === 'known'}
              onChange={() => onChange({ recipientObstetricHistoryStatus: status })}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <div className={styles.obstetricGrid}>
        {FIELDS.map((field) => {
          const disabled = unknown || (noPregnancies && field.name !== 'recipientPregnanciesCount');
          const maximum = field.name === 'recipientPregnanciesCount' ? 99 : dependentMaximum;
          return (
            <fieldset key={field.name} className={styles.obstetricField} disabled={disabled}>
              <ProtocolFieldControl
                key={String(disabled)}
                field={field.type === 'number' ? { ...field, max: String(maximum) } : field}
                value={values[field.name] ?? ''}
                onChange={(name, value) => {
                  if (
                    disabled ||
                    (field.type === 'number' &&
                      (!/^\d{0,2}$/.test(value) || Number(value) > maximum))
                  )
                    return;
                  const changes = { [name]: value };
                  if (name === 'recipientPregnanciesCount' && value !== '') {
                    for (const dependent of DEPENDENT_COUNTS) {
                      if (Number(values[dependent]) > Number(value)) changes[dependent] = '';
                    }
                  }
                  onChange(changes);
                }}
              />
            </fieldset>
          );
        })}
      </div>
    </fieldset>
  );
};
