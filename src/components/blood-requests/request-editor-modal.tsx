import { useEffect, useState } from 'react';
import Modal from '../modal/modal';
import styles from './request-editor-modal.module.css';

export type RequestEditorField = {
  name: string;
  label: string;
  type?: 'text' | 'date' | 'datetime-local' | 'textarea' | 'select';
  options?: Array<{ value: string; label: string }>;
  wide?: boolean;
};

type Props = {
  title: string;
  fields: RequestEditorField[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  onClose: () => void;
};

export const RequestEditorModal = ({
  title,
  fields,
  values,
  onChange,
  onClose,
}: Props) => {
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map(({ name }) => [name, values[name] ?? ''])),
  );

  useEffect(() => {
    setDraft(Object.fromEntries(fields.map(({ name }) => [name, values[name] ?? ''])));
  }, [fields, values]);

  const changeValue = (name: string, value: string) => {
    setDraft((current) => ({ ...current, [name]: value }));
    onChange({ [name]: value });
  };

  return (
    <Modal title={title} onClose={onClose} className={styles.modal}>
      <div className={styles.grid}>
        {fields.map((field) => (
          <label
            key={field.name}
            className={field.wide ? styles.wide : undefined}
          >
            <span>{field.label}</span>
            {field.type === 'textarea' ? (
              <textarea
                value={draft[field.name] ?? ''}
                onChange={(event) => changeValue(field.name, event.target.value)}
              />
            ) : field.type === 'select' ? (
              <select
                value={draft[field.name] ?? ''}
                onChange={(event) => changeValue(field.name, event.target.value)}
              >
                <option value="">Не выбрано</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type ?? 'text'}
                value={draft[field.name] ?? ''}
                onChange={(event) => changeValue(field.name, event.target.value)}
              />
            )}
          </label>
        ))}
      </div>
    </Modal>
  );
};
