import { useState } from 'react';
import {
  createRecipient,
  type RecipientRecord,
} from '../../storage/repositories/recipients';
import { RecipientNewModal } from './recipient-new-modal';
import styles from './recipient-field.module.css';

type Props = {
  value: string;
  onSelectRecipient: (recipient: RecipientRecord) => void | Promise<void>;
  onOpenRecipients: () => void;
};

export const RecipientField = ({ value, onSelectRecipient, onOpenRecipients }: Props) => {
  const [newRecipientOpen, setNewRecipientOpen] = useState(false);

  const select = async (recipient: RecipientRecord) => {
    await onSelectRecipient(recipient);
  };

  const create = async (fullName: string) => {
    const created = await createRecipient(fullName);
    await onSelectRecipient(created);
  };

  return (
    <>
      <div className={styles.control}>
        <div className={value ? styles.value : styles.placeholder}>
          {value || 'Реципиент не выбран'}
        </div>
        <div className={styles.actions}>
          <button type="button" className="secondary-button" onClick={onOpenRecipients}>
            Реципиенты
          </button>
          <button type="button" className={styles.primary} onClick={() => setNewRecipientOpen(true)}>
            Новый
          </button>
        </div>
      </div>

      {newRecipientOpen && (
        <RecipientNewModal
          onClose={() => setNewRecipientOpen(false)}
          onCreate={create}
          onExisting={select}
          existingActionLabel="Использовать данные"
        />
      )}
    </>
  );
};
