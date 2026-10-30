import type { ProtocolRecord } from '../../storage/repositories/recipients';
import { transfusionOrderKey } from '../../domain/date-time';
import {
  COMPLICATIONS_STATUS,
  getComplicationsStatus,
} from '../transfusion-protocol/complications-model';
import { formatDate } from '../transfusion-protocol/protocol-types';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';

export const REGISTRATION_TRANSFUSION_ROWS_FIELD = 'registrationTransfusionRows';

export type RegistrationTransfusionRow = {
  protocolId: number;
  componentName: string;
  componentUnitNumber?: string;
  amountLiters: string;
  units: string;
  transfusionDate: string;
  transfusionTime?: string;
  doctorName: string;
  workerName: string;
  complications: string;
};

const formatLiters = (amountMl?: string) => {
  if (!amountMl?.trim()) return '';
  const amount = Number(amountMl.replace(',', '.'));
  if (!Number.isFinite(amount) || amount < 0) return '';

  return (amount / 1000).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
};

export const buildRegistrationTransfusionRow = (
  record: ProtocolRecord,
): RegistrationTransfusionRow => ({
  protocolId: record.id,
  componentName: record.values.componentName?.trim() ?? '',
  componentUnitNumber: record.values.componentUnitNumber?.trim() ?? '',
  amountLiters: formatLiters(record.values.amountMl),
  units: '1',
  transfusionDate: formatDate(record.values.transfusionDate),
  transfusionTime: record.values.startTime || record.values.endTime || '',
  doctorName: record.values.doctorName?.trim() ?? '',
  workerName: record.values.nurseName?.trim() ?? '',
  complications: getComplicationsStatus(record.values) === COMPLICATIONS_STATUS.had ? 'Да' : 'Нет',
});

const rowOrderKey = (row: RegistrationTransfusionRow) => {
  const date = row.transfusionDate.replace(/^(\d{2})\.(\d{2})\.(\d{4})$/, '$3-$2-$1');
  return transfusionOrderKey(date, row.transfusionTime);
};

const compareRows = (left: RegistrationTransfusionRow, right: RegistrationTransfusionRow) =>
  rowOrderKey(left).localeCompare(rowOrderKey(right)) || left.protocolId - right.protocolId;

export const parseRegistrationTransfusionRows = (
  values: ProtocolValues,
): RegistrationTransfusionRow[] => {
  const raw = values[REGISTRATION_TRANSFUSION_ROWS_FIELD];
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const row = item as Partial<RegistrationTransfusionRow>;
        if (typeof row.protocolId !== 'number' || !Number.isFinite(row.protocolId)) {
          return [];
        }

        return [
          {
            protocolId: row.protocolId,
            componentName: typeof row.componentName === 'string' ? row.componentName : '',
            ...(typeof row.componentUnitNumber === 'string'
              ? { componentUnitNumber: row.componentUnitNumber }
              : {}),
            amountLiters: typeof row.amountLiters === 'string' ? row.amountLiters : '',
            units: typeof row.units === 'string' ? row.units : '',
            transfusionDate: typeof row.transfusionDate === 'string' ? row.transfusionDate : '',
            ...(typeof row.transfusionTime === 'string'
              ? { transfusionTime: row.transfusionTime }
              : {}),
            doctorName: typeof row.doctorName === 'string' ? row.doctorName : '',
            workerName: typeof row.workerName === 'string' ? row.workerName : '',
            complications: typeof row.complications === 'string' ? row.complications : '',
          },
        ];
      })
      .sort(compareRows);
  } catch {
    return [];
  }
};

export const serializeRegistrationTransfusionRows = (rows: RegistrationTransfusionRow[]) =>
  JSON.stringify([...rows].sort(compareRows));
