import { useState } from 'react';
import type { RecipientRecord } from '../../storage/repositories/recipients';
import Modal, { ModalDismissButton } from '../modal/modal';
import { CustomSelectField } from './custom-select-field';
import type { ProtocolValues } from './protocol-types';
import styles from './recipient-edit-modal.module.css';

type Props = {
  recipient: RecipientRecord;
  onClose: () => void;
  onSave: (values: ProtocolValues) => Promise<void>;
};

const textFields = [
  ['recipientAntigens', 'Антигены C, c, E, e, K'],
  ['alloimmuneAntibodies', 'Аллоиммунные антитела'],
] as const;

const textareas = [
  ['previousTransfusions', 'Трансфузии компонентов крови в анамнезе'],
  ['previousReactions', 'Реакции и осложнения на трансфузии в анамнезе'],
  ['individualSelectionHistory', 'Трансфузии по индивидуальному подбору'],
] as const;

export const RecipientEditModal = ({ recipient, onClose, onSave }: Props) => {
  const [values, setValues] = useState<ProtocolValues>(() => ({
    ...recipient.profile,
    recipientName: recipient.fullName,
  }));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const change = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));

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
        <div>
          <div className={styles.label}>Группа крови AB0</div>
          <CustomSelectField
            name="recipientAbo"
            label="Группа крови AB0"
            options={['O(I)', 'A(II)', 'B(III)', 'AB(IV)']}
            value={values.recipientAbo ?? ''}
            onChange={(value) => change('recipientAbo', value)}
          />
        </div>
        <div>
          <div className={styles.label}>Резус-принадлежность</div>
          <CustomSelectField
            name="recipientRh"
            label="Резус-принадлежность"
            options={['Rh(D)+', 'Rh(D)-']}
            value={values.recipientRh ?? ''}
            onChange={(value) => change('recipientRh', value)}
          />
        </div>
        {textFields.map(([name, label]) => (
          <label key={name} className={styles.wide}>
            <span>{label}</span>
            <input value={values[name] ?? ''} onChange={(event) => change(name, event.target.value)} />
          </label>
        ))}
        {textareas.map(([name, label]) => (
          <label key={name} className={styles.wide}>
            <span>{label}</span>
            <textarea
              rows={3}
              value={values[name] ?? ''}
              onChange={(event) => change(name, event.target.value)}
            />
          </label>
        ))}
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.actions}>
        <ModalDismissButton className={styles.secondary}>Отмена</ModalDismissButton>
        <button type="button" className={styles.primary} disabled={saving} onClick={() => void save()}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </Modal>
  );
};
