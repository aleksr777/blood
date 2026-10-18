import Modal from '../modal/modal';
import { RecipientExaminationFields } from '../transfusion-protocol/recipient-examination-fields';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import styles from './individual-selection-component-modal.module.css';

type Props = {
  requiredComponent: string;
  quantity: string;
  examinationValues: ProtocolValues;
  onLocalChange: (values: Record<string, string>) => void;
  onExaminationChange: (values: ProtocolValues) => void | Promise<void>;
  onClose: () => void;
};

export const IndividualSelectionComponentModal = ({
  requiredComponent,
  quantity,
  examinationValues,
  onLocalChange,
  onExaminationChange,
  onClose,
}: Props) => (
  <Modal
    title="Компонент крови и данные реципиента"
    onClose={onClose}
    className={styles.modal}
  >
    <div className={styles.root}>
      <div className={styles.localGrid}>
        <label className={styles.wide}>
          <span>Наименование требуемого компонента</span>
          <input
            value={requiredComponent}
            onChange={(event) =>
              onLocalChange({ requiredComponent: event.target.value })
            }
          />
        </label>
        <label className={styles.wide}>
          <span>Количество</span>
          <input
            value={quantity}
            onChange={(event) => onLocalChange({ quantity: event.target.value })}
          />
        </label>
      </div>

      <div className={styles.divider} />

      <RecipientExaminationFields
        values={examinationValues}
        onChange={(values) => {
          void onExaminationChange(values);
        }}
      />
    </div>
  </Modal>
);
