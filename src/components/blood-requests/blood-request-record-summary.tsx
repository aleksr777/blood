import type { BloodRequestRecord } from '../../storage/repositories/recipients';
import { isIsoDate } from '../../domain/date-time';
import { savedDocumentTitle } from '../saved-document/saved-document-title';
import { formatDate } from '../transfusion-protocol/protocol-types';
import styles from '../record-summary/record-summary.module.css';

export const BloodRequestRecordSummary = ({ record }: { record: BloodRequestRecord }) => {
  const dateValue = record.values.directionDate;
  const date = typeof dateValue === 'string' ? dateValue.split('T')[0] : '';
  const component = record.values.requiredComponent;
  const componentName = typeof component === 'string' ? component.trim() : '';

  return (
    <span className={styles.content}>
      <span className={styles.topLine}>
        <strong>{savedDocumentTitle(record.kind, {})}</strong>
        {isIsoDate(date) && (
          <span>
            <time dateTime={date}>{formatDate(date)}</time>
          </span>
        )}
      </span>
      <span className={styles.components}>
        <span className={styles.details}>{componentName || 'Требуемый компонент не указан'}</span>
      </span>
    </span>
  );
};
