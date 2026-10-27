import { AnimatedReveal } from '../animated-reveal/animated-reveal';
import styles from './recipient-field.module.css';

export const RecipientDuplicateNotice = ({
  count,
  open,
  onView,
}: {
  count: number;
  open: boolean;
  onView: () => void;
}) => (
  <AnimatedReveal open={open} contentKey={count}>
    <div className={styles.duplicateNotice} role="status">
      <div>
        В базе есть {count}{' '}
        {count % 10 === 1 && count % 100 !== 11
          ? 'карточка'
          : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)
            ? 'карточки'
            : 'карточек'}{' '}
        с таким же ФИО.
      </div>
      <button type="button" className={styles.viewMatches} onClick={onView}>
        Посмотреть данные совпадений
      </button>
      <div className={styles.hint}>Можно также создать отдельную карточку.</div>
    </div>
  </AnimatedReveal>
);
