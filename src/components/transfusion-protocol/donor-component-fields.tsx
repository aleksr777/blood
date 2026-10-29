import type { ComponentProps } from 'react';
import { inferBloodComponentGroup } from '../../domain/blood-components';
import { BloodComponentSelector } from '../blood-component-selector/blood-component-selector';
import { DonorDetailsFields } from './donor-details-fields';
import { IndicationsFields } from './indications-fields';
import styles from './protocol-editor.module.css';

export const DonorComponentFields = (props: ComponentProps<typeof DonorDetailsFields>) => {
  const { values, onChange } = props;
  const group =
    values.componentGroup ||
    values.indicationComponent ||
    inferBloodComponentGroup(values.componentName);
  return (
    <>
      <BloodComponentSelector
        group={group}
        name={values.componentName ?? ''}
        onChange={({ group, name }) =>
          onChange({ componentGroup: group, indicationComponent: group, componentName: name })
        }
      />
      <section className={styles.wide} aria-label="Данные гемакона">
        <h3 className={styles.sectionTitle}>Данные гемакона</h3>
        <div className={styles.grid}>
          <DonorDetailsFields {...props} />
        </div>
      </section>
      <section className={styles.wide} aria-label="Показания к трансфузии">
        <h3 className={styles.sectionTitle}>Показания к трансфузии</h3>
        <IndicationsFields values={values} onChange={onChange} showComponentSelector={false} />
      </section>
    </>
  );
};
