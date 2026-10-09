import { ProtocolFieldControl } from './protocol-field-control';
import type { ProtocolFieldConfig, ProtocolValues } from './protocol-types';
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
  {
    key: 'polyglukin',
    title: 'Полиглюкин 33%',
    series: 'polyglukinSeries',
    expiration: 'polyglukinExpiration',
    manufacturer: 'polyglukinManufacturer',
  },
] as const;

const RESULT_FIELDS: ProtocolFieldConfig[] = [
  {
    name: 'planeTestResult',
    label: 'Проба на плоскости',
    type: 'select',
    options: ['Совместимо', 'Несовместимо'],
  },
  {
    name: 'biologicalTestResult',
    label: 'Биологическая проба',
    type: 'select',
    options: ['Совместимо', 'Несовместимо'],
  },
];

export const CompatibilityTestsFields = ({ values, onChange }: Props) => {
  const change = (name: string, value: string) => onChange({ [name]: value });

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
        {RESULT_FIELDS.map((field) => (
          <ProtocolFieldControl
            key={field.name}
            field={field}
            value={values[field.name] ?? ''}
            onChange={change}
            onValuesChange={onChange}
          />
        ))}
      </div>
    </div>
  );
};
