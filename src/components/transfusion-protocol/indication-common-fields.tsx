import { Choice, type IndicationProps } from './indication-controls';
import styles from './indications-fields.module.css';

type ComponentCommonIndicationsProps = IndicationProps & {
  bloodLossName: string;
  bloodLossPercentName: string;
  ongoingBleedingName: string;
};

export const ComponentCommonIndications = ({
  values,
  onChange,
  bloodLossName,
  bloodLossPercentName,
  ongoingBleedingName,
}: ComponentCommonIndicationsProps) => {
  const bloodLossChecked = values[bloodLossName] === 'custom';
  const bloodLossPercent = values[bloodLossPercentName] || '25';
  const ongoing = values[ongoingBleedingName] === '1';

  return (
    <>
      <div className={styles.choiceRow}>
        <Choice
          type="checkbox"
          name={bloodLossName}
          checked={bloodLossChecked}
          onChange={() =>
            onChange(
              bloodLossChecked
                ? { [bloodLossName]: '' }
                : {
                    [bloodLossName]: 'custom',
                    [bloodLossPercentName]: bloodLossPercent,
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
          onChange={(event) => onChange({ [bloodLossPercentName]: event.target.value })}
        />
        <span>% ОЦК</span>
      </div>

      <Choice
        type="checkbox"
        name={ongoingBleedingName}
        checked={ongoing}
        onChange={() => onChange({ [ongoingBleedingName]: ongoing ? '' : '1' })}
      >
        Продолжающееся кровотечение
      </Choice>
    </>
  );
};
