import ui from '../../styles/ui';
import { useState } from 'react';
import {
  createRecipient,
  getRecipientById,
  updateRecipient,
  type RecipientRecord,
} from '../../storage/repositories/recipients';
import { runRecipientOperation } from '../../storage/repositories/recipient-operation-queue';
import { FormInput } from '../form-input/form-input';
import { RecipientEditModal } from './recipient-edit-modal';
import { RecipientNewModal } from './recipient-new-modal';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-field.module.css';

type Props = {
  value: string;
  recipientId?: string;
  onChange: (value: string) => void;
  onSelectRecipient: (recipient: RecipientRecord) => void | boolean | Promise<void | boolean>;
  onOpenRecipients: () => void;
};

export const RecipientField = ({
  value,
  recipientId,
  onChange,
  onSelectRecipient,
  onOpenRecipients,
}: Props) => {
  const [newRecipientOpen, setNewRecipientOpen] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<RecipientRecord | null>(null);
  const [loadingRecipient, setLoadingRecipient] = useState(false);
  const [error, setError] = useState('');
  const selectedId = Number(recipientId);
  const hasSelectedRecipient = Number.isInteger(selectedId) && selectedId > 0;

  const select = async (recipient: RecipientRecord) => {
    if ((await onSelectRecipient(recipient)) === false) {
      throw new Error('Не удалось выбрать реципиента. Повторите действие.');
    }
  };

  const create = async (fullName: string, values: ProtocolValues) => {
    const created = await createRecipient(fullName, values);
    await select(created);
  };

  const openSelectedRecipient = async () => {
    if (!hasSelectedRecipient || loadingRecipient) return;
    setError('');
    setLoadingRecipient(true);
    try {
      const recipient = await runRecipientOperation(() => getRecipientById(selectedId));
      if (!recipient) throw new Error('Карточка реципиента не найдена. Выберите пациента заново.');
      setEditingRecipient(recipient);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось открыть карточку.');
    } finally {
      setLoadingRecipient(false);
    }
  };

  const saveSelectedRecipient = async (values: ProtocolValues) => {
    if (!editingRecipient) return;
    const updated = await runRecipientOperation(() => updateRecipient(editingRecipient.id, values));
    await select(updated);
  };

  return (
    <>
      <div className={styles.control}>
        <FormInput
          name="recipientName"
          aria-label="Фамилия, имя, отчество реципиента"
          value={value}
          placeholder="Фамилия, имя, отчество реципиента"
          onChange={(event) => onChange(event.target.value)}
        />
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            disabled={loadingRecipient}
            onClick={() => {
              if (hasSelectedRecipient) void openSelectedRecipient();
              else setNewRecipientOpen(true);
            }}
          >
            {hasSelectedRecipient ? 'Данные реципиента' : 'Новый реципиент'}
          </button>
          <button
            type="button"
            className={`${ui.secondaryButton} ${ui.toolbarButton} secondary-button`}
            onClick={onOpenRecipients}
          >
            Реципиенты
          </button>
        </div>
      </div>
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {newRecipientOpen && (
        <RecipientNewModal
          onClose={() => setNewRecipientOpen(false)}
          onCreate={create}
          onExisting={select}
          existingActionLabel="Использовать данные"
        />
      )}
      {editingRecipient && (
        <RecipientEditModal
          recipient={editingRecipient}
          onClose={() => setEditingRecipient(null)}
          onSave={saveSelectedRecipient}
        />
      )}
    </>
  );
};
