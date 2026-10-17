import type { RecipientRecord } from '../../storage/repositories/recipients';
import Modal from '../modal/modal';
import { formatRecipientAge } from '../transfusion-protocol/recipient-demographics';
import { RecipientField } from '../transfusion-protocol/recipient-field';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';
import styles from '../transfusion-protocol/protocol-editor.module.css';

type Props = {
  values: ProtocolValues;
  onChange: (values: ProtocolValues) => void;
  onOpenRecipients: () => void;
  onSelectRecipient: (recipient: RecipientRecord) => boolean | Promise<boolean>;
  onClose: () => void;
};

export const RegistrationPatientDetailsModal = ({
  values,
  onChange,
  onOpenRecipients,
  onSelectRecipient,
  onClose,
}: Props) => (
  <Modal title="Данные реципиента" onClose={onClose} className={styles.medium}>
    <div className={styles.grid}>
      <div className={styles.wide}>
        <div className={styles.fieldLabel}>Фамилия, имя, отчество (при наличии)</div>
        <RecipientField
          value={values.recipientName ?? ''}
          onSelectRecipient={async (recipient) => {
            await onSelectRecipient(recipient);
          }}
          onOpenRecipients={onOpenRecipients}
        />
      </div>

      <label>
        <span>Дата рождения</span>
        <input
          name="recipientBirthDate"
          type="date"
          value={values.recipientBirthDate ?? ''}
          onChange={(event) => onChange({ recipientBirthDate: event.target.value })}
        />
      </label>

      <label>
        <span>Пол</span>
        <select
          name="recipientSex"
          value={values.recipientSex ?? ''}
          onChange={(event) => onChange({ recipientSex: event.target.value })}
        >
          <option value="">Не указано</option>
          <option value="Мужской">Мужской</option>
          <option value="Женский">Женский</option>
        </select>
      </label>

      <label>
        <span>Возраст</span>
        <input
          type="text"
          value={formatRecipientAge(values.recipientBirthDate)}
          readOnly
        />
      </label>

      <label>
        <span>№ медицинской карты</span>
        <input
          name="medicalRecordNumber"
          type="text"
          value={values.medicalRecordNumber ?? ''}
          onChange={(event) => onChange({ medicalRecordNumber: event.target.value })}
        />
      </label>

      <label>
        <span>№ палаты</span>
        <input
          name="roomNumber"
          type="text"
          value={values.roomNumber ?? ''}
          onChange={(event) => onChange({ roomNumber: event.target.value })}
        />
      </label>
    </div>
  </Modal>
);
