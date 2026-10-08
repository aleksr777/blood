import { Choice, OtherChoice, type IndicationProps } from './indication-controls';

export const PlateletIndications = ({ values, onChange }: IndicationProps) => (
  <>
    <Choice
      type="radio"
      name="indicationPlateletReason"
      checked={values.indicationPlateletReason === 'hemorrhagic'}
      onChange={() => onChange({ indicationPlateletReason: 'hemorrhagic' })}
    >
      Тромбоцитопения, геморрагический синдром
    </Choice>
    <Choice
      type="radio"
      name="indicationPlateletReason"
      checked={values.indicationPlateletReason === 'high-risk'}
      onChange={() => onChange({ indicationPlateletReason: 'high-risk' })}
    >
      Тромбоцитопения, высокий риск кровотечения
    </Choice>
    <OtherChoice
      checked={values.indicationPlateletOther === '1'}
      text={values.indicationPlateletOtherText ?? ''}
      name="indicationPlateletOther"
      label="Другие показания"
      onChange={onChange}
    />
  </>
);
