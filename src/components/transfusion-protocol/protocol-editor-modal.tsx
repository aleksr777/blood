import { useState } from 'react';
import Modal from '../modal/modal';
import { DepartmentField } from './department-field';
import { rememberDepartment } from './department-history';
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
  onChange: (name: string, value: string) => void;
}) => {
  if (field.type === 'textarea') {
    return (
      <textarea
        name={field.name}
        value={value}
        rows={4}
        onChange={(event) => onChange(field.name, event.target.value)}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select
        name={field.name}
        value={value}
        onChange={(event) => onChange(field.name, event.target.value)}
      >
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
      onChange={(event) => onChange(field.name, event.target.value)}
    />
  );
};

export const ProtocolEditorModal = ({ blockId, values, onSave, onClose }: Props) => {
  const config = getProtocolBlockConfig(blockId);
  const [draft, setDraft] = useState<ProtocolValues>(() => getInitialValues(blockId, values));

  const changeValue = (name: string, value: string) => {
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const handleClose = () => {
    if (blockId === 'general') rememberDepartment(draft.department ?? '');
    onSave(draft);
    onClose();
  };

  return (
    <Modal title={config.title} onClose={handleClose} className={styles[config.size]}>
      <div className={styles.grid}>
        {config.fields.map((field) => {
          const className = field.wide ? styles.wide : undefined;

          if (field.name === 'department') {
            return (
              <div key={field.name} className={className}>
                <div className={styles.fieldLabel}>{field.label}</div>
                <DepartmentField
                  value={draft[field.name] ?? ''}
                  onChange={(value) => changeValue(field.name, value)}
                />
              </div>
            );
          }

          return (
            <label key={field.name} className={className}>
              <span>{field.label}</span>
              <FieldControl
                field={field}
                value={draft[field.name] ?? ''}
                onChange={changeValue}
              />
            </label>
          );
        })}
      </div>
    </Modal>
  );
};
