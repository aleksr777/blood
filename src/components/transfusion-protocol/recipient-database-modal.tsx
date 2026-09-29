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
import { RecipientDeleteModal } from './recipient-delete-modal';
import { RecipientEditModal } from './recipient-edit-modal';
import { RecipientHistoryPanel } from './recipient-history-panel';
import { RecipientListPanel } from './recipient-list-panel';
import { RecipientNewModal } from './recipient-new-modal';
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
      {creating && (
        <RecipientNewModal
          onClose={() => setCreating(false)}
          onCreate={addRecipient}
          hint="Реципиент будет сразу добавлен в базу без создания бланка."
        />
      )}
      {editing && (
        <RecipientEditModal
          recipient={editing}
          onClose={() => setEditing(null)}
          onSave={(values) => saveRecipient(editing, values)}
        />
      )}
      {deleting && (
        <RecipientDeleteModal
          recipient={deleting}
          onClose={() => setDeleting(null)}
          onDelete={() => deleteRecipient(deleting)}
        />
      )}
    </Modal>
  );
};
