import { useState } from 'react';
import {
  createRecipient,
  type RecipientRecord,
} from '../../storage/repositories/recipients';
import { RecipientNewModal } from './recipient-new-modal';
import { recipientValues } from './recipient-profile-values';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-field.module.css';

type Props = {
  value: string;
  onChange: (values: ProtocolValues) => void;
  onOpenRecipients: () => void;
};

export const RecipientField = ({ value, onChange, onOpenRecipients }: Props) => {
  const [newRecipientOpen, setNewRecipientOpen] = useState(false);

  const select = (recipient: RecipientRecord) => {
    onChange(recipientValues(recipient.fullName, recipient));
  };

  const create = async (fullName: string) => {
    const created = await createRecipient(fullName);
    onChange(recipientValues(created.fullName, created));
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
