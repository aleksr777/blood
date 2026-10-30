import { FormInput } from '../form-input/form-input';
import type { RecipientRecord } from '../../storage/repositories/recipients';
import Modal from '../modal/modal';
import { formatRecipientAge } from '../transfusion-protocol/recipient-demographics';
import { RecipientField } from '../transfusion-protocol/recipient-field';
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
  <Modal title="Данные реципиента" onClose={onClose} className={styles.medium}>
    <div className={styles.grid}>
      <div className={styles.wide}>
        <div className={styles.fieldLabel}>Фамилия, имя, отчество (при наличии)</div>
        {savedDocument ? (
          <FormInput
            aria-label="Фамилия, имя, отчество (при наличии)"
            name="recipientName"
            readOnly={savedDocument}
            value={values.recipientName ?? ''}
            onChange={(event) => onChange({ recipientName: event.target.value })}
          />
        ) : (
          <RecipientField
            value={values.recipientName ?? ''}
            onSelectRecipient={onSelectRecipient}
            onOpenRecipients={onOpenRecipients}
          />
        )}
      </div>

      <label>
        <span>Дата рождения</span>
        <input
          name="recipientBirthDate"
          readOnly={savedDocument}
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

      <div>
        <div className={styles.fieldLabel}>Возраст</div>
        <div className={styles.calculatedValue}>
          {(savedDocument ? values.recipientAge : formatRecipientAge(values.recipientBirthDate)) ||
            '—'}
        </div>
      </div>

      <label>
        <span>№ медицинской карты</span>
        <FormInput
          name="medicalRecordNumber"
          readOnly={savedDocument}
          type="text"
          value={values.medicalRecordNumber ?? ''}
          onChange={(event) => onChange({ medicalRecordNumber: event.target.value })}
        />
      </label>
    </div>
  </Modal>
);
