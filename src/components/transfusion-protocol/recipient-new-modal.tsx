import { useState } from 'react';
import {
  searchRecipients,
  type RecipientRecord,
} from '../../storage/repositories/recipients';
import Modal, { ModalDismissButton } from '../modal/modal';
import { RecipientExistingCard } from './recipient-existing-card';
import styles from './recipient-field.module.css';

type Props = {
  onClose: () => void;
  onCreate: (fullName: string) => void | Promise<void>;
  onExisting: (recipient: RecipientRecord) => void | Promise<void>;
  existingActionLabel?: string;
  hint?: string;
};
const normalize = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU');

export const RecipientNewModal = ({
  onClose,
  onCreate,
  onExisting,
  existingActionLabel = 'Использовать реципиента',
  hint = 'Новый реципиент будет записан в базу при сохранении или печати бланка.',
}: Props) => {
  const [fullName, setFullName] = useState('');
  const [existing, setExisting] = useState<RecipientRecord | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const create = async () => {
    const value = fullName.trim().replace(/\s+/g, ' ');
    if (!value) {
      setError('Введите ФИО реципиента.');
      return;
    }

    setChecking(true);
    setError('');
    try {
      const matches = await searchRecipients(value);
      const duplicate = matches.find(
        (item) => normalize(item.fullName) === normalize(value),
      );
      if (duplicate) {
        setExisting(duplicate);
        setExpanded(false);
        return;
      }
      await onCreate(value);
      onClose();
    } catch (checkError) {
      console.error('Не удалось создать реципиента:', checkError);
      setError(
        checkError instanceof Error ? checkError.message : 'Не удалось создать реципиента.',
      );
    } finally {
      setChecking(false);
    }
  };
  const useExisting = async () => {
    if (!existing) return;
    try {
      await onExisting(existing);
      onClose();
    } catch (useError) {
      console.error('Не удалось использовать реципиента:', useError);
      setError('Не удалось использовать найденного реципиента.');
    }
  };

  return (
    <Modal title="Новый реципиент" onClose={onClose} className={styles.newModal}>
      <label className={styles.newField}>
        <span>Фамилия, имя, отчество</span>
        <input
          autoFocus
          value={fullName}
          onChange={(event) => {
            setFullName(event.target.value);
            setExisting(null);
            setExpanded(false);
            setError('');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void create();
            }
          }}
        />
      </label>
      <div className={styles.hint}>{hint}</div>
      {existing && (
        <RecipientExistingCard
          recipient={existing}
          expanded={expanded}
          actionLabel={existingActionLabel}
          onToggle={() => setExpanded((current) => !current)}
          onUse={() => void useExisting()}
        />
      )}
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.footer}>
        <ModalDismissButton className={styles.secondary}>Отмена</ModalDismissButton>
        {!existing && (
          <button
            type="button"
            className={styles.primary}
            disabled={checking}
            onClick={() => void create()}
          >
            {checking ? 'Проверка...' : 'Создать'}
          </button>
        )}
      </div>
    </Modal>
  );
};
