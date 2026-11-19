import type { RecipientRecord } from '../../storage/repositories/recipients';
import Modal from '../modal/modal';
import { PatientDetailsFields } from '../transfusion-protocol/patient-details-fields';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import styles from '../transfusion-protocol/protocol-editor.module.css';

type Props = {
  savedDocument?: boolean;
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
  onOpenRecipients: () => void;
  onSelectRecipient: (recipient: RecipientRecord) => boolean | Promise<boolean>;
  onClose: () => void;
};

export const RegistrationPatientDetailsModal = ({
  savedDocument = false,
  values,
  onChange,
  onOpenRecipients,
  onSelectRecipient,
  onClose,
}: Props) => (
  <Modal title="Данные реципиента" onClose={onClose} className={styles.large}>
    <PatientDetailsFields
      values={values}
      onChange={onChange}
      savedDocument={savedDocument}
      onOpenRecipients={onOpenRecipients}
      onSelectRecipient={onSelectRecipient}
    />
  </Modal>
);
