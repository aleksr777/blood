import { Choice, OtherChoice, type IndicationProps } from './indication-controls';
import styles from './indications-fields.module.css';

export const PlateletIndications = ({ values, onChange }: IndicationProps) => {
  const hemorrhagicSyndrome = values.indicationPlateletHemorrhagicSyndrome === '1';
  const highBleedingRisk = values.indicationPlateletHighBleedingRisk === '1';
  const thrombocytopenia = values.indicationPlateletThrombocytopenia === '1';
  const plateletCount = values.indicationPlateletCount || '50';

  return (
    <>
      <Choice
        type="checkbox"
        name="indicationPlateletHemorrhagicSyndrome"
        checked={hemorrhagicSyndrome}
        onChange={() =>
          onChange({
            indicationPlateletHemorrhagicSyndrome: hemorrhagicSyndrome ? '' : '1',
          })
        }
      >
        Геморрагический синдром
      </Choice>

      <Choice
        type="checkbox"
        name="indicationPlateletHighBleedingRisk"
        checked={highBleedingRisk}
        onChange={() =>
          onChange({
            indicationPlateletHighBleedingRisk: highBleedingRisk ? '' : '1',
          })
        }
      >
        Высокий риск кровотечения
      </Choice>

      <div className={styles.choiceRow}>
        <Choice
          type="checkbox"
          name="indicationPlateletThrombocytopenia"
          checked={thrombocytopenia}
          onChange={() =>
            onChange(
              thrombocytopenia
                ? { indicationPlateletThrombocytopenia: '' }
                : {
                    indicationPlateletThrombocytopenia: '1',
                    indicationPlateletCount: plateletCount,
                  },
            )
          }
        >
          Тромбоцитопения менее
        </Choice>
        <input
          className={styles.shortNumber}
          type="number"
          min="0"
          disabled={!thrombocytopenia}
          value={plateletCount}
          onChange={(event) =>
            onChange({
              indicationPlateletThrombocytopenia: '1',
              indicationPlateletCount: event.target.value,
            })
          }
        />
        <span>×10⁹/л</span>
      </div>

      <OtherChoice
        checked={values.indicationPlateletOther === '1'}
        text={values.indicationPlateletOtherText ?? ''}
        name="indicationPlateletOther"
        label="Другие показания"
        onChange={onChange}
      />
    </>
  );
};
