import type { ProtocolValues } from './protocol-types';
import { splitPreviousTransfusionText } from './previous-transfusion-text';
export { formatObstetricHistory } from './obstetric-history';

export const HISTORY_STATUS = {
  none: 'none',
  unknown: 'unknown',
  had: 'had',
} as const;

export type HistoryStatus = (typeof HISTORY_STATUS)[keyof typeof HISTORY_STATUS];

export const TRANSFUSION_HISTORY_FIELDS = [
  {
    statusName: 'previousTransfusionsStatus',
    textName: 'previousTransfusions',
    label: 'Трансфузии компонентов крови в анамнезе',
  },
  {
    statusName: 'previousReactionsStatus',
    textName: 'previousReactions',
    label: 'Реакции и осложнения на трансфузии в анамнезе',
  },
  {
    statusName: 'individualSelectionHistoryStatus',
    textName: 'individualSelectionHistory',
    label: 'Трансфузии по индивидуальному подбору в анамнезе',
  },
] as const;

export const getHistoryStatus = (status?: string, text?: string): HistoryStatus | '' => {
  if (
    status === HISTORY_STATUS.none ||
    status === HISTORY_STATUS.unknown ||
    status === HISTORY_STATUS.had
  ) {
    return status;
  }

  if (status === '') return '';

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
  if (status === HISTORY_STATUS.had) {
    if (textName === 'previousTransfusions') {
      const { generated, manual } = splitPreviousTransfusionText(values);
      if (generated) {
        const continuation = manual.replace(/^(?:[\t ]*\r?\n)+/u, '');
        return `${generated}${continuation ? `\n${continuation}` : ''}`.trim();
      }
    }
    return values[textName]?.trim() ?? '';
  }

  return '';
};
