import { useEffect, useState } from 'react';
import { rememberDepartment } from '../../storage/repositories/departments';
import { rememberSavedOption } from '../../storage/repositories/saved-options';
import Modal from '../modal/modal';
import { DepartmentField } from '../transfusion-protocol/department-field';
import { SavedOptionsField } from '../transfusion-protocol/saved-options-field';
import styles from './request-editor-modal.module.css';

export type RequestEditorField = {
  name: string;
  label: string;
  type?: 'text' | 'date' | 'datetime-local' | 'textarea' | 'select';
  options?: Array<{ value: string; label: string }>;
  savedOptionsCategory?: string;
  wide?: boolean;
};

type Props = {
  title: string;
  fields: RequestEditorField[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  onClose: () => void;
};

export const RequestEditorModal = ({ title, fields, values, onChange, onClose }: Props) => {
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

  const handleClose = () => {
    fields.forEach((field) => {
      const value = draft[field.name]?.trim();
      if (!value) return;

      if (field.name === 'department') {
        void rememberDepartment(value).catch((error: unknown) => {
          console.error('Не удалось сохранить отделение:', error);
        });
        return;
      }

      if (!field.savedOptionsCategory) return;

      void rememberSavedOption(field.savedOptionsCategory, value).catch((error: unknown) => {
        console.error(`Не удалось сохранить вариант поля ${field.name}:`, error);
      });
    });

    onClose();
  };

  return (
    <Modal title={title} onClose={handleClose} className={styles.modal}>
      <div className={styles.grid}>
        {fields.map((field) => (
          <label key={field.name} className={field.wide ? styles.wide : undefined}>
            <span>{field.label}</span>
            {field.name === 'department' ? (
              <DepartmentField
                value={draft[field.name] ?? ''}
                onChange={(value) => changeValue(field.name, value)}
              />
            ) : field.savedOptionsCategory ? (
              <SavedOptionsField
                name={field.name}
                label={field.label}
                category={field.savedOptionsCategory}
                value={draft[field.name] ?? ''}
                onChange={(value) => changeValue(field.name, value)}
              />
            ) : field.type === 'textarea' ? (
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
