import type { ReactNode } from 'react';
import type { RecipientRecord } from '../../storage/repositories/recipients';
import Modal from '../modal/modal';
import { PatientDetailsFields } from '../transfusion-protocol/patient-details-fields';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import styles from './individual-selection-recipient-modal.module.css';

type Props = {
  savedDocument?: boolean;
  values: ProtocolValues;
  onRecipientChange: (values: ProtocolValues) => void | Promise<void>;
  onOpenRecipients: () => void;
  onSelectRecipient: (recipient: RecipientRecord) => void | boolean | Promise<void | boolean>;
  onClose: () => void;
  topContent?: ReactNode;
  children?: ReactNode;
};

export const IndividualSelectionRecipientModal = ({
  savedDocument = false,
  values,
  onRecipientChange,
  onOpenRecipients,
  onSelectRecipient,
  onClose,
  topContent,
  children,
}: Props) => (
  <Modal title="Данные реципиента" onClose={onClose} className={styles.modal}>
    {topContent && <div className={styles.topContent}>{topContent}</div>}
    <PatientDetailsFields
      savedDocument={savedDocument}
      values={values}
      onChange={(changes) => void onRecipientChange(changes)}
      onOpenRecipients={onOpenRecipients}
      onSelectRecipient={onSelectRecipient}
    />
    {children && <div className={styles.examination}>{children}</div>}
  </Modal>
);
