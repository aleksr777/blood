import Modal from '../modal/modal';
import { RecipientHistoryFields } from '../transfusion-protocol/recipient-history-fields';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import styles from '../transfusion-protocol/protocol-editor.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void | Promise<void>;
  onClose: () => void;
};

export const IndividualSelectionObstetricHistoryModal = ({
  values,
  onChange,
  onClose,
}: Props) => (
  <Modal title="Акушерский анамнез" onClose={onClose} className={styles.large}>
    <div className={styles.grid}>
      <RecipientHistoryFields
        values={values}
        showObstetricHistory
        showTransfusionHistory={false}
        onChange={(nextValues) => {
          void onChange(nextValues);
        }}
      />
    </div>
  </Modal>
);
