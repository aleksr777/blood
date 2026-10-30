import type { ProtocolRecord, RegistrationRecord } from '../../storage/repositories/recipients';
import { parseRegistrationTransfusionRows } from './registration-transfusion-table';
import summary from '../transfusion-record-summary/transfusion-record-summary.module.css';
import styles from './registration-record-summary.module.css';

export const RegistrationRecordSummary = ({
  record,
  protocols,
}: {
  record: RegistrationRecord;
  protocols: ProtocolRecord[];
}) => {
  const savedAt = [record.updatedAt, record.createdAt].find(
    (timestamp) => timestamp > 0 && !Number.isNaN(new Date(timestamp).getTime()),
  );
  const date = savedAt ? new Date(savedAt) : null;
  const savedDateTime = date
    ? `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false })}`
    : '';
  const rows = parseRegistrationTransfusionRows(record.values);
  const linkedProtocols = new Map(
    protocols
      .filter(({ recipientId }) => recipientId === record.recipientId)
      .map((item) => [item.id, item.values]),
  );

  return (
    <span className={summary.content}>
      <span className={summary.topLine}>
        <strong>Лист регистрации трансфузий</strong>
        <span>
          {date ? (
            <time dateTime={date.toISOString()} aria-label={`Сохранён: ${savedDateTime}`}>
              {savedDateTime}
            </time>
          ) : (
            'Дата сохранения не указана'
          )}
        </span>
      </span>
      {rows.length ? (
        <span className={styles.components}>
          {rows.map((row, index) => {
            const linked = linkedProtocols.get(row.protocolId);
            const name = row.componentName.trim() || linked?.componentName?.trim();
            const unit = row.componentUnitNumber?.trim() || linked?.componentUnitNumber?.trim();
            return (
              <span key={`${row.protocolId}:${index}`} className={styles.component}>
                <span className={styles.componentName}>{name || 'Компонент не указан'}</span>
                <span className={summary.details}>
                  {unit ? `№ ${unit}` : 'Номер гемакона не указан'}
                </span>
              </span>
            );
          })}
        </span>
      ) : (
        <span className={summary.details}>Трансфузии не указаны.</span>
      )}
    </span>
  );
};
