import { ComponentCommonIndications } from './indication-common-fields';
import { Choice, OtherChoice, type IndicationProps } from './indication-controls';

const PLASMA_OPTIONS = [
  ['indicationPlasmaFactorDeficiency', 'Дефицит плазменных факторов свёртывания крови'],
  ['indicationPlasmaFibrinogenBleeding', 'Фибриноген менее 1,5 г/л при кровотечении'],
  ['indicationPlasmaFibrinogenLow', 'Фибриноген менее 1 г/л'],
] as const;

export const PlasmaIndications = ({ values, onChange }: IndicationProps) => (
  <>
    <ComponentCommonIndications
      values={values}
      onChange={onChange}
      bloodLossName="indicationPlasmaBloodLoss"
      bloodLossPercentName="indicationPlasmaBloodLossPercent"
      ongoingBleedingName="indicationPlasmaOngoingBleeding"
    />
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
