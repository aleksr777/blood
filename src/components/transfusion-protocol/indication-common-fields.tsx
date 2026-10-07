import { Choice, type IndicationProps } from './indication-controls';
import styles from './indications-fields.module.css';

export const CommonIndications = ({ values, onChange }: IndicationProps) => {
  const bloodLossChecked = values.indicationBloodLoss === 'custom';
  const bloodLossPercent = values.indicationBloodLossPercent || '25';
  const ongoing = values.indicationOngoingBleeding === '1';

  return (
    <fieldset className={styles.group}>
      <legend>Общие показания</legend>
      <div className={styles.choiceGrid}>
        <div className={styles.choiceRow}>
          <Choice
            type="checkbox"
            name="indicationBloodLoss"
            checked={bloodLossChecked}
            onChange={() =>
              onChange(
                bloodLossChecked
                  ? { indicationBloodLoss: '' }
                  : {
                      indicationBloodLoss: 'custom',
                      indicationBloodLossPercent: bloodLossPercent,
                    },
              )
            }
          >
            Острая кровопотеря более
          </Choice>
          <input
            className={styles.shortNumber}
            type="number"
            min="0"
            max="100"
            disabled={!bloodLossChecked}
            value={bloodLossPercent}
            onChange={(event) => onChange({ indicationBloodLossPercent: event.target.value })}
          />
          <span>% ОЦК</span>
        </div>

        <Choice
          type="checkbox"
          name="indicationOngoingBleeding"
          checked={ongoing}
          onChange={() => onChange({ indicationOngoingBleeding: ongoing ? '' : '1' })}
        >
          Продолжающееся кровотечение
        </Choice>
      </div>
    </fieldset>
  );
};
