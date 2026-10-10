import type { ProtocolValues } from './protocol-types';

export const COMPLICATIONS_STATUS = {
  none: 'none',
  had: 'had',
} as const;

export type ComplicationsStatus =
  (typeof COMPLICATIONS_STATUS)[keyof typeof COMPLICATIONS_STATUS];

export const getComplicationsStatus = (values: ProtocolValues): ComplicationsStatus | '' => {
  const status = values.complicationsStatus;

  if (status === COMPLICATIONS_STATUS.none || status === COMPLICATIONS_STATUS.had) {
    return status;
  }

  return values.symptoms?.trim() || values.severity?.trim()
    ? COMPLICATIONS_STATUS.had
    : '';
};
