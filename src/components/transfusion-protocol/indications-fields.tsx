import type { IndicationProps } from './indication-controls';
import { ErythrocyteIndications } from './indication-erythrocyte-fields';
import { GranulocyteIndications } from './indication-granulocyte-fields';
import { IndicationsAutoHeight } from './indications-auto-height';
import { BloodComponentSelector } from '../blood-component-selector/blood-component-selector';
import { componentGroupChanges, selectedBloodComponentGroup } from '../../domain/blood-components';
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
  const component = selectedBloodComponentGroup(values, values.componentName);

  return (
    <IndicationsAutoHeight>
      <div className={styles.root}>
        {showComponentSelector && (
          <BloodComponentSelector
            group={component}
            name={values.componentName ?? ''}
            lastSelectedGroup={values.lastSelectedComponentGroup}
            showName={false}
            onChange={({ group, name }) => onChange(componentGroupChanges(values, group, name))}
          />
        )}

        {component && (
          <div>
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
              {component === 'granulocytes' && (
                <GranulocyteIndications values={values} onChange={onChange} />
              )}
            </div>
          </div>
        )}
      </div>
    </IndicationsAutoHeight>
  );
};
