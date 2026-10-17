import type { ProtocolRecord } from '../../storage/repositories/recipients';
import { formatDate } from './protocol-types';

export const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isIsoDate = (value?: string) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '');

const hasCompleteComponentData = (record: ProtocolRecord) => {
  const { values } = record;

  return Boolean(
    values.componentName?.trim() &&
      values.amountMl?.trim() &&
      values.componentUnitNumber?.trim() &&
      values.expirationDate?.trim(),
  );
};

const describeProtocol = (record: ProtocolRecord) => {
  const { values } = record;
  const component = values.componentName?.trim() ?? '';
  const amount = values.amountMl?.trim() ?? '';

  return `${formatDate(values.transfusionDate)} — ${component}, ${amount} мл`;
};

export const buildPreviousTransfusionHistory = (
  records: ProtocolRecord[],
  today = getLocalDateKey(),
) =>
  records
    .filter((record) => {
      const date = record.values.transfusionDate ?? '';
      return isIsoDate(date) && date < today && hasCompleteComponentData(record);
    })
    .sort((left, right) =>
      (right.values.transfusionDate ?? '').localeCompare(
        left.values.transfusionDate ?? '',
      ),
    )
    .map(describeProtocol)
    .filter(Boolean)
    .join('\n');
