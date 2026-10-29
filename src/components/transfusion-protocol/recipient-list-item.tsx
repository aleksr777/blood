import { AnimatedReveal } from '../animated-reveal/animated-reveal';
import type { RecipientRecord } from '../../storage/repositories/recipients';
import styles from './recipient-database.module.css';

type Props = {
  recipient: RecipientRecord;
  selected: boolean;
  current: boolean;
  onSelect: (recipient: RecipientRecord) => void;
  onUseRecipient?: (recipient: RecipientRecord) => boolean | Promise<boolean>;
  onDisconnectRecipient?: (recipient: RecipientRecord) => void | Promise<void>;
};

export const RecipientListItem = ({
  recipient,
  selected,
  current,
  onSelect,
  onUseRecipient,
  onDisconnectRecipient,
}: Props) => {
  const onAction = current ? onDisconnectRecipient : onUseRecipient;

  return (
    <div className={styles.person} data-recipient-id={recipient.id} data-selected={selected}>
      <button
        type="button"
        className={styles.personSelect}
        aria-pressed={selected}
        onClick={() => onSelect(recipient)}
      >
        <span className={styles.personName}>{recipient.fullName}</span>
        <span className={styles.meta}>
          Карточка № {recipient.id} · протоколов: {recipient.protocolCount} · листов регистрации:{' '}
          {recipient.registrationCount} · направлений: {recipient.individualSelectionDirectionCount}{' '}
          · заявок: {recipient.componentRequestCount}
        </span>
      </button>
      {onAction && (
        <AnimatedReveal open={selected}>
          <div className={styles.personActions}>
            <button
              type="button"
              className={current ? styles.cancelSelection : styles.action}
              onClick={() => onAction(recipient)}
            >
              {current ? 'Отменить выбор' : 'Выбрать'}
            </button>
          </div>
        </AnimatedReveal>
      )}
    </div>
  );
};
