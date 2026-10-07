import { INDICATION_COMPONENTS } from './indications-model';
import type { ProtocolValues } from './protocol-types';
import styles from './indications-fields.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
};

type ChoiceProps = {
  type: 'radio' | 'checkbox';
  name: string;
  checked: boolean;
  children: React.ReactNode;
  onChange: () => void;
};

const Choice = ({ type, name, checked, children, onChange }: ChoiceProps) => (
  <label className={styles.choice}>
    <input type={type} name={name} checked={checked} onChange={onChange} />
    <span>{children}</span>
  </label>
);

const OtherChoice = ({
  checked,
  text,
  name,
  label,
  onChange,
}: {
  checked: boolean;
  text: string;
  name: string;
  label: string;
  onChange: (values: ProtocolValues) => void;
}) => (
  <div>
    <Choice
      type="checkbox"
      name={name}
      checked={checked}
      onChange={() => onChange({ [name]: checked ? '' : '1' })}
    >
      {label}
    </Choice>
    {checked && (
      <textarea
        className={styles.otherText}
        rows={2}
        value={text}
        onChange={(event) => onChange({ [`${name}Text`]: event.target.value })}
      />
    )}
  </div>
);

export const IndicationsFields = ({ values, onChange }: Props) => {
  const component = values.indicationComponent;
  const bloodLoss = values.indicationBloodLoss;
  const setComponent = (value: string) => onChange({ indicationComponent: value });

  return (
    <div className={styles.root}>
      <fieldset className={styles.componentGroup}>
        <legend>Компонент крови</legend>
        <div className={styles.componentChoices}>
          {INDICATION_COMPONENTS.map(({ value, label }) => (
            <Choice
              key={value}
              type="radio"
              name="indicationComponent"
              checked={component === value}
              onChange={() => setComponent(value)}
            >
              {label}
            </Choice>
          ))}
        </div>
      </fieldset>

      {component && (
        <>
          <fieldset className={styles.group}>
            <legend>Общие показания</legend>
            <div className={styles.choiceGrid}>
              <Choice
                type="radio"
                name="indicationBloodLoss"
                checked={bloodLoss === 'gt25'}
                onChange={() => onChange({ indicationBloodLoss: 'gt25' })}
              >
                Острая кровопотеря более 25% ОЦК
              </Choice>
              <Choice
                type="radio"
                name="indicationBloodLoss"
                checked={bloodLoss === 'custom'}
                onChange={() => onChange({ indicationBloodLoss: 'custom' })}
              >
                <span className={styles.inline}>
                  Острая кровопотеря более
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={bloodLoss !== 'custom'}
                    value={values.indicationBloodLossPercent ?? ''}
                    onChange={(event) =>
                      onChange({ indicationBloodLossPercent: event.target.value })
                    }
                  />
                  % ОЦК
                </span>
              </Choice>
              <Choice
                type="checkbox"
                name="indicationOngoingBleeding"
                checked={values.indicationOngoingBleeding === '1'}
                onChange={() =>
                  onChange({
                    indicationOngoingBleeding:
                      values.indicationOngoingBleeding === '1' ? '' : '1',
                  })
                }
              >
                Продолжающееся кровотечение
              </Choice>
            </div>
          </fieldset>

          {component === 'erythrocytes' && (
            <ErythrocyteIndications values={values} onChange={onChange} />
          )}
          {component === 'plasma-cryo' && (
            <PlasmaIndications values={values} onChange={onChange} />
          )}
          {component === 'platelets' && (
            <PlateletIndications values={values} onChange={onChange} />
          )}
        </>
      )}
    </div>
  );
};

const ErythrocyteIndications = ({ values, onChange }: Props) => (
  <fieldset className={styles.group}>
    <legend>Для эритроцитсодержащих компонентов</legend>
    <div className={styles.choiceGrid}>
      <Choice
        type="checkbox"
        name="indicationRbcSevereAnemia"
        checked={values.indicationRbcSevereAnemia === '1'}
        onChange={() =>
          onChange({ indicationRbcSevereAnemia: values.indicationRbcSevereAnemia === '1' ? '' : '1' })
        }
      >
        Тяжёлая декомпенсированная анемия
      </Choice>
      <Choice
        type="checkbox"
        name="indicationRbcReplacement"
        checked={values.indicationRbcReplacement === '1'}
        onChange={() =>
          onChange({ indicationRbcReplacement: values.indicationRbcReplacement === '1' ? '' : '1' })
        }
      >
        Восполнение количества циркулирующих эритроцитов
      </Choice>
      <Choice
        type="radio"
        name="indicationRbcThreshold"
        checked={values.indicationRbcThreshold === '70-25'}
        onChange={() => onChange({ indicationRbcThreshold: '70-25' })}
      >
        Снижение Hb менее 70 г/л и Hct менее 25%
      </Choice>
      <Choice
        type="radio"
        name="indicationRbcThreshold"
        checked={values.indicationRbcThreshold === 'custom'}
        onChange={() => onChange({ indicationRbcThreshold: 'custom' })}
      >
        <span className={styles.inline}>
          Hb менее
          <input
            type="number"
            disabled={values.indicationRbcThreshold !== 'custom'}
            value={values.indicationRbcHgb ?? ''}
            onChange={(event) => onChange({ indicationRbcHgb: event.target.value })}
          />
          г/л и Hct менее
          <input
            type="number"
            disabled={values.indicationRbcThreshold !== 'custom'}
            value={values.indicationRbcHct ?? ''}
            onChange={(event) => onChange({ indicationRbcHct: event.target.value })}
          />
          %
        </span>
      </Choice>
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

const PlasmaIndications = ({ values, onChange }: Props) => (
  <fieldset className={styles.group}>
    <legend>Для плазмы и криопреципитата</legend>
    <div className={styles.choiceGrid}>
      {[
        ['indicationPlasmaFactorDeficiency', 'Дефицит плазменных факторов свёртывания крови'],
        ['indicationPlasmaAnticoagulantOverdose', 'Передозировка антикоагулянтов непрямого действия'],
        ['indicationPlasmaPlasmapheresis', 'Выполнение терапевтического плазмафереза'],
      ].map(([name, label]) => (
        <Choice
          key={name}
          type="checkbox"
          name={name}
          checked={values[name] === '1'}
          onChange={() => onChange({ [name]: values[name] === '1' ? '' : '1' })}
        >
          {label}
        </Choice>
      ))}
      <OtherChoice
        checked={values.indicationPlasmaOther === '1'}
        text={values.indicationPlasmaOtherText ?? ''}
        name="indicationPlasmaOther"
        label="Другие показания"
        onChange={onChange}
      />
    </div>
  </fieldset>
);

const PlateletIndications = ({ values, onChange }: Props) => (
  <fieldset className={styles.group}>
    <legend>Для тромбоцитов</legend>
    <div className={styles.choiceGrid}>
      <Choice
        type="radio"
        name="indicationPlateletReason"
        checked={values.indicationPlateletReason === 'hemorrhagic'}
        onChange={() => onChange({ indicationPlateletReason: 'hemorrhagic' })}
      >
        Тромбоцитопения, геморрагический синдром
      </Choice>
      <Choice
        type="radio"
        name="indicationPlateletReason"
        checked={values.indicationPlateletReason === 'high-risk'}
        onChange={() => onChange({ indicationPlateletReason: 'high-risk' })}
      >
        Тромбоцитопения, высокий риск кровотечения
      </Choice>
      <OtherChoice
        checked={values.indicationPlateletOther === '1'}
        text={values.indicationPlateletOtherText ?? ''}
        name="indicationPlateletOther"
        label="Другие показания"
        onChange={onChange}
      />
    </div>
  </fieldset>
);
