import type { IndicationProps } from './indication-controls';
import { CommonIndications } from './indication-common-fields';
import { ErythrocyteIndications } from './indication-erythrocyte-fields';
import { IndicationsAutoHeight } from './indications-auto-height';
import { INDICATION_COMPONENTS } from './indications-model';
import { PlasmaIndications } from './indication-plasma-fields';
import { PlateletIndications } from './indication-platelet-fields';
import styles from './indications-fields.module.css';

export const IndicationsFields = ({ values, onChange }: IndicationProps) => {
  const component = values.indicationComponent;

  return (
    <IndicationsAutoHeight>
      <div className={styles.root}>
      <fieldset className={styles.componentGroup}>
        <legend>Компонент крови</legend>
        <div className={styles.componentChoices}>
          {INDICATION_COMPONENTS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={styles.componentButton}
              data-component={value}
              data-selected={component === value}
              aria-pressed={component === value}
              onClick={() => onChange({ indicationComponent: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {component && (
        <>
          <CommonIndications values={values} onChange={onChange} />
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
    </IndicationsAutoHeight>
  );
};
