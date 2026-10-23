import Modal from '../modal/modal';
import { WarningNotice } from '../warning-notice/warning-notice';
import { RecipientExaminationFields } from '../transfusion-protocol/recipient-examination-fields';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import styles from '../transfusion-protocol/protocol-editor.module.css';

type Props = {
  values: ProtocolValues;
  bloodGroupWarning?: string;
  onDismissBloodGroupWarning?: () => void;
  onChange: (values: ProtocolValues) => void | Promise<void>;
  onClose: () => void;
  showAlloimmuneAntibodies?: boolean;
};

export const IndividualSelectionExaminationModal = ({
  values,
  bloodGroupWarning = '',
  onDismissBloodGroupWarning,
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
      <WarningNotice
        className={styles.bloodGroupWarning}
        message={bloodGroupWarning}
        onDismiss={onDismissBloodGroupWarning}
      />
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
