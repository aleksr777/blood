import { PLATELET_INDICATION_OPTIONS } from '../../domain/platelet-indications';
import { Choice, OtherChoice, type IndicationProps } from './indication-controls';

export const PlateletIndications = ({ values, onChange }: IndicationProps) => (
  <>
    {PLATELET_INDICATION_OPTIONS.map(([name, label]) => (
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
      checked={values.indicationPlateletOther === '1'}
      text={values.indicationPlateletOtherText ?? ''}
      name="indicationPlateletOther"
      label="Другие показания"
      onChange={onChange}
    />
  </>
);
