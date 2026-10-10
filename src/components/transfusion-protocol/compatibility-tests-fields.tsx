import { useEffect } from 'react';
import type { ProtocolValues } from './protocol-types';
import styles from './compatibility-tests-fields.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
};

const REAGENTS = [
  {
    key: 'antiA',
    title: 'Цоликлон "анти-A"',
    series: 'reagentAntiASeries',
    expiration: 'reagentAntiAExpiration',
    manufacturer: 'reagentAntiAManufacturer',
  },
  {
    key: 'antiB',
    title: 'Цоликлон "анти-B"',
    series: 'reagentAntiBSeries',
    expiration: 'reagentAntiBExpiration',
    manufacturer: 'reagentAntiBManufacturer',
  },
  {
    key: 'antiAB',
    title: 'Цоликлон "анти-AB"',
    series: 'reagentAntiABSeries',
    expiration: 'reagentAntiABExpiration',
    manufacturer: 'reagentAntiABManufacturer',
  },
  {
    key: 'antiD',
    title: 'Цоликлон "анти-D"',
    series: 'reagentAntiDSeries',
    expiration: 'reagentAntiDExpiration',
    manufacturer: 'reagentAntiDManufacturer',
  },
] as const;

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
  const change = (name: string, value: string) => onChange({ [name]: value });

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
        {REAGENTS.map((reagent) => (
          <fieldset key={reagent.key} className={styles.reagentGroup}>
            <legend>{reagent.title}</legend>
            <div className={styles.reagentGrid}>
              <label>
                <span>Серия</span>
                <input
                  name={reagent.series}
                  value={values[reagent.series] ?? ''}
                  onChange={(event) => change(reagent.series, event.target.value)}
                />
              </label>
              <label>
                <span>Годен до</span>
                <input
                  type="date"
                  name={reagent.expiration}
                  value={values[reagent.expiration] ?? ''}
                  onChange={(event) => change(reagent.expiration, event.target.value)}
                />
              </label>
              <label>
                <span>Производитель (коротко)</span>
                <input
                  name={reagent.manufacturer}
                  value={values[reagent.manufacturer] ?? ''}
                  onChange={(event) => change(reagent.manufacturer, event.target.value)}
                />
              </label>
            </div>
          </fieldset>
        ))}
      </div>

      <div className={styles.results}>
        {RADIO_GROUPS.map((group) => {
          const selected =
            values[group.name] || DEFAULT_RESULTS[group.name as keyof typeof DEFAULT_RESULTS];

          return (
            <fieldset key={group.name} className={styles.resultGroup}>
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
                    <span>{option}</span>
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
