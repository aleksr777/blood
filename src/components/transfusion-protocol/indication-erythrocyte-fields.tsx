import { Choice, OtherChoice, type IndicationProps } from './indication-controls';
import styles from './indications-fields.module.css';

export const ErythrocyteIndications = ({ values, onChange }: IndicationProps) => {
  const threshold = values.indicationRbcThreshold;
  const severe = values.indicationRbcSevereAnemia === '1';
  const replacement = values.indicationRbcReplacement === '1';

  return (
    <fieldset className={styles.group}>
      <legend>Для эритроцитсодержащих компонентов</legend>
      <div className={styles.choiceGrid}>
        <Choice
          type="checkbox"
          name="indicationRbcSevereAnemia"
          checked={severe}
          onChange={() => onChange({ indicationRbcSevereAnemia: severe ? '' : '1' })}
        >
          Тяжёлая декомпенсированная анемия
        </Choice>
        <Choice
          type="checkbox"
          name="indicationRbcReplacement"
          checked={replacement}
          onChange={() => onChange({ indicationRbcReplacement: replacement ? '' : '1' })}
        >
          Восполнение количества циркулирующих эритроцитов
        </Choice>
        <Choice
          type="radio"
          name="indicationRbcThreshold"
          checked={threshold === '70-25'}
          onChange={() => onChange({ indicationRbcThreshold: '70-25' })}
        >
          Снижение Hb менее 70 г/л и Hct менее 25%
        </Choice>

        <div className={styles.choiceRow}>
          <Choice
            type="radio"
            name="indicationRbcThreshold"
            checked={threshold === 'custom'}
            onChange={() => onChange({ indicationRbcThreshold: 'custom' })}
          >
            Снижение Hb менее
          </Choice>
          <input
            className={styles.shortNumber}
            type="number"
            disabled={threshold !== 'custom'}
            value={values.indicationRbcHgb ?? ''}
            onChange={(event) => onChange({ indicationRbcHgb: event.target.value })}
          />
          <span>г/л и Hct менее</span>
          <input
            className={styles.shortNumber}
            type="number"
            disabled={threshold !== 'custom'}
            value={values.indicationRbcHct ?? ''}
            onChange={(event) => onChange({ indicationRbcHct: event.target.value })}
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
