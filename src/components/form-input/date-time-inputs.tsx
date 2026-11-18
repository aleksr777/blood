import { joinLocalDateTime, splitLocalDateTime } from '../../domain/date-time';
import { FormInput } from './form-input';
import styles from './date-time-inputs.module.css';

type Props = {
  name: string;
  label: string;
  value: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
};

export const DateTimeInputs = ({ name, label, value, readOnly, onChange }: Props) => {
  const [date, time] = splitLocalDateTime(value);
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.controls}>
        <div>
          <FormInput
            name={`${name}Date`}
            aria-label="Дата"
            type="date"
            value={date}
            readOnly={readOnly}
            onChange={(event) => onChange(joinLocalDateTime(event.target.value, time))}
          />
        </div>
        <div>
          <FormInput
            name={`${name}Time`}
            aria-label="Время"
            type="time"
            value={time}
            readOnly={readOnly}
            onChange={(event) => onChange(joinLocalDateTime(date, event.target.value))}
          />
        </div>
      </div>
    </fieldset>
  );
};
