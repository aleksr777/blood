import type { ProtocolRecord, RegistrationRecord } from '../../storage/repositories/recipients';
import { parseRegistrationTransfusionRows } from './registration-transfusion-table';
import { formatDate } from '../transfusion-protocol/protocol-types';
import summary from '../record-summary/record-summary.module.css';

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
  const localDate = date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : '';
  const savedDate = formatDate(localDate);
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
            <time dateTime={localDate} aria-label={`Сохранён: ${savedDate}`}>
              {savedDate}
            </time>
          ) : (
            'Дата сохранения не указана'
          )}
        </span>
      </span>
      {rows.length ? (
        <span className={summary.components}>
          {rows.map((row, index) => {
            const linked = linkedProtocols.get(row.protocolId);
            const name = row.componentName.trim() || linked?.componentName?.trim();
            const unit = row.componentUnitNumber?.trim() || linked?.componentUnitNumber?.trim();
            return (
              <span key={`${row.protocolId}:${index}`} className={summary.component}>
                <span className={summary.details}>{name || 'Компонент не указан'}</span>
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
