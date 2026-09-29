import { useState } from 'react';
import type { RecipientRecord } from '../../storage/repositories/recipients';
import Modal, { ModalDismissButton } from '../modal/modal';
import styles from './recipient-delete-modal.module.css';

type Props = {
  recipient: RecipientRecord;
  onClose: () => void;
  onDelete: () => Promise<void>;
};

export const RecipientDeleteModal = ({ recipient, onClose, onDelete }: Props) => {
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setError('');
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Не удалось удалить реципиента.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal title="Удалить реципиента?" onClose={onClose} className={styles.modal}>
      <div className={styles.text}>
        Будут удалены данные <strong>{recipient.fullName}</strong> и все сохранённые бланки
        этого реципиента ({recipient.protocolCount}).
      </div>
      <div className={styles.warning}>Отменить это действие после удаления будет нельзя.</div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.actions}>
        <ModalDismissButton className={styles.secondary}>Отмена</ModalDismissButton>
        <button type="button" className={styles.danger} disabled={deleting} onClick={() => void remove()}>
          {deleting ? 'Удаление...' : 'Удалить'}
        </button>
      </div>
    </Modal>
  );
};
