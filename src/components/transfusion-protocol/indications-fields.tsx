import type { IndicationProps } from './indication-controls';
import { ErythrocyteIndications } from './indication-erythrocyte-fields';
import { IndicationsAutoHeight } from './indications-auto-height';
import { INDICATION_COMPONENTS } from './indications-model';
import { PlasmaIndications } from './indication-plasma-fields';
import { PlateletIndications } from './indication-platelet-fields';
import styles from './indications-fields.module.css';

type IndicationsFieldsProps = IndicationProps & {
  showComponentSelector?: boolean;
};

export const IndicationComponentSelector = ({ values, onChange }: IndicationProps) => {
  const lockedComponent = values.componentGroup;
  const component = lockedComponent || values.indicationComponent;

  return (
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
            disabled={Boolean(lockedComponent && lockedComponent !== value)}
            onClick={() => onChange({ indicationComponent: value })}
          >
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
};

export const IndicationsFields = ({
  values,
  onChange,
  showComponentSelector = true,
}: IndicationsFieldsProps) => {
  const lockedComponent = values.componentGroup;
  const component = lockedComponent || values.indicationComponent;

  return (
    <IndicationsAutoHeight>
      <div className={styles.root}>
        {showComponentSelector && (
          <IndicationComponentSelector values={values} onChange={onChange} />
        )}

        {component && (
          <fieldset className={styles.group}>
            <div className={styles.choiceGrid}>
              {component === 'erythrocytes' && (
                <ErythrocyteIndications values={values} onChange={onChange} />
              )}
              {component === 'plasma-cryo' && (
                <PlasmaIndications values={values} onChange={onChange} />
              )}
              {component === 'platelets' && (
                <PlateletIndications values={values} onChange={onChange} />
              )}
            </div>
          </fieldset>
        )}
      </div>
    </IndicationsAutoHeight>
  );
};
