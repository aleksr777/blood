import { useState } from 'react';
import {
  searchRecipients,
  type RecipientRecord,
} from '../../storage/repositories/recipients';
import Modal, { ModalDismissButton } from '../modal/modal';
import styles from './recipient-field.module.css';

type Props = {
  onClose: () => void;
  onSelect: (recipient: RecipientRecord) => void;
};

export const RecipientSelectModal = ({ onClose, onSelect }: Props) => {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<RecipientRecord[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    const value = query.trim();
    if (!value) {
      setError('Введите ФИО или его часть.');
      return;
    }
    setError('');
    setSearching(true);
    try {
      setItems(await searchRecipients(value));
      setSearched(true);
    } catch (searchError) {
      console.error('Не удалось найти реципиента:', searchError);
      setError('Не удалось выполнить поиск.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <Modal title="Найти реципиента" onClose={onClose} className={styles.searchModal}>
      <form
        className={styles.searchForm}
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <input
          autoFocus
          value={query}
          placeholder="Введите ФИО"
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit" className={styles.primary} disabled={searching}>
          {searching ? 'Поиск...' : 'Найти'}
        </button>
      </form>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.results}>
        {searched && items.length === 0 && (
          <div className={styles.empty}>Реципиент не найден.</div>
        )}
        {items.map((recipient) => (
          <button
            key={recipient.id}
            type="button"
            className={styles.result}
            onClick={() => {
              onSelect(recipient);
              onClose();
            }}
          >
            <span>{recipient.fullName}</span>
            <small>Сохранённых бланков: {recipient.protocolCount}</small>
          </button>
        ))}
      </div>
      <div className={styles.footer}>
        <ModalDismissButton className={styles.secondary}>Закрыть</ModalDismissButton>
      </div>
    </Modal>
  );
};
