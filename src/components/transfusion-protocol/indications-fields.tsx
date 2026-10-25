import type { IndicationProps } from './indication-controls';
import { ErythrocyteIndications } from './indication-erythrocyte-fields';
import { IndicationsAutoHeight } from './indications-auto-height';
import { BloodComponentSelector } from '../blood-component-selector/blood-component-selector';
import { inferBloodComponentGroup } from '../../domain/blood-components';
import { PlasmaIndications } from './indication-plasma-fields';
import { PlateletIndications } from './indication-platelet-fields';
import styles from './indications-fields.module.css';

type IndicationsFieldsProps = IndicationProps & {
  showComponentSelector?: boolean;
};

export const IndicationsFields = ({
  values,
  onChange,
  showComponentSelector = true,
}: IndicationsFieldsProps) => {
  const component =
    values.componentGroup ||
    values.indicationComponent ||
    inferBloodComponentGroup(values.componentName);

  return (
    <IndicationsAutoHeight>
      <div className={styles.root}>
        {showComponentSelector && (
          <BloodComponentSelector
            group={component}
            name={values.componentName ?? ''}
            showName={false}
            onChange={({ group, name }) =>
              onChange({ componentGroup: group, indicationComponent: group, componentName: name })
            }
          />
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
