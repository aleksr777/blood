import { HISTORY_STATUS, getHistoryStatus } from './recipient-history-model';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-history-fields.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
};

const HISTORY_FIELDS = [
  {
    statusName: 'previousTransfusionsStatus',
    textName: 'previousTransfusions',
    label: 'Трансфузии компонентов крови в анамнезе',
  },
  {
    statusName: 'previousReactionsStatus',
    textName: 'previousReactions',
    label: 'Реакции и осложнения на трансфузии в анамнезе',
  },
  {
    statusName: 'individualSelectionHistoryStatus',
    textName: 'individualSelectionHistory',
    label: 'Трансфузии по индивидуальному подбору',
  },
] as const;

const STATUS_OPTIONS = [
  [HISTORY_STATUS.none, 'Не было'],
  [HISTORY_STATUS.unknown, 'Не известно'],
  [HISTORY_STATUS.had, 'Были'],
] as const;

export const RecipientHistoryFields = ({ values, onChange }: Props) => (
  <div className={styles.root}>
    {HISTORY_FIELDS.map(({ statusName, textName, label }) => {
      const status = getHistoryStatus(values[statusName], values[textName]);

      return (
        <fieldset key={statusName} className={styles.group}>
          <legend>{label}</legend>

          <div className={styles.options}>
            {STATUS_OPTIONS.map(([value, optionLabel]) => (
              <label key={value} className={styles.option}>
                <input
                  type="radio"
                  name={statusName}
                  checked={status === value}
                  onChange={() => onChange({ [statusName]: value })}
                />
                <span>{optionLabel}</span>
              </label>
            ))}
          </div>

          {status === HISTORY_STATUS.had && (
            <textarea
              name={textName}
              rows={4}
              value={values[textName] ?? ''}
              onChange={(event) => onChange({ [textName]: event.target.value })}
            />
          )}
        </fieldset>
      );
    })}
  </div>
);
