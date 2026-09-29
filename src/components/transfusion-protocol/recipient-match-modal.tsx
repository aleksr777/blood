import Modal from '../modal/modal';
import { formatDate } from './protocol-types';
import type { RecipientRecord } from '../../storage/repositories/recipients';
import styles from './recipient-match-modal.module.css';

type Props = {
  recipient: RecipientRecord;
  onApply: () => void;
  onDismiss: () => void;
};

export const RecipientMatchModal = ({ recipient, onApply, onDismiss }: Props) => (
  <Modal title="Реципиент найден" onClose={onDismiss} className={styles.modal}>
    <div className={styles.text}>
      В базе уже есть <strong>{recipient.fullName}</strong>, дата рождения{' '}
      <strong>{formatDate(recipient.birthDate)}</strong>.
    </div>
    <div className={styles.meta}>
      Сохранённых бланков: {recipient.protocolCount}. Подставить сохранённые данные
      реципиента в текущий бланк?
    </div>
    <div className={styles.actions}>
      <button type="button" className={styles.secondary} onClick={onDismiss}>
        Оставить текущие
      </button>
      <button type="button" className={styles.primary} onClick={onApply}>
        Заполнить данными
      </button>
    </div>
  </Modal>
);
