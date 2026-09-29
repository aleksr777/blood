import type { RecipientRecord } from '../../storage/repositories/recipients';
import styles from './recipient-field.module.css';

const DETAILS = [
  ['recipientAbo', 'Группа крови AB0'],
  ['recipientRh', 'Резус-принадлежность'],
  ['recipientAntigens', 'Антигены C, c, E, e, K'],
  ['alloimmuneAntibodies', 'Аллоиммунные антитела'],
  ['previousTransfusions', 'Трансфузии в анамнезе'],
  ['previousReactions', 'Реакции и осложнения'],
  ['individualSelectionHistory', 'Индивидуальный подбор'],
] as const;

type Props = {
  recipient: RecipientRecord;
  expanded: boolean;
  actionLabel: string;
  onToggle: () => void;
  onUse: () => void;
};

export const RecipientExistingCard = ({
  recipient,
  expanded,
  actionLabel,
  onToggle,
  onUse,
}: Props) => {
  const details = DETAILS.flatMap(([name, label]) => {
    const value = recipient.profile[name];
    return value ? [{ name, label, value }] : [];
  });

  return (
    <div className={styles.existingCard}>
      <div className={styles.existingTitle}>Реципиент с таким ФИО уже существует</div>
      <div className={styles.existingName}>{recipient.fullName}</div>
      <div className={styles.existingMeta}>
        Сохранённых бланков: {recipient.protocolCount}
      </div>

      {expanded && (
        <div className={styles.existingDetails}>
          {details.length === 0 ? (
            <div className={styles.empty}>Сохранённых данных реципиента пока нет.</div>
          ) : (
            details.map(({ name, label, value }) => (
              <div key={name} className={styles.existingDetail}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))
          )}
        </div>
      )}

      <div className={styles.existingActions}>
        <button type="button" className={styles.secondary} onClick={onToggle}>
          {expanded ? 'Скрыть данные' : 'Посмотреть данные'}
        </button>
        <button type="button" className={styles.primary} onClick={onUse}>
          {actionLabel}
        </button>
      </div>
    </div>
  );
};
