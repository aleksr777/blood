import { Choice, OtherChoice, type IndicationProps } from './indication-controls';
import styles from './indications-fields.module.css';

const PLASMA_OPTIONS = [
  ['indicationPlasmaFactorDeficiency', 'Дефицит плазменных факторов свёртывания крови'],
  ['indicationPlasmaAnticoagulantOverdose', 'Передозировка антикоагулянтов непрямого действия'],
  ['indicationPlasmaPlasmapheresis', 'Выполнение терапевтического плазмафереза'],
] as const;

export const PlasmaIndications = ({ values, onChange }: IndicationProps) => (
  <fieldset className={styles.group}>
    <legend>Для плазмы и криопреципитата</legend>
    <div className={styles.choiceGrid}>
      {PLASMA_OPTIONS.map(([name, label]) => (
        <Choice
          key={name}
          type="checkbox"
          name={name}
          checked={values[name] === '1'}
          onChange={() => onChange({ [name]: values[name] === '1' ? '' : '1' })}
        >
          {label}
        </Choice>
      ))}
      <OtherChoice
        checked={values.indicationPlasmaOther === '1'}
        text={values.indicationPlasmaOtherText ?? ''}
        name="indicationPlasmaOther"
        label="Другие показания"
        onChange={onChange}
      />
    </div>
  </fieldset>
);
