import { useEffect, useState } from 'react';
import Modal from '../modal/modal';
import ui from '../../styles/ui';
import styles from './print-save-prompt.module.css';

type Props = {
  canSave: boolean;
  editing: boolean;
  onSave: () => Promise<boolean>;
};

export const PrintSavePrompt = ({ canSave, editing, onSave }: Props) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!canSave) setOpen(false);
    const afterPrint = () => setOpen(canSave);
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, [canSave]);

  if (!open || !canSave) return null;

  const save = () => {
    setOpen(false);
    void onSave();
  };

  return (
    <Modal title="Сохранение бланка" className={styles.modal} onClose={() => setOpen(false)}>
      <p className={styles.message}>
        {editing
          ? 'В бланке есть несохранённые изменения. Сохранить их?'
          : 'Сохранить бланк в базе реципиентов?'}
      </p>
      <div className={styles.actions}>
        <button type="button" className={ui.successButton} onClick={save}>
          Сохранить
        </button>
        <button type="button" className={ui.dangerButton} onClick={() => setOpen(false)}>
          Не сохранять
        </button>
      </div>
    </Modal>
  );
};
