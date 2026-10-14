import { useEffect, useState } from 'react';
import {
  createRecipient,
  getRecipientById,
  listProtocolRecords,
  listRegistrationRecords,
  removeProtocolRecord,
  removeRecipient,
  removeRegistrationRecord,
  searchRecipients,
  updateRecipient,
  type ProtocolRecord,
  type RecipientRecord,
  type RegistrationRecord,
} from '../../storage/repositories/recipients';
import Modal from '../modal/modal';
import { RecipientDatabaseDialogs } from './recipient-database-dialogs';
import { RecipientHistoryPanel } from './recipient-history-panel';
import { RecipientListPanel } from './recipient-list-panel';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-database.module.css';

type Props = {
  onClose: () => void;
  onOpenRecord?: (record: ProtocolRecord, recipient: RecipientRecord) => void;
  onOpenRegistrationRecord?: (
    record: RegistrationRecord,
    recipient: RecipientRecord,
  ) => void;
  onUseRecipient?: (recipient: RecipientRecord) => boolean | Promise<boolean>;
  initialRecipientId?: number | null;
  initialRecipientName?: string;
};

export const RecipientDatabaseModal = ({
  onClose,
  onOpenRecord,
  onOpenRegistrationRecord,
  onUseRecipient,
  initialRecipientId = null,
  initialRecipientName = '',
}: Props) => {
  const [query, setQuery] = useState(initialRecipientName);
  const [initializingRecipient, setInitializingRecipient] = useState(Boolean(initialRecipientId));
  const [recipients, setRecipients] = useState<RecipientRecord[]>([]);
  const [selected, setSelected] = useState<RecipientRecord | null>(null);
  const [records, setRecords] = useState<ProtocolRecord[]>([]);
  const [registrationRecords, setRegistrationRecords] = useState<RegistrationRecord[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RecipientRecord | null>(null);
  const [deleting, setDeleting] = useState<RecipientRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<ProtocolRecord | null>(null);
  const [deletingRegistrationRecord, setDeletingRegistrationRecord] =
    useState<RegistrationRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!initialRecipientId) {
      setInitializingRecipient(false);
      return undefined;
    }

    let active = true;
    setLoading(true);

    void getRecipientById(initialRecipientId)
      .then((recipient) => {
        if (!active) return;
        setSelected(recipient);
        setRecipients([recipient]);
        setQuery(recipient.fullName);
      })
      .catch((error: unknown) =>
        console.error('Не удалось открыть текущего реципиента:', error),
      )
      .finally(() => {
        if (!active) return;
        setInitializingRecipient(false);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialRecipientId]);

  useEffect(() => {
    if (initializingRecipient) return undefined;

    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void searchRecipients(query)
        .then((items) => {
          if (!active) return;
          setRecipients(items);
          setSelected((current) =>
            current && items.some(({ id }) => id === current.id) ? current : null,
          );
        })
        .catch((error: unknown) => console.error('Не удалось найти реципиентов:', error))
        .finally(() => active && setLoading(false));
    }, 120);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [initializingRecipient, query]);
  useEffect(() => {
    if (!selected) {
      setRecords([]);
      setRegistrationRecords([]);
      return;
    }

    void Promise.all([
      listProtocolRecords(selected.id),
      listRegistrationRecords(selected.id),
    ])
      .then(([protocolItems, registrationItems]) => {
        setRecords(protocolItems);
        setRegistrationRecords(registrationItems);
      })
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
    setQuery(created.fullName);
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
    setRegistrationRecords([]);
  };

  const deleteRecord = async (record: ProtocolRecord) => {
    await removeProtocolRecord(record.id);
    setRecords((current) => current.filter(({ id }) => id !== record.id));
    setRecipients((current) =>
      current.map((recipient) =>
        recipient.id === record.recipientId
          ? { ...recipient, protocolCount: Math.max(0, recipient.protocolCount - 1) }
          : recipient,
      ),
    );
    setSelected((current) =>
      current?.id === record.recipientId
        ? { ...current, protocolCount: Math.max(0, current.protocolCount - 1) }
        : current,
    );
  };

  const deleteRegistrationRecord = async (record: RegistrationRecord) => {
    await removeRegistrationRecord(record.id);
    setRegistrationRecords((current) => current.filter(({ id }) => id !== record.id));
    setRecipients((current) =>
      current.map((recipient) =>
        recipient.id === record.recipientId
          ? { ...recipient, registrationCount: Math.max(0, recipient.registrationCount - 1) }
          : recipient,
      ),
    );
    setSelected((current) =>
      current?.id === record.recipientId
        ? { ...current, registrationCount: Math.max(0, current.registrationCount - 1) }
        : current,
    );
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
          registrationRecords={registrationRecords}
          onOpenRecord={onOpenRecord}
          onOpenRegistrationRecord={onOpenRegistrationRecord}
          onUseRecipient={
            onUseRecipient
              ? async (recipient) => {
                  const accepted = await onUseRecipient(recipient);
                  if (accepted !== false) onClose();
                  return accepted;
                }
              : undefined
          }
          onEdit={setEditing}
          onDelete={setDeleting}
          onDeleteRecord={setDeletingRecord}
          onDeleteRegistrationRecord={setDeletingRegistrationRecord}
        />
      </div>
      <RecipientDatabaseDialogs
        creating={creating}
        editing={editing}
        deleting={deleting}
        deletingRecord={deletingRecord}
        deletingRegistrationRecord={deletingRegistrationRecord}
        selectedRecipient={selected}
        onCloseCreate={() => setCreating(false)}
        onCloseEdit={() => setEditing(null)}
        onCloseDelete={() => setDeleting(null)}
        onCloseRecordDelete={() => setDeletingRecord(null)}
        onCloseRegistrationRecordDelete={() => setDeletingRegistrationRecord(null)}
        onCreate={addRecipient}
        onExisting={openExistingRecipient}
        onSave={saveRecipient}
        onDelete={deleteRecipient}
        onDeleteRecord={deleteRecord}
        onDeleteRegistrationRecord={deleteRegistrationRecord}
      />
    </Modal>
  );
};
