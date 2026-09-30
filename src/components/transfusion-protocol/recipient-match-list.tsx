import { useState } from 'react';
import type { RecipientRecord } from '../../storage/repositories/recipients';
import { RecipientExistingCard } from './recipient-existing-card';
import styles from './recipient-field.module.css';

type Props = {
  matches: RecipientRecord[];
  busy: boolean;
  actionLabel: string;
  onBack: () => void;
  onUse: (recipient: RecipientRecord) => void;
};

export const RecipientMatchList = ({
  matches,
  busy,
  actionLabel,
  onBack,
  onUse,
}: Props) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <>
      <p className={styles.existingIntro}>
        Найдены реципиенты с одинаковым ФИО. Сверьте сохранённые сведения и номер карточки.
      </p>
      <div className={styles.matchList}>
        {matches.map((recipient) => (
          <RecipientExistingCard
            key={recipient.id}
            recipient={recipient}
            expanded={expandedId === recipient.id}
            actionLabel={actionLabel}
            disabled={busy}
            onToggle={() => setExpandedId((id) => id === recipient.id ? null : recipient.id)}
            onUse={() => onUse(recipient)}
          />
        ))}
      </div>
      <div className={styles.footer}>
        <button type="button" className={styles.secondary} disabled={busy} onClick={onBack}>
          Вернуться к созданию нового
        </button>
      </div>
    </>
  );
};
