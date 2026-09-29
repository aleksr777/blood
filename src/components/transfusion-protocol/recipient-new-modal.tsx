import { useState } from 'react';
import { searchRecipients } from '../../storage/repositories/recipients';
import Modal, { ModalDismissButton } from '../modal/modal';
import styles from './recipient-field.module.css';

type Props = {
  onClose: () => void;
  onCreate: (fullName: string) => void;
};

const normalize = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU');

export const RecipientNewModal = ({ onClose, onCreate }: Props) => {
  const [fullName, setFullName] = useState('');
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
      if (matches.some((item) => normalize(item.fullName) === normalize(value))) {
        setError('Реципиент с таким ФИО уже существует. Используйте поиск.');
        return;
      }
      onCreate(value);
      onClose();
    } catch (checkError) {
      console.error('Не удалось проверить реципиента:', checkError);
      setError('Не удалось проверить ФИО в базе.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Modal title="Новый реципиент" onClose={onClose} className={styles.newModal}>
      <label className={styles.newField}>
        <span>Фамилия, имя, отчество</span>
        <input
          autoFocus
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void create();
            }
          }}
        />
      </label>
      <div className={styles.hint}>
        Новый реципиент будет записан в базу при сохранении или печати бланка.
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.footer}>
        <ModalDismissButton className={styles.secondary}>Отмена</ModalDismissButton>
        <button type="button" className={styles.primary} disabled={checking} onClick={() => void create()}>
          {checking ? 'Проверка...' : 'Создать'}
        </button>
      </div>
    </Modal>
  );
};
