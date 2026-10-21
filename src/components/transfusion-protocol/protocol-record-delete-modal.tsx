import { useState } from 'react';
import type { ProtocolRecord } from '../../storage/repositories/recipients';
import Modal, { ModalDismissButton } from '../modal/modal';
import { formatDate } from './protocol-types';
import styles from './recipient-delete-modal.module.css';

type Props = {
  record: ProtocolRecord;
  recipientName: string;
  onClose: () => void;
  onDelete: () => Promise<void>;
};

export const ProtocolRecordDeleteModal = ({ record, recipientName, onClose, onDelete }: Props) => {
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const transfusionDate = formatDate(record.values.transfusionDate) || 'дата не указана';

  const remove = async () => {
    setError('');
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Не удалось удалить сохранённый бланк.',
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal title="Удалить сохранённый бланк?" onClose={onClose} className={styles.modal}>
      <div className={styles.text}>
        Будет удалён бланк реципиента <strong>{recipientName}</strong>.
        <br />
        Дата трансфузии: <strong>{transfusionDate}</strong>.
      </div>
      <div className={styles.warning}>Отменить это действие после удаления будет нельзя.</div>
      {error && <div className={styles.error}>{error}</div>}
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
