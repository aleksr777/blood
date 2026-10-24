import { AnimatedMessage } from '../animated-reveal/animated-message';
import { useState } from 'react';
import type { RegistrationRecord } from '../../storage/repositories/recipients';
import Modal, { ModalDismissButton } from '../modal/modal';
import styles from './recipient-delete-modal.module.css';

type Props = {
  record: RegistrationRecord;
  recipientName: string;
  onClose: () => void;
  onDelete: () => Promise<void>;
};

const formatUpdated = (value: number) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));

export const RegistrationRecordDeleteModal = ({
  record,
  recipientName,
  onClose,
  onDelete,
}: Props) => {
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setError('');
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : 'Не удалось удалить лист регистрации.',
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal title="Удалить лист регистрации?" onClose={onClose} className={styles.modal}>
      <div className={styles.text}>
        Будет удалён лист регистрации реципиента <strong>{recipientName}</strong>.
        <br />
        Последнее изменение: <strong>{formatUpdated(record.updatedAt)}</strong>.
      </div>
      <div className={styles.warning}>Отменить это действие после удаления будет нельзя.</div>
      <AnimatedMessage message={error} className={styles.error} role="alert" />
      <div className={styles.actions}>
        <ModalDismissButton className={styles.secondary} disabled={deleting}>
          Отмена
        </ModalDismissButton>
        <button
          type="button"
          className={styles.danger}
          disabled={deleting}
          onClick={() => void remove()}
        >
          {deleting ? 'Удаление...' : 'Удалить'}
        </button>
      </div>
    </Modal>
  );
};
