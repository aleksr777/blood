import { Choice, OtherChoice, type IndicationProps } from './indication-controls';

const PLASMA_OPTIONS = [
  ['indicationPlasmaFactorDeficiency', 'Дефицит плазменных факторов свёртывания крови'],
  ['indicationPlasmaAnticoagulantOverdose', 'Передозировка антикоагулянтов непрямого действия'],
  ['indicationPlasmaPlasmapheresis', 'Выполнение терапевтического плазмафереза'],
] as const;

export const PlasmaIndications = ({ values, onChange }: IndicationProps) => (
  <>
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
  </>
);
