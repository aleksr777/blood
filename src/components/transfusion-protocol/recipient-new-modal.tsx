import { AnimatedMessage } from '../animated-reveal/animated-message';
import { useState } from 'react';
import { findRecipientsByName, type RecipientRecord } from '../../storage/repositories/recipients';
import Modal from '../modal/modal';
import { RecipientMatchList } from './recipient-match-list';
import { RecipientDataForm } from './recipient-data-form';
import { RecipientDuplicateNotice } from './recipient-duplicate-notice';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-edit-modal.module.css';

type Props = {
  onClose: () => void;
  onCreate: (fullName: string, values: ProtocolValues) => void | Promise<void>;
  onExisting: (recipient: RecipientRecord) => void | Promise<void>;
  existingActionLabel?: string;
};

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU');

export const RecipientNewModal = ({
  onClose,
  onCreate,
  onExisting,
  existingActionLabel = 'Использовать реципиента',
}: Props) => {
  const [values, setValues] = useState<ProtocolValues>({});
  const fullName = values.recipientName ?? '';
  const [matches, setMatches] = useState<RecipientRecord[] | null>(null);
  const [checkedName, setCheckedName] = useState('');
  const [viewing, setViewing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const changeValues = (changes: ProtocolValues) => {
    setValues((current) => ({ ...current, ...changes }));
    if ('recipientName' in changes) {
      setMatches(null);
      setCheckedName('');
      setError('');
    }
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
      await onCreate(name, { ...values, recipientName: name });
      onClose();
    } catch (cause) {
      console.error('Не удалось создать реципиента:', cause);
      setError(cause instanceof Error ? cause.message : 'Не удалось создать реципиента.');
    } finally {
      setChecking(false);
    }
  };

  const selectExisting = async (recipient: RecipientRecord) => {
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
    <Modal
      title="Новый реципиент"
      onClose={onClose}
      className={styles.modal}
      dismissible={!checking}
    >
      {viewing && matches?.length ? (
        <>
          <RecipientMatchList
            matches={matches}
            busy={checking}
            actionLabel={existingActionLabel}
            onBack={() => setViewing(false)}
            onUse={(recipient) => void selectExisting(recipient)}
          />
          <AnimatedMessage message={error} className={styles.error} role="alert" />
        </>
      ) : (
        <RecipientDataForm
          values={values}
          onChange={changeValues}
          onSubmit={() => void create()}
          busy={checking}
          error={error}
          submitLabel="Создать"
          pendingLabel="Создание..."
        >
          <RecipientDuplicateNotice
            count={matches?.length ?? 0}
            open={checkedName === normalize(fullName) && Boolean(matches?.length)}
            onView={() => setViewing(true)}
          />
        </RecipientDataForm>
      )}
    </Modal>
  );
};
