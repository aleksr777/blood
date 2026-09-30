import { ModalDismissButton } from '../modal/modal';
import styles from './recipient-field.module.css';

type Props = {
  fullName: string;
  hint: string;
  matchesCount: number;
  checked: boolean;
  checking: boolean;
  onNameChange: (value: string) => void;
  onCreate: () => void;
  onView: () => void;
};

export const RecipientNewForm = ({
  fullName,
  hint,
  matchesCount,
  checked,
  checking,
  onNameChange,
  onCreate,
  onView,
}: Props) => (
  <>
    <label className={styles.newField}>
      <span>Фамилия, имя, отчество</span>
      <input
        autoFocus
        value={fullName}
        onChange={(event) => onNameChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onCreate();
          }
        }}
      />
    </label>
    <div className={styles.hint}>{hint}</div>
    {checked && matchesCount > 0 && (
      <div className={styles.duplicateNotice} role="status">
        <div>В базе есть {matchesCount} карточек с таким же ФИО.</div>
        <button type="button" className={styles.viewMatches} onClick={onView}>
          Посмотреть данные совпадений
        </button>
        <div className={styles.hint}>Можно также создать отдельную карточку.</div>
      </div>
    )}
    <div className={styles.footer}>
      <ModalDismissButton className={styles.secondary}>Отмена</ModalDismissButton>
      <button type="button" className={styles.primary} disabled={checking} onClick={onCreate}>
        {checking ? 'Проверка...' : checked && matchesCount ? 'Создать нового' : 'Создать'}
      </button>
    </div>
  </>
);
