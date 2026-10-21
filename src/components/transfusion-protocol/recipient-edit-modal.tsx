import { useState } from 'react';
import type { RecipientRecord } from '../../storage/repositories/recipients';
import Modal, { ModalDismissButton } from '../modal/modal';
import { formatRecipientAge } from './recipient-demographics';
import { RecipientExaminationFields } from './recipient-examination-fields';
import { RecipientHistoryFields } from './recipient-history-fields';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-edit-modal.module.css';

type Props = {
  recipient: RecipientRecord;
  onClose: () => void;
  onSave: (values: ProtocolValues) => Promise<void>;
};

export const RecipientEditModal = ({ recipient, onClose, onSave }: Props) => {
  const [values, setValues] = useState<ProtocolValues>(() => ({
    ...recipient.profile,
    recipientName: recipient.fullName,
  }));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const change = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const changeValues = (nextValues: ProtocolValues) =>
    setValues((current) => ({ ...current, ...nextValues }));

  const save = async () => {
    setError('');
    setSaving(true);
    try {
      await onSave(values);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить данные.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Редактирование реципиента" onClose={onClose} className={styles.modal}>
      <div className={styles.grid}>
        <label className={styles.wide}>
          <span>Фамилия, имя, отчество</span>
          <input
            value={values.recipientName ?? ''}
            onChange={(event) => change('recipientName', event.target.value)}
          />
        </label>
        <label>
          <span>Дата рождения</span>
          <input
            type="date"
            value={values.recipientBirthDate ?? ''}
            onChange={(event) => change('recipientBirthDate', event.target.value)}
          />
        </label>
        <label>
          <span>Пол</span>
          <select
            value={values.recipientSex ?? ''}
            onChange={(event) => change('recipientSex', event.target.value)}
          >
            <option value="">Не указано</option>
            <option value="Мужской">Мужской</option>
            <option value="Женский">Женский</option>
          </select>
        </label>
        <label>
          <span>Возраст</span>
          <input type="text" value={formatRecipientAge(values.recipientBirthDate)} readOnly />
        </label>
        <div className={styles.wide}>
          <RecipientExaminationFields values={values} onChange={changeValues} />
        </div>
        <div className={styles.wide}>
          <RecipientHistoryFields values={values} onChange={changeValues} />
        </div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.actions}>
        <ModalDismissButton className={styles.secondary}>Отмена</ModalDismissButton>
        <button
          type="button"
          className={styles.primary}
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </Modal>
  );
};
