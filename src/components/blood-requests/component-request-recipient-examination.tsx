import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import { RecipientExaminationFields } from '../transfusion-protocol/recipient-examination-fields';
import styles from './component-request-page.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (changes: ProtocolValues) => void | Promise<void>;
};

export const ComponentRequestRecipientExamination = ({ values, onChange }: Props) => (
  <section aria-label="Группа крови и антигены реципиента">
    <h3 className={styles.examinationTitle}>Группа крови и антигены реципиента</h3>
    <RecipientExaminationFields
      values={values}
      showAlloimmuneAntibodies={false}
      onChange={(changes) => {
        void onChange(changes);
      }}
    />
  </section>
);
