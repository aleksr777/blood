import { Choice, OtherChoice, type IndicationProps } from './indication-controls';
import styles from './indications-fields.module.css';

export const ErythrocyteIndications = ({ values, onChange }: IndicationProps) => {
  const threshold = values.indicationRbcThreshold;
  const thresholdSelected = threshold === 'custom' || threshold === '70-25';
  const circulatoryDisturbances = values.indicationRbcCirculatoryDisturbances === '1';
  const hemicHypoxia = values.indicationRbcHemicHypoxia === '1';
  const hgb = values.indicationRbcHgb || '70';
  const hct = values.indicationRbcHct || '25';

  return (
    <fieldset className={styles.group}>
      <legend>Для эритроцитсодержащих компонентов</legend>
      <div className={styles.choiceGrid}>
        <Choice
          type="checkbox"
          name="indicationRbcCirculatoryDisturbances"
          checked={circulatoryDisturbances}
          onChange={() =>
            onChange({
              indicationRbcCirculatoryDisturbances: circulatoryDisturbances ? '' : '1',
            })
          }
        >
          Циркуляторные нарушения
        </Choice>
        <Choice
          type="checkbox"
          name="indicationRbcHemicHypoxia"
          checked={hemicHypoxia}
          onChange={() =>
            onChange({
              indicationRbcHemicHypoxia: hemicHypoxia ? '' : '1',
            })
          }
        >
          Признаки гемической гипоксии
        </Choice>

        <div className={styles.choiceRow}>
          <Choice
            type="checkbox"
            name="indicationRbcThreshold"
            checked={thresholdSelected}
            onChange={() =>
              onChange(
                thresholdSelected
                  ? { indicationRbcThreshold: '' }
                  : {
                      indicationRbcThreshold: 'custom',
                      indicationRbcHgb: hgb,
                      indicationRbcHct: hct,
                    },
              )
            }
          >
            Снижение гемоглобина менее
          </Choice>
          <input
            className={styles.shortNumber}
            type="number"
            disabled={!thresholdSelected}
            value={hgb}
            onChange={(event) =>
              onChange({
                indicationRbcThreshold: 'custom',
                indicationRbcHgb: event.target.value,
                indicationRbcHct: hct,
              })
            }
          />
          <span>г/л и гематокрита менее</span>
          <input
            className={styles.shortNumber}
            type="number"
            disabled={!thresholdSelected}
            value={hct}
            onChange={(event) =>
              onChange({
                indicationRbcThreshold: 'custom',
                indicationRbcHgb: hgb,
                indicationRbcHct: event.target.value,
              })
            }
          />
          <span>%</span>
        </div>

        <OtherChoice
          checked={values.indicationRbcOther === '1'}
          text={values.indicationRbcOtherText ?? ''}
          name="indicationRbcOther"
          label="Другие показания"
          onChange={onChange}
        />
      </div>
    </fieldset>
  );
};
