import ui from '../../styles/ui';
import type { SavedDocumentControls } from './use-document-state';
import styles from './saved-document-bar.module.css';

export const SavedDocumentBar = ({ document }: { document: SavedDocumentControls }) => {
  if (!document.record) return null;
  const editing = document.mode === 'edit';
  return (
    <div className={`${ui.infoNotice} ${styles.bar}`} aria-label="Режим сохранённого бланка">
      <strong>
        {editing ? 'Редактирование сохранённого бланка' : 'Просмотр сохранённого бланка'}
        {' · № '}
        {document.record.id}
      </strong>
      <div className={styles.actions}>
        {editing ? (
          <button type="button" className={ui.secondaryButton} onClick={document.cancel}>
            Отменить изменения
          </button>
        ) : (
          <button type="button" className={ui.primaryButton} onClick={document.edit}>
            Редактировать
          </button>
        )}
        <button type="button" className={ui.textButton} onClick={document.close}>
          {editing ? 'Закрыть без сохранения' : 'Вернуться к текущему бланку'}
        </button>
      </div>
    </div>
  );
};
