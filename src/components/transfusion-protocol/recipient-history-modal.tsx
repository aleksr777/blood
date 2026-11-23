import Modal from '../modal/modal';
import { RecipientHistorySection } from './recipient-input-sections';
import type { ProtocolValues } from './protocol-types';
import styles from './protocol-editor.module.css';

type Props = {
  values: ProtocolValues;
  savedDocument?: boolean;
  previousTransfusionSuggestion?: string;
  onChange: (values: ProtocolValues) => void | Promise<void>;
  onClose: () => void;
};

export const RecipientHistoryModal = ({
  values,
  savedDocument = false,
  previousTransfusionSuggestion,
  onChange,
  onClose,
}: Props) => (
  <Modal title="Анамнез реципиента" onClose={onClose} className={styles.large}>
    <div className={styles.grid}>
      <RecipientHistorySection
        values={values}
        applyDefaults={!savedDocument}
        previousTransfusionSuggestion={savedDocument ? '' : previousTransfusionSuggestion}
        onChange={(changes) => void onChange(changes)}
        showTitle={false}
      />
    </div>
  </Modal>
);
