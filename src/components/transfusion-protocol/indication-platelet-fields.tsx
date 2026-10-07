import { Choice, OtherChoice, type IndicationProps } from './indication-controls';
import styles from './indications-fields.module.css';

export const PlateletIndications = ({ values, onChange }: IndicationProps) => (
  <fieldset className={styles.group}>
    <legend>Для тромбоцитов</legend>
    <div className={styles.choiceGrid}>
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
    </div>
  </fieldset>
);
