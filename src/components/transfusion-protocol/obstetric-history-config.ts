import { OBSTETRIC_UNKNOWN } from './obstetric-history';
import type { ProtocolFieldConfig } from './protocol-types';

export const obstetricHistoryFields: ProtocolFieldConfig[] = [
  {
    name: 'recipientPregnanciesCount',
    label: 'Количество беременностей',
    type: 'number',
  },
  {
    name: 'recipientBirthsCount',
    label: 'Количество родов',
    type: 'number',
  },
  {
    name: 'recipientSpontaneousAbortionsCount',
    label: 'Самопроизвольные аборты в анамнезе',
    type: 'number',
  },
  {
    name: 'recipientHemolyticDiseaseNewbornHistory',
    label: 'Гемолитическая болезнь новорождённого в анамнезе',
    type: 'select',
    options: [OBSTETRIC_UNKNOWN, 'Нет', 'Да'],
    required: true,
  },
];
