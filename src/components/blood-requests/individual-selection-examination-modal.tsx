import Modal from '../modal/modal';
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
      {bloodGroupWarning && (
        <div className={styles.bloodGroupWarning} role="alert">
          <span>{bloodGroupWarning}</span>
          <button
            type="button"
            className={styles.bloodGroupWarningDismiss}
            aria-label="Закрыть предупреждение"
            onClick={onDismissBloodGroupWarning}
          >
            ×
          </button>
        </div>
      )}
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
