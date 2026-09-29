import { useEffect, useState } from 'react';
import {
  createRecipient,
  listProtocolRecords,
  removeRecipient,
  searchRecipients,
  updateRecipient,
  type ProtocolRecord,
  type RecipientRecord,
} from '../../storage/repositories/recipients';
import Modal from '../modal/modal';
import { RecipientDatabaseDialogs } from './recipient-database-dialogs';
import { RecipientHistoryPanel } from './recipient-history-panel';
import { RecipientListPanel } from './recipient-list-panel';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-database.module.css';

type Props = {
  onClose: () => void;
  onOpenRecord: (record: ProtocolRecord) => void;
};

export const RecipientDatabaseModal = ({ onClose, onOpenRecord }: Props) => {
  const [query, setQuery] = useState('');
  const [recipients, setRecipients] = useState<RecipientRecord[]>([]);
  const [selected, setSelected] = useState<RecipientRecord | null>(null);
  const [records, setRecords] = useState<ProtocolRecord[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RecipientRecord | null>(null);
  const [deleting, setDeleting] = useState<RecipientRecord | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void searchRecipients(query)
        .then((items) => {
          if (!active) return;
          setRecipients(items);
          setSelected((current) =>
            current && !items.some(({ id }) => id === current.id) ? null : current,
          );
        })
        .catch((error: unknown) => console.error('Не удалось найти реципиентов:', error))
        .finally(() => active && setLoading(false));
    }, 120);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);
  useEffect(() => {
    if (!selected) {
      setRecords([]);
      return;
    }
    void listProtocolRecords(selected.id)
      .then(setRecords)
      .catch((error: unknown) => console.error('Не удалось загрузить бланки:', error));
  }, [selected]);
  const addRecipient = async (fullName: string) => {
    const created = await createRecipient(fullName);
    setRecipients((current) =>
      [...current, created].sort((left, right) =>
        left.fullName.localeCompare(right.fullName, 'ru'),
      ),
    );
    setSelected(created);
  };
  const openExistingRecipient = (recipient: RecipientRecord) => {
    setQuery(recipient.fullName);
    setSelected(recipient);
  };
  const saveRecipient = async (recipient: RecipientRecord, values: ProtocolValues) => {
    const updated = await updateRecipient(recipient.id, values);
    setRecipients((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelected(updated);
  };

  const deleteRecipient = async (recipient: RecipientRecord) => {
    await removeRecipient(recipient.id);
    setRecipients((current) => current.filter(({ id }) => id !== recipient.id));
    setSelected(null);
    setRecords([]);
  };

  return (
    <Modal title="База реципиентов" onClose={onClose} className={styles.modal}>
      <div className={styles.body}>
        <RecipientListPanel
          query={query}
          loading={loading}
          recipients={recipients}
          selected={selected}
          onQueryChange={setQuery}
          onSelect={setSelected}
          onCreate={() => setCreating(true)}
        />
        <RecipientHistoryPanel
          recipient={selected}
          records={records}
          onOpenRecord={onOpenRecord}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      </div>
      <RecipientDatabaseDialogs
        creating={creating}
        editing={editing}
        deleting={deleting}
        onCloseCreate={() => setCreating(false)}
        onCloseEdit={() => setEditing(null)}
        onCloseDelete={() => setDeleting(null)}
        onCreate={addRecipient}
        onExisting={openExistingRecipient}
        onSave={saveRecipient}
        onDelete={deleteRecipient}
      />
    </Modal>
  );
};
