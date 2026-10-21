import type { RecipientRecord } from '../../storage/repositories/recipients';
import Modal from '../modal/modal';
import { ProtocolFieldControl } from '../transfusion-protocol/protocol-field-control';
import { formatRecipientAge } from '../transfusion-protocol/recipient-demographics';
import type { ProtocolFieldConfig, ProtocolValues } from '../transfusion-protocol/protocol-types';
import styles from './individual-selection-recipient-modal.module.css';

const RECIPIENT_NAME_FIELD: ProtocolFieldConfig = {
  name: 'recipientName',
  label: 'Фамилия, имя, отчество реципиента',
  wide: true,
};

const BIRTH_DATE_FIELD: ProtocolFieldConfig = {
  name: 'recipientBirthDate',
  label: 'Дата рождения',
  type: 'date',
};

const SEX_FIELD: ProtocolFieldConfig = {
  name: 'recipientSex',
  label: 'Пол',
  type: 'select',
  options: ['Мужской', 'Женский'],
};

const MEDICAL_RECORD_FIELD: ProtocolFieldConfig = {
  name: 'medicalRecordNumber',
  label: '№ медицинской карты',
};

const DIAGNOSIS_FIELD: ProtocolFieldConfig = {
  name: 'diagnosis',
  label: 'Диагноз',
  type: 'textarea',
  wide: true,
};

type Props = {
  values: ProtocolValues;
  onRecipientChange: (values: ProtocolValues) => void | Promise<void>;
  onOpenRecipients: () => void;
  onSelectRecipient: (recipient: RecipientRecord) => void | boolean | Promise<void | boolean>;
  onClose: () => void;
};

export const IndividualSelectionRecipientModal = ({
  values,
  onRecipientChange,
  onOpenRecipients,
  onSelectRecipient,
  onClose,
}: Props) => {
  const changeValue = (name: string, value: string) => {
    void onRecipientChange({ [name]: value });
  };

  return (
    <Modal title="Данные реципиента" onClose={onClose} className={styles.modal}>
      <div className={styles.grid}>
        <ProtocolFieldControl
          field={RECIPIENT_NAME_FIELD}
          value={values.recipientName ?? ''}
          onChange={changeValue}
          onOpenRecipients={onOpenRecipients}
          onSelectRecipient={onSelectRecipient}
        />

        <ProtocolFieldControl
          field={BIRTH_DATE_FIELD}
          value={values.recipientBirthDate ?? ''}
          onChange={changeValue}
        />

        <ProtocolFieldControl
          field={SEX_FIELD}
          value={values.recipientSex ?? ''}
          onChange={changeValue}
        />

        <div>
          <div className={styles.fieldLabel}>Возраст</div>
          <div className={styles.calculatedValue}>
            {formatRecipientAge(values.recipientBirthDate) || '—'}
          </div>
        </div>

        <ProtocolFieldControl
          field={MEDICAL_RECORD_FIELD}
          value={values.medicalRecordNumber ?? ''}
          onChange={changeValue}
        />

        <ProtocolFieldControl
          field={DIAGNOSIS_FIELD}
          value={values.diagnosis ?? ''}
          onChange={changeValue}
        />
      </div>
    </Modal>
  );
};
