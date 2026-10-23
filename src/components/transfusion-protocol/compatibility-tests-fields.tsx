import { useEffect } from 'react';
import { WarningNotice } from '../warning-notice/warning-notice';
import { getCompatibilityDangerWarning } from './compatibility-validation';
import { getReagentExpirationWarning, REAGENTS } from './reagent-defaults';
import { updateReagentManufacturerFields } from './reagent-manufacturer-values';
import { ProtocolFieldControl } from './protocol-field-control';
import type { ProtocolValues } from './protocol-types';
import styles from './compatibility-tests-fields.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
};

const DEFAULT_RESULTS = {
  confirmedRecipientAboResult: 'Подтверждено',
  confirmedDonorAboResult: 'Подтверждено',
  planeTestResult: 'Совместимо',
  biologicalTestResult: 'Совместимо',
} as const;

const RADIO_GROUPS = [
  {
    name: 'confirmedRecipientAboResult',
    label: 'Подтверждена группа крови реципиента',
    options: ['Подтверждено', 'Не подтверждено'],
  },
  {
    name: 'confirmedDonorAboResult',
    label: 'Подтверждена группа крови донора',
    options: ['Подтверждено', 'Не подтверждено'],
  },
  {
    name: 'planeTestResult',
    label: 'Проба на плоскости',
    options: ['Совместимо', 'Несовместимо'],
  },
  {
    name: 'biologicalTestResult',
    label: 'Биологическая проба',
    options: ['Совместимо', 'Несовместимо'],
  },
] as const;

export const CompatibilityTestsFields = ({ values, onChange }: Props) => {
  const change = (name: string, value: string, previousOptionValue?: string) => {
    const sharedOptionEdit =
      previousOptionValue !== undefined &&
      REAGENTS.some(({ manufacturer }) => manufacturer === name);
    onChange(
      sharedOptionEdit
        ? updateReagentManufacturerFields(values, previousOptionValue, value)
        : { [name]: value },
    );
  };
  const compatibilityDangerWarning = getCompatibilityDangerWarning(values);
  const showDonorAboConfirmation = values.componentGroup === 'erythrocytes';

  useEffect(() => {
    const missingDefaults = Object.fromEntries(
      Object.entries(DEFAULT_RESULTS).filter(([name]) => !values[name]),
    );

    if (Object.keys(missingDefaults).length > 0) {
      onChange(missingDefaults);
    }
  }, [onChange, values]);

  return (
    <div className={styles.root}>
      <div className={styles.reagentList}>
        {REAGENTS.map((reagent) => {
          const expirationWarning = getReagentExpirationWarning(
            reagent.title,
            values[reagent.expiration],
          );

          return (
            <fieldset key={reagent.series} className={styles.reagentGroup}>
              <legend>{reagent.title}</legend>
              <div className={styles.reagentGrid}>
                <ProtocolFieldControl
                  field={{ name: reagent.series, label: 'Серия' }}
                  value={values[reagent.series] ?? ''}
                  onChange={change}
                />
                <label>
                  <span>Годен до</span>
                  <input
                    type="date"
                    name={reagent.expiration}
                    value={values[reagent.expiration] ?? ''}
                    onChange={(event) => change(reagent.expiration, event.target.value)}
                  />
                </label>
                <ProtocolFieldControl
                  field={{ name: reagent.manufacturer, label: 'Производитель (коротко)' }}
                  value={values[reagent.manufacturer] ?? ''}
                  onChange={change}
                />
              </div>

              <WarningNotice
                className={styles.reagentWarning}
                message={expirationWarning ? `Внимание: ${expirationWarning}.` : ''}
              />
            </fieldset>
          );
        })}
      </div>

      <WarningNotice message={compatibilityDangerWarning} danger />

      <div className={styles.results}>
        {RADIO_GROUPS.map((group) => {
          const selected =
            values[group.name] || DEFAULT_RESULTS[group.name as keyof typeof DEFAULT_RESULTS];
          const disabled = group.name === 'confirmedDonorAboResult' && !showDonorAboConfirmation;

          return (
            <fieldset
              key={group.name}
              className={styles.resultGroup}
              disabled={disabled}
              aria-disabled={disabled}
            >
              <legend>{group.label}</legend>
              <div className={styles.options}>
                {group.options.map((option) => (
                  <label key={option} className={styles.option}>
                    <input
                      type="radio"
                      name={group.name}
                      checked={selected === option}
                      onChange={() => change(group.name, option)}
                    />
                    <span
                      className={
                        option === 'Не подтверждено' && selected === option
                          ? styles.dangerOptionText
                          : undefined
                      }
                    >
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
};
