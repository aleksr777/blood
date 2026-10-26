import { hasNoPregnancies } from './obstetric-history';
import { ProtocolFieldControl } from './protocol-field-control';
import type { ProtocolFieldConfig, ProtocolValues } from './protocol-types';
import styles from './recipient-history-fields.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
};

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
  return (
    <fieldset className={styles.group}>
      <legend>Акушерский анамнез</legend>
      <div className={styles.obstetricGrid}>
        {FIELDS.map((field) => {
          const disabled = noPregnancies && field.name !== 'recipientPregnanciesCount';
          return (
            <fieldset key={field.name} className={styles.obstetricField} disabled={disabled}>
              <ProtocolFieldControl
                key={String(disabled)}
                field={field}
                value={values[field.name] ?? ''}
                onChange={(name, value) => {
                  if (disabled || (field.type === 'number' && !/^\d{0,2}$/.test(value))) return;
                  onChange({ [name]: value });
                }}
              />
            </fieldset>
          );
        })}
      </div>
    </fieldset>
  );
};
