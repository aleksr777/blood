import { useEffect, useState } from 'react';
import { FormInput } from '../form-input/form-input';
import { RadioOption } from '../radio-option/radio-option';
import { obstetricCountLabel, OBSTETRIC_UNKNOWN } from './obstetric-history';
import styles from './recipient-history-fields.module.css';

type Props = {
  name: string;
  label: string;
  value: string;
  maximum: number;
  onChange: (value: string) => void;
};

export const ObstetricCountField = ({ name, label, value, maximum, onChange }: Props) => {
  const [editingCount, setEditingCount] = useState(false);
  const selected = obstetricCountLabel(value);
  const hasCount = /^\d+$/.test(value) && Number(value) > 0;
  const countSelected = hasCount || editingCount;

  useEffect(() => {
    if (value) setEditingCount(false);
  }, [value]);

  const select = (next: string) => {
    setEditingCount(false);
    onChange(next);
  };

  return (
    <div className={styles.countField}>
      <div className={styles.countLabel}>{label}</div>
      <div className={styles.countOptions}>
        <RadioOption
          name={name}
          checked={selected === OBSTETRIC_UNKNOWN && !editingCount}
          onChange={(checked) => select(checked ? OBSTETRIC_UNKNOWN : '')}
        >
          Не известно
        </RadioOption>
        <RadioOption
          name={name}
          checked={selected === 'Не было' && !editingCount}
          onChange={(checked) => select(checked ? '0' : '')}
        >
          Не было
        </RadioOption>
        <div className={styles.countQuantity}>
          <RadioOption
            name={name}
            checked={countSelected}
            onChange={(checked) => {
              setEditingCount(checked);
              if (!checked || !hasCount) onChange('');
            }}
          >
            Количество:
          </RadioOption>
          <FormInput
            name={`${name}Quantity`}
            aria-label={`Количество: ${label}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={maximum}
            step={1}
            disabled={!countSelected}
            value={hasCount ? value : ''}
            onKeyDown={(event) => {
              if (
                !event.ctrlKey &&
                !event.metaKey &&
                ['e', 'E', '+', '-', '.', ','].includes(event.key)
              )
                event.preventDefault();
            }}
            onChange={(event) => {
              const next = event.target.value;
              if (next === '') {
                setEditingCount(true);
                onChange('');
              } else if (/^[1-9]\d?$/.test(next) && Number(next) <= maximum) {
                onChange(next);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
