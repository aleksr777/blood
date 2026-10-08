import type { ProtocolValues } from './protocol-types';

export const HISTORY_STATUS = {
  none: 'none',
  unknown: 'unknown',
  had: 'had',
} as const;

export type HistoryStatus = (typeof HISTORY_STATUS)[keyof typeof HISTORY_STATUS];

export const getHistoryStatus = (status?: string, text?: string): HistoryStatus | '' => {
  if (
    status === HISTORY_STATUS.none ||
    status === HISTORY_STATUS.unknown ||
    status === HISTORY_STATUS.had
  ) {
    return status;
  }

  // Existing records created before status fields were added contain only free text.
  return text?.trim() ? HISTORY_STATUS.had : '';
};

export const formatHistoryValue = (
  values: ProtocolValues,
  statusName: string,
  textName: string,
) => {
  const status = getHistoryStatus(values[statusName], values[textName]);

  if (status === HISTORY_STATUS.none) return 'Не было';
  if (status === HISTORY_STATUS.unknown) return 'Не известно';
  if (status === HISTORY_STATUS.had) return values[textName]?.trim() ?? '';

  return '';
};
