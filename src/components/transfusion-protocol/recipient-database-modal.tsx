import { useEffect, useState } from 'react';
import { readCurrentRecipient } from '../../storage/repositories/current-recipient';
import { clearDeletedRecipientFromCurrentForms } from '../../storage/repositories/recipient-deletion';
import {
  createRecipient,
  findRecipientsByName,
  getRecipientById,
  listBloodRequestRecords,
  listProtocolRecords,
  listRegistrationRecords,
  removeBloodRequestRecord,
  removeProtocolRecord,
  removeRecipient,
  removeRegistrationRecord,
  searchRecipients,
  updateRecipient,
  type BloodRequestRecord,
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
  onOpenIndividualSelectionDirectionRecord?: (
    record: BloodRequestRecord,
    recipient: RecipientRecord,
  ) => void;
  onOpenComponentRequestRecord?: (
    record: BloodRequestRecord,
    recipient: RecipientRecord,
  ) => void;
  onUseRecipient?: (recipient: RecipientRecord) => boolean | Promise<boolean>;
  onRecipientDeleted?: (recipientId: number) => void | Promise<void>;
  initialRecipientId?: number | null;
  initialRecipientName?: string;
};

export const RecipientDatabaseModal = ({
  onClose,
  onOpenRecord,
  onOpenRegistrationRecord,
  onOpenIndividualSelectionDirectionRecord,
  onOpenComponentRequestRecord,
  onUseRecipient,
  onRecipientDeleted,
  initialRecipientId = null,
  initialRecipientName = '',
}: Props) => {
  const [initialRecipient] = useState(() => {
    const currentRecipient = readCurrentRecipient();
    const requestedRecipientId =
      typeof initialRecipientId === 'number' &&
      Number.isFinite(initialRecipientId) &&
      initialRecipientId > 0
        ? initialRecipientId
        : null;
    const id = requestedRecipientId ?? currentRecipient?.id ?? null;
    const name =
      initialRecipientName.trim() ||
      (currentRecipient?.id === id ? currentRecipient.fullName : '');

    return { id, name };
  });
  const [query, setQuery] = useState('');
  const [initializingRecipient, setInitializingRecipient] = useState(
    Boolean(initialRecipient.id || initialRecipient.name),
  );
  const [recipients, setRecipients] = useState<RecipientRecord[]>([]);
  const [selected, setSelected] = useState<RecipientRecord | null>(null);
  const [records, setRecords] = useState<ProtocolRecord[]>([]);
  const [registrationRecords, setRegistrationRecords] = useState<RegistrationRecord[]>([]);
  const [individualSelectionDirectionRecords, setIndividualSelectionDirectionRecords] =
    useState<BloodRequestRecord[]>([]);
  const [componentRequestRecords, setComponentRequestRecords] =
    useState<BloodRequestRecord[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RecipientRecord | null>(null);
  const [deleting, setDeleting] = useState<RecipientRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<ProtocolRecord | null>(null);
  const [deletingRegistrationRecord, setDeletingRegistrationRecord] =
    useState<RegistrationRecord | null>(null);
  const [deletingBloodRequestRecord, setDeletingBloodRequestRecord] =
    useState<BloodRequestRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!initialRecipient.id && !initialRecipient.name) {
      setInitializingRecipient(false);
      return undefined;
    }

    let active = true;
    setLoading(true);

    const loadInitialRecipient = async () => {
      if (initialRecipient.id) {
        const recipient = await getRecipientById(initialRecipient.id);
        return { recipient, items: [recipient] };
      }

      const matches = await findRecipientsByName(initialRecipient.name);
      return {
        recipient: matches.length === 1 ? matches[0] : null,
        items: matches,
      };
    };

    void loadInitialRecipient()
      .then(({ recipient, items }) => {
        if (!active) return;
        setRecipients(items);
        setSelected(recipient);
        setQuery('');
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
  }, [initialRecipient.id, initialRecipient.name]);

  useEffect(() => {
    if (initializingRecipient) return undefined;

    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void searchRecipients(query)
        .then((items) => {
          if (!active) return;
          setRecipients(items);
          setSelected((current) => {
            const currentMatch = current
              ? items.find(({ id }) => id === current.id)
              : undefined;
            if (currentMatch) return currentMatch;

            const initialMatch = initialRecipient.id
              ? items.find(({ id }) => id === initialRecipient.id)
              : undefined;
            if (initialMatch) return initialMatch;

            if (!initialRecipient.id && initialRecipient.name) {
              const normalizedInitialName = initialRecipient.name
                .trim()
                .replace(/\s+/g, ' ')
                .toLocaleLowerCase('ru-RU');
              const exactMatches = items.filter(
                ({ fullName }) =>
                  fullName
                    .trim()
                    .replace(/\s+/g, ' ')
                    .toLocaleLowerCase('ru-RU') === normalizedInitialName,
              );
              if (exactMatches.length === 1) return exactMatches[0];
            }

            return null;
          });
        })
        .catch((error: unknown) => console.error('Не удалось найти реципиентов:', error))
        .finally(() => active && setLoading(false));
    }, 120);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [initialRecipient.id, initialRecipient.name, initializingRecipient, query]);
  useEffect(() => {
    if (!selected) {
      setRecords([]);
      setRegistrationRecords([]);
      setIndividualSelectionDirectionRecords([]);
      setComponentRequestRecords([]);
      return;
    }

    void Promise.all([
      listProtocolRecords(selected.id),
      listRegistrationRecords(selected.id),
      listBloodRequestRecords(selected.id, 'individual-selection-direction'),
      listBloodRequestRecords(selected.id, 'component-request'),
    ])
      .then(([
        protocolItems,
        registrationItems,
        directionItems,
        componentRequestItems,
      ]) => {
        setRecords(protocolItems);
        setRegistrationRecords(registrationItems);
        setIndividualSelectionDirectionRecords(directionItems);
        setComponentRequestRecords(componentRequestItems);
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
    setQuery('');

    if (onUseRecipient) {
      await onUseRecipient(created);
    }
  };
  const openExistingRecipient = (recipient: RecipientRecord) => {
    setQuery('');
    setSelected(recipient);
  };
  const saveRecipient = async (recipient: RecipientRecord, values: ProtocolValues) => {
    const updated = await updateRecipient(recipient.id, values);
    setRecipients((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelected(updated);

    if (readCurrentRecipient()?.id === updated.id && onUseRecipient) {
      await onUseRecipient(updated);
    }
  };

  const deleteRecipient = async (recipient: RecipientRecord) => {
    await removeRecipient(recipient.id);
    await clearDeletedRecipientFromCurrentForms(recipient.id);
    await onRecipientDeleted?.(recipient.id);

    setRecipients((current) => current.filter(({ id }) => id !== recipient.id));
    setSelected(null);
    setRecords([]);
    setRegistrationRecords([]);
    setIndividualSelectionDirectionRecords([]);
    setComponentRequestRecords([]);
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

  const deleteBloodRequestRecord = async (record: BloodRequestRecord) => {
    await removeBloodRequestRecord(record.id);

    if (record.kind === 'individual-selection-direction') {
      setIndividualSelectionDirectionRecords((current) =>
        current.filter(({ id }) => id !== record.id),
      );
    } else {
      setComponentRequestRecords((current) =>
        current.filter(({ id }) => id !== record.id),
      );
    }

    const countField =
      record.kind === 'individual-selection-direction'
        ? 'individualSelectionDirectionCount'
        : 'componentRequestCount';

    setRecipients((current) =>
      current.map((recipient) =>
        recipient.id === record.recipientId
          ? {
              ...recipient,
              [countField]: Math.max(0, recipient[countField] - 1),
            }
          : recipient,
      ),
    );
    setSelected((current) =>
      current?.id === record.recipientId
        ? {
            ...current,
            [countField]: Math.max(0, current[countField] - 1),
          }
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
          currentRecipientId={readCurrentRecipient()?.id ?? null}
          records={records}
          registrationRecords={registrationRecords}
          individualSelectionDirectionRecords={individualSelectionDirectionRecords}
          componentRequestRecords={componentRequestRecords}
          onOpenRecord={onOpenRecord}
          onOpenRegistrationRecord={onOpenRegistrationRecord}
          onOpenIndividualSelectionDirectionRecord={
            onOpenIndividualSelectionDirectionRecord
          }
          onOpenComponentRequestRecord={onOpenComponentRequestRecord}
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
          onDeleteBloodRequestRecord={setDeletingBloodRequestRecord}
        />
      </div>
      <RecipientDatabaseDialogs
        creating={creating}
        editing={editing}
        deleting={deleting}
        deletingRecord={deletingRecord}
        deletingRegistrationRecord={deletingRegistrationRecord}
        deletingBloodRequestRecord={deletingBloodRequestRecord}
        selectedRecipient={selected}
        onCloseCreate={() => setCreating(false)}
        onCloseEdit={() => setEditing(null)}
        onCloseDelete={() => setDeleting(null)}
        onCloseRecordDelete={() => setDeletingRecord(null)}
        onCloseRegistrationRecordDelete={() => setDeletingRegistrationRecord(null)}
        onCloseBloodRequestRecordDelete={() => setDeletingBloodRequestRecord(null)}
        onCreate={addRecipient}
        onExisting={openExistingRecipient}
        onSave={saveRecipient}
        onDelete={deleteRecipient}
        onDeleteRecord={deleteRecord}
        onDeleteRegistrationRecord={deleteRegistrationRecord}
        onDeleteBloodRequestRecord={deleteBloodRequestRecord}
      />
    </Modal>
  );
};
