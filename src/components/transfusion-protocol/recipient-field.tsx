import { useState } from 'react';
import type { RecipientRecord } from '../../storage/repositories/recipients';
import { RecipientNewModal } from './recipient-new-modal';
import { RecipientSelectModal } from './recipient-select-modal';
import { recipientValues } from './recipient-profile-values';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-field.module.css';

type Props = {
  value: string;
  onChange: (values: ProtocolValues) => void;
};

export const RecipientField = ({ value, onChange }: Props) => {
  const [mode, setMode] = useState<'search' | 'new' | null>(null);

  const select = (recipient: RecipientRecord) => {
    onChange(recipientValues(recipient.fullName, recipient));
  };

  const create = (fullName: string) => {
    onChange(recipientValues(fullName));
  };

  return (
    <>
      <div className={styles.control}>
        <div className={value ? styles.value : styles.placeholder}>
          {value || 'Реципиент не выбран'}
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => setMode('search')}>
            Найти
          </button>
          <button type="button" className={styles.primary} onClick={() => setMode('new')}>
            Новый
          </button>
        </div>
      </div>

      {mode === 'search' && (
        <RecipientSelectModal onClose={() => setMode(null)} onSelect={select} />
      )}
      {mode === 'new' && (
        <RecipientNewModal onClose={() => setMode(null)} onCreate={create} />
      )}
    </>
  );
};
