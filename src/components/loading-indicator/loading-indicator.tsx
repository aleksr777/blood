import styles from './loading-indicator.module.css';

type Props = { label: string; compact?: boolean; className?: string };

export const LoadingIndicator = ({ label, compact = false, className = '' }: Props) => (
  <div
    className={[styles.indicator, compact ? styles.compact : '', className]
      .filter(Boolean)
      .join(' ')}
    role="status"
    aria-label={label}
  >
    <span className={styles.dot} aria-hidden="true" />
    <span className={styles.dot} aria-hidden="true" />
    <span className={styles.dot} aria-hidden="true" />
  </div>
);
