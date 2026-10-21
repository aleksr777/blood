import type { ProtocolRecord } from '../../storage/repositories/recipients';
import { formatDate } from './protocol-types';

const HISTORY_DELAY_MS = 6 * 60 * 60 * 1000;

export const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseIsoDate = (value?: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return { year, month, day };
};

const parseTime = (value?: string) => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value ?? '');
  if (!match) return null;

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
};

const hasCompleteComponentData = (record: ProtocolRecord) => {
  const { values } = record;

  return Boolean(
    values.componentName?.trim() &&
    values.amountMl?.trim() &&
    values.componentUnitNumber?.trim() &&
    values.expirationDate?.trim(),
  );
};

const getHistoryEligibleAt = (record: ProtocolRecord) => {
  const date = parseIsoDate(record.values.transfusionDate);
  if (!date) return null;

  const endTime = parseTime(record.values.endTime);
  const transfusionEndedAt = endTime
    ? new Date(date.year, date.month - 1, date.day, endTime.hour, endTime.minute).getTime()
    : new Date(date.year, date.month - 1, date.day, 23, 59, 59, 999).getTime();

  return transfusionEndedAt + HISTORY_DELAY_MS;
};

const describeProtocol = (record: ProtocolRecord) => {
  const { values } = record;
  const component = values.componentName?.trim() ?? '';
  const amount = values.amountMl?.trim() ?? '';

  return `${formatDate(values.transfusionDate)} — ${component}, ${amount} мл`;
};

export const buildPreviousTransfusionHistory = (records: ProtocolRecord[], now = new Date()) => {
  const currentTime = now.getTime();

  return records
    .filter((record) => {
      const eligibleAt = getHistoryEligibleAt(record);
      return eligibleAt !== null && currentTime > eligibleAt && hasCompleteComponentData(record);
    })
    .sort((left, right) => {
      const leftTime = getHistoryEligibleAt(left) ?? 0;
      const rightTime = getHistoryEligibleAt(right) ?? 0;
      return rightTime - leftTime;
    })
    .map(describeProtocol)
    .filter(Boolean)
    .join('\n');
};

export const getNextPreviousTransfusionEligibilityTime = (
  records: ProtocolRecord[],
  now = new Date(),
) => {
  const currentTime = now.getTime();

  const futureTimes = records.flatMap((record) => {
    if (!hasCompleteComponentData(record)) return [];

    const eligibleAt = getHistoryEligibleAt(record);
    return eligibleAt !== null && eligibleAt >= currentTime ? [eligibleAt] : [];
  });

  return futureTimes.length > 0 ? Math.min(...futureTimes) : null;
};
