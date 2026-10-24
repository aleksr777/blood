import { AnimatedReveal } from '../animated-reveal/animated-reveal';
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

  const visible = Boolean(message) && (!dismissible || dismissedMessage !== message);

  return (
    <AnimatedReveal open={visible} contentKey={message}>
      <div
        className={`${danger ? ui.dangerNotice : ui.warningNotice} ${styles.notice} ${className}`}
        role="alert"
      >
        <div className={styles.message}>
          {message.split('\n\n').map((paragraph, index) => {
            const lines = paragraph.split('\n');
            return lines.every((line) => line.startsWith('• ')) ? (
              <ul key={index} className={styles.list}>
                {lines.map((line, lineIndex) => (
                  <li key={lineIndex}>{line.slice(2)}</li>
                ))}
              </ul>
            ) : (
              <p key={index} className={index === 0 ? styles.title : undefined}>
                {paragraph}
              </p>
            );
          })}
        </div>
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
    </AnimatedReveal>
  );
};
