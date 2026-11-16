import { FormInput } from '../form-input/form-input';
import {
  PLATELET_INDICATION_OPTIONS,
  PLATELET_THRESHOLD_DEFAULT,
} from '../../domain/platelet-indications';
import { Choice, OtherChoice, type IndicationProps } from './indication-controls';
import styles from './indications-fields.module.css';

export const PlateletIndications = ({ values, onChange }: IndicationProps) => {
  const selected = values.indicationPlateletThrombocytopenia === '1';
  const count = values.indicationPlateletCount ?? PLATELET_THRESHOLD_DEFAULT;
  const change = (name: string, value: string) =>
    onChange({ [name]: value, indicationPlateletVersion: '2' });

  return (
    <>
      <div className={styles.choiceRow}>
        <Choice
          name="indicationPlateletThrombocytopenia"
          checked={selected}
          onChange={() => change('indicationPlateletThrombocytopenia', selected ? '' : '1')}
        >
          Количество тромбоцитов менее
        </Choice>
        <FormInput
          aria-label="Порог количества тромбоцитов"
          name="indicationPlateletCount"
          className={styles.shortNumber}
          type="text"
          inputMode="numeric"
          maxLength={4}
          disabled={!selected}
          value={count}
          onChange={(event) => {
            if (/^\d{0,4}$/.test(event.target.value))
              change('indicationPlateletCount', event.target.value);
          }}
        />
        <span>× 10⁹/л.</span>
      </div>
      {PLATELET_INDICATION_OPTIONS.map(([name, label]) => (
        <Choice
          key={name}
          name={name}
          checked={values[name] === '1'}
          onChange={() => change(name, values[name] === '1' ? '' : '1')}
        >
          {label}
        </Choice>
      ))}
      <OtherChoice
        name="indicationPlateletOther"
        label="Другие показания"
        checked={values.indicationPlateletOther === '1'}
        text={values.indicationPlateletOtherText ?? ''}
        onChange={(changes) => onChange({ ...changes, indicationPlateletVersion: '2' })}
      />
    </>
  );
};
