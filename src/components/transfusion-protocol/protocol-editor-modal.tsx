import { useState, type ChangeEvent } from 'react';
import Modal, { ModalDismissButton } from '../modal/modal';
import { getProtocolBlockConfig } from './editor-config';
import styles from './protocol-editor.module.css';
import type { ProtocolBlockId, ProtocolFieldConfig, ProtocolValues } from './protocol-types';

type Props = {
  blockId: ProtocolBlockId;
  values: ProtocolValues;
  onSave: (values: ProtocolValues) => void;
  onClose: () => void;
};

const getInitialValues = (blockId: ProtocolBlockId, values: ProtocolValues) => {
  const config = getProtocolBlockConfig(blockId);
  return Object.fromEntries(config.fields.map(({ name }) => [name, values[name] ?? '']));
};

const FieldControl = ({
  field,
  value,
  onChange,
}: {
  field: ProtocolFieldConfig;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
}) => {
  if (field.type === 'textarea') {
    return <textarea name={field.name} value={value} rows={4} onChange={onChange} />;
  }

  if (field.type === 'select') {
    return (
      <select name={field.name} value={value} onChange={onChange}>
        <option value="">Не выбрано</option>
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      name={field.name}
      type={field.type ?? 'text'}
      step={field.step}
      value={value}
      onChange={onChange}
    />
  );
};

export const ProtocolEditorModal = ({ blockId, values, onSave, onClose }: Props) => {
  const config = getProtocolBlockConfig(blockId);
  const [draft, setDraft] = useState<ProtocolValues>(() => getInitialValues(blockId, values));

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  return (
    <Modal title={config.title} onClose={onClose} className={styles[config.size]}>
      <div className={styles.grid}>
        {config.fields.map((field) => (
          <label key={field.name} className={field.wide ? styles.wide : undefined}>
            <span>{field.label}</span>
            <FieldControl field={field} value={draft[field.name] ?? ''} onChange={handleChange} />
          </label>
        ))}
      </div>

      <div className={styles.actions}>
        <ModalDismissButton className={styles.secondary}>Отмена</ModalDismissButton>
        <ModalDismissButton className={styles.primary} onClick={() => onSave(draft)}>
          Сохранить
        </ModalDismissButton>
      </div>
    </Modal>
  );
};
