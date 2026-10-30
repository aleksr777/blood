import { formatDate } from '../transfusion-protocol/protocol-types';
import styles from '../record-summary/record-summary.module.css';

export const TransfusionRecordSummary = ({ values }: { values: Record<string, string> }) => {
  const dateTime = [formatDate(values.transfusionDate), values.startTime || values.endTime]
    .filter(Boolean)
    .join(' ');
  const details = [
    values.amountMl?.trim() ? `${values.amountMl.trim()} мл` : '',
    values.componentUnitNumber?.trim() ? `№ ${values.componentUnitNumber.trim()}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <span className={styles.content}>
      <span className={styles.topLine}>
        <strong>{values.componentName?.trim() || 'Компонент не указан'}</strong>
        <span>{dateTime || 'Дата не указана'}</span>
      </span>
      {details && <span className={styles.details}>{details}</span>}
    </span>
  );
};
