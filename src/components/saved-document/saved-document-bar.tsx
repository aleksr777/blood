import ui from '../../styles/ui';
import type { SavedDocumentControls } from './use-document-state';
import styles from './saved-document-bar.module.css';

export const SavedDocumentBar = ({
  document,
  title,
}: {
  document: SavedDocumentControls;
  title: string;
}) => {
  if (!document.record) return null;
  const editing = document.mode === 'edit';
  return (
    <div
      className={`${ui.infoNotice} ${styles.bar}`}
      aria-label={`${editing ? 'Редактирование' : 'Просмотр'}: ${title}`}
    >
      <strong>{title}</strong>
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
        <button type="button" className={ui.secondaryButton} onClick={document.close}>
          {editing ? 'Закрыть без сохранения' : 'Вернуться к текущему бланку'}
        </button>
      </div>
    </div>
  );
};
