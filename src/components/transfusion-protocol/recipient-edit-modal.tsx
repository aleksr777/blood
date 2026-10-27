import { useState } from 'react';
import type { RecipientRecord } from '../../storage/repositories/recipients';
import Modal from '../modal/modal';
import { RecipientDataForm } from './recipient-data-form';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-edit-modal.module.css';

type Props = {
  recipient: RecipientRecord;
  onClose: () => void;
  onSave: (values: ProtocolValues) => Promise<void>;
};

export const RecipientEditModal = ({ recipient, onClose, onSave }: Props) => {
  const [values, setValues] = useState<ProtocolValues>(() => ({
    ...recipient.profile,
    recipientName: recipient.fullName,
  }));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const changeValues = (nextValues: ProtocolValues) =>
    setValues((current) => ({ ...current, ...nextValues }));

  const save = async () => {
    if (saving) return;
    setError('');
    setSaving(true);
    try {
      await onSave(values);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить данные.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Данные реципиента"
      onClose={onClose}
      className={styles.modal}
      dismissible={!saving}
    >
      <RecipientDataForm
        values={values}
        onChange={changeValues}
        onSubmit={() => void save()}
        busy={saving}
        error={error}
        submitLabel="Сохранить"
        pendingLabel="Сохранение..."
      />
    </Modal>
  );
};
