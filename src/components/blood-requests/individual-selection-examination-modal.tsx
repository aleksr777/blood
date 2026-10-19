import Modal from '../modal/modal';
import { RecipientExaminationFields } from '../transfusion-protocol/recipient-examination-fields';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import styles from '../transfusion-protocol/protocol-editor.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void | Promise<void>;
  onClose: () => void;
  showAlloimmuneAntibodies?: boolean;
};

export const IndividualSelectionExaminationModal = ({
  values,
  onChange,
  onClose,
  showAlloimmuneAntibodies = true,
}: Props) => (
  <Modal
    title="Данные медицинского обследования реципиента"
    onClose={onClose}
    className={styles.medium}
  >
    <div className={styles.grid}>
      <RecipientExaminationFields
        values={values}
        showAlloimmuneAntibodies={showAlloimmuneAntibodies}
        onChange={(nextValues) => {
          void onChange(nextValues);
        }}
      />
    </div>
  </Modal>
);
