import { AnimatedReveal } from '../animated-reveal/animated-reveal';
import type { RecipientRecord } from '../../storage/repositories/recipients';
import styles from './recipient-database.module.css';

type Props = {
  recipient: RecipientRecord;
  selected: boolean;
  current: boolean;
  onSelect: (recipient: RecipientRecord) => void;
  onUseRecipient?: (recipient: RecipientRecord) => boolean | Promise<boolean>;
};

export const RecipientListItem = ({
  recipient,
  selected,
  current,
  onSelect,
  onUseRecipient,
}: Props) => (
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
        {recipient.registrationCount} · направлений: {recipient.individualSelectionDirectionCount} ·
        заявок: {recipient.componentRequestCount}
      </span>
    </button>
    {onUseRecipient && (
      <AnimatedReveal open={selected}>
        <div className={styles.personActions}>
          <button
            type="button"
            className={styles.action}
            disabled={current}
            onClick={() => onUseRecipient(recipient)}
          >
            Выбрать
          </button>
        </div>
      </AnimatedReveal>
    )}
  </div>
);
