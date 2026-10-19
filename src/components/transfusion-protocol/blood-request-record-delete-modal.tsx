import { useState } from 'react';
import type { BloodRequestRecord } from '../../storage/repositories/recipients';
import Modal, { ModalDismissButton } from '../modal/modal';
import styles from './recipient-delete-modal.module.css';

type Props = {
  record: BloodRequestRecord;
  recipientName: string;
  onClose: () => void;
  onDelete: () => Promise<void>;
};

const recordTitle = (record: BloodRequestRecord) =>
  record.kind === 'individual-selection-direction'
    ? 'направление на индивидуальный подбор'
    : 'заявка в трансфузиологический кабинет';

export const BloodRequestRecordDeleteModal = ({
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
        deleteError instanceof Error
          ? deleteError.message
          : 'Не удалось удалить сохранённый бланк.',
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      title="Удалить сохранённый бланк?"
      onClose={onClose}
      className={styles.modal}
    >
      <div className={styles.text}>
        Будет удалено {recordTitle(record)} реципиента{' '}
        <strong>{recipientName}</strong>.
      </div>
      <div className={styles.warning}>
        Отменить это действие после удаления будет нельзя.
      </div>
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
