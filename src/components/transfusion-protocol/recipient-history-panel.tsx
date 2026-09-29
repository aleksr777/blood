import type {
  ProtocolRecord,
  RecipientRecord,
} from '../../storage/repositories/recipients';
import styles from './recipient-database.module.css';

type Props = {
  recipient: RecipientRecord | null;
  records: ProtocolRecord[];
  onOpenRecord: (record: ProtocolRecord) => void;
  onNewProtocol: (recipient: RecipientRecord) => void;
  onEdit: (recipient: RecipientRecord) => void;
  onDelete: (recipient: RecipientRecord) => void;
};

const formatUpdated = (value: number) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));

export const RecipientHistoryPanel = ({
  recipient,
  records,
  onOpenRecord,
  onNewProtocol,
  onEdit,
  onDelete,
}: Props) => (
  <section className={styles.panel}>
    {!recipient ? (
      <div className={styles.empty}>Выберите реципиента слева.</div>
    ) : (
      <>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>{recipient.fullName}</h3>
            <div className={styles.meta}>Сохранённых бланков: {recipient.protocolCount}</div>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.secondaryAction} onClick={() => onEdit(recipient)}>
              Редактировать
            </button>
            <button type="button" className={styles.dangerAction} onClick={() => onDelete(recipient)}>
              Удалить
            </button>
            <button type="button" className={styles.action} onClick={() => onNewProtocol(recipient)}>
              Новый бланк
            </button>
          </div>
        </div>
        <div className={styles.records}>
          {records.length === 0 && (
            <div className={styles.empty}>Сохранённых бланков пока нет.</div>
          )}
          {records.map((record) => (
            <div key={record.id} className={styles.record}>
              <div>
                <div className={styles.recordTitle}>
                  Трансфузия: {formatDate(record.values.transfusionDate) || 'дата не указана'}
                </div>
                <div className={styles.meta}>Изменён: {formatUpdated(record.updatedAt)}</div>
              </div>
              <button type="button" className={styles.open} onClick={() => onOpenRecord(record)}>
                Открыть
              </button>
            </div>
          ))}
        </div>
      </>
    )}
  </section>
);
