import { useEffect, useState } from 'react';
import ui from '../../styles/ui';
import styles from './warning-notice.module.css';

type Props = {
  message: string;
  className?: string;
  danger?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
};

export const WarningNotice = ({
  message,
  className = '',
  danger = false,
  dismissible = true,
  onDismiss,
}: Props) => {
  const [dismissedMessage, setDismissedMessage] = useState('');

  useEffect(() => setDismissedMessage(''), [message]);

  if (!message || (dismissible && dismissedMessage === message)) return null;

  return (
    <div
      className={`${danger ? ui.dangerNotice : ui.warningNotice} ${styles.notice} ${className}`}
      role="alert"
    >
      <span className={styles.message}>{message}</span>
      {dismissible && (
        <button
          type="button"
          className={styles.dismiss}
          aria-label="Закрыть предупреждение"
          onClick={() => {
            setDismissedMessage(message);
            onDismiss?.();
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};
