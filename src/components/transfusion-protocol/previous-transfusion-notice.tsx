import { AnimatedReveal } from '../animated-reveal/animated-reveal';
import styles from './recipient-history-fields.module.css';

export const PreviousTransfusionNotice = ({
  open,
  suggestion,
  onAccept,
  onDecline,
}: {
  open: boolean;
  suggestion: string;
  onAccept: () => void;
  onDecline: () => void;
}) => (
  <AnimatedReveal open={open} contentKey={suggestion}>
    <div className={styles.suggestion} role="status">
      <div className={styles.suggestionHeader}>
        <div>
          <div className={styles.suggestionTitle}>Найдены предыдущие трансфузии</div>
          <div className={styles.suggestionHint}>
            Внести сведения из сохранённых протоколов в анамнез реципиента?
          </div>
        </div>
        <div className={styles.suggestionActions}>
          <button type="button" className={styles.suggestionAccept} onClick={onAccept}>
            Внести
          </button>
          <button type="button" className={styles.suggestionDecline} onClick={onDecline}>
            Не вносить
          </button>
        </div>
      </div>
      <div className={styles.suggestionPreview} aria-label="Предварительный просмотр">
        {suggestion}
      </div>
    </div>
  </AnimatedReveal>
);
