import Modal from '../modal/modal';
import { IndicationsFields } from '../transfusion-protocol/indications-fields';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import styles from '../transfusion-protocol/protocol-editor.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
  onClose: () => void;
};

export const IndividualSelectionIndicationsModal = ({
  values,
  onChange,
  onClose,
}: Props) => (
  <Modal title="Показания к трансфузии" onClose={onClose} className={styles.large}>
    <div className={styles.grid}>
      <IndicationsFields values={values} onChange={onChange} />
    </div>
  </Modal>
);
