import ui from '../../styles/ui';
import type { SavedDocumentControls } from './use-document-state';
import styles from './saved-document-bar.module.css';

export const SavedDocumentBar = ({
  document,
  title,
  onReturnToList,
}: {
  document: SavedDocumentControls;
  title: string;
  onReturnToList?: () => void;
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
          <button
            type="button"
            className={`${ui.secondaryButton} ${ui.compactButton}`}
            onClick={document.cancel}
          >
            Отменить изменения
          </button>
        ) : (
          <button
            type="button"
            className={`${ui.primaryButton} ${ui.compactButton}`}
            onClick={document.edit}
          >
            Редактировать
          </button>
        )}
        {onReturnToList && (
          <button
            type="button"
            className={`${ui.secondaryButton} ${ui.compactButton}`}
            onClick={onReturnToList}
          >
            <span aria-hidden="true">←</span>К списку бланков
          </button>
        )}
        <button
          type="button"
          className={`${ui.secondaryButton} ${ui.compactButton}`}
          onClick={document.close}
        >
          {!editing && <span aria-hidden="true">←</span>}
          {editing ? 'Закрыть без сохранения' : 'К созданию нового бланка'}
        </button>
      </div>
    </div>
  );
};
