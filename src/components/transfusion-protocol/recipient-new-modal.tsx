import { useState } from 'react';
import {
  findRecipientsByName,
  type RecipientRecord,
} from '../../storage/repositories/recipients';
import Modal from '../modal/modal';
import { RecipientMatchList } from './recipient-match-list';
import { RecipientNewForm } from './recipient-new-form';
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
  hint = 'Новый реципиент будет сразу добавлен в базу.',
}: Props) => {
  const [fullName, setFullName] = useState('');
  const [matches, setMatches] = useState<RecipientRecord[] | null>(null);
  const [checkedName, setCheckedName] = useState('');
  const [viewing, setViewing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const changeName = (value: string) => {
    setFullName(value);
    setMatches(null);
    setCheckedName('');
    setError('');
  };

  const create = async () => {
    if (checking) return;
    const name = fullName.trim().replace(/\s+/g, ' ');
    if (!name) {
      setError('Введите ФИО реципиента.');
      return;
    }
    setChecking(true);
    setError('');
    try {
      if (checkedName !== normalize(name)) {
        const candidates = await findRecipientsByName(name);
        setMatches(candidates);
        setCheckedName(normalize(name));
        if (candidates.length > 0) return;
      }
      await onCreate(name);
      onClose();
    } catch (cause) {
      console.error('Не удалось создать реципиента:', cause);
      setError(cause instanceof Error ? cause.message : 'Не удалось создать реципиента.');
    } finally {
      setChecking(false);
    }
  };

  const useExisting = async (recipient: RecipientRecord) => {
    if (checking) return;
    setChecking(true);
    setError('');
    try {
      await onExisting(recipient);
      onClose();
    } catch (cause) {
      console.error('Не удалось использовать реципиента:', cause);
      setError('Не удалось использовать выбранного реципиента.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Modal title="Новый реципиент" onClose={onClose} className={styles.newModal}>
      {viewing && matches?.length ? (
        <RecipientMatchList
          matches={matches}
          busy={checking}
          actionLabel={existingActionLabel}
          onBack={() => setViewing(false)}
          onUse={(recipient) => void useExisting(recipient)}
        />
      ) : (
        <RecipientNewForm
          fullName={fullName}
          hint={hint}
          matchesCount={matches?.length ?? 0}
          checked={checkedName === normalize(fullName)}
          checking={checking}
          onNameChange={changeName}
          onCreate={() => void create()}
          onView={() => setViewing(true)}
        />
      )}
      {error && <div className={styles.error} role="alert">{error}</div>}
    </Modal>
  );
};
