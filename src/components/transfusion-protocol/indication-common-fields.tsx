import { Choice, type IndicationProps } from './indication-controls';
import styles from './indications-fields.module.css';

export const CommonIndications = ({ values, onChange }: IndicationProps) => {
  const bloodLoss = values.indicationBloodLoss;
  const ongoing = values.indicationOngoingBleeding === '1';

  return (
    <fieldset className={styles.group}>
      <legend>Общие показания</legend>
      <div className={styles.choiceGrid}>
        <div className={styles.choiceRow}>
          <Choice
            type="radio"
            name="indicationBloodLoss"
            checked={bloodLoss === 'custom'}
            onChange={() => onChange({ indicationBloodLoss: 'custom' })}
          >
            Острая кровопотеря более
          </Choice>
          <input
            className={styles.shortNumber}
            type="number"
            min="0"
            max="100"
            disabled={bloodLoss !== 'custom'}
            value={values.indicationBloodLossPercent ?? ''}
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
