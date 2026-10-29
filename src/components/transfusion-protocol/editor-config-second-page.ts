import type { ProtocolBlockConfig } from './protocol-types';
import { getMonitoringFields, MONITORING_PERIODS } from './monitoring-model';

const monitoringFields = MONITORING_PERIODS.flatMap(({ prefix, title }) =>
  getMonitoringFields(prefix).map((field) => ({ ...field, label: `${title}: ${field.label}` })),
);

export const secondPageBlockConfigs: ProtocolBlockConfig[] = [
  {
    id: 'selection',
    title: 'Индивидуальный подбор',
    size: 'large',
    fields: [
      { name: 'selectionStatus', label: 'selectionStatus' },
      {
        name: 'selectionOrganization',
        label: 'Медицинская организация, осуществившая индивидуальный подбор',
        wide: true,
      },
      { name: 'selectionDate', label: 'Дата исследования', type: 'date' },
      {
        name: 'responsiblePerson',
        label: 'Фамилия, имя, отчество ответственного лица',
        wide: true,
      },
      {
        name: 'compatibilityConclusion',
        label: 'Заключение',
        type: 'select',
        options: ['Совместимо', 'Несовместимо'],
      },
    ],
  },
  {
    id: 'compatibilityTests',
    title: 'Пробы на индивидуальную совместимость',
    size: 'xlarge',
    fields: [
      { name: 'componentGroup', label: 'componentGroup' },
      { name: 'reagentAntiASeries', label: 'Цоликлон анти-A: серия' },
      { name: 'reagentAntiAExpiration', label: 'Цоликлон анти-A: годен до', type: 'date' },
      { name: 'reagentAntiAManufacturer', label: 'Цоликлон анти-A: производитель' },
      { name: 'reagentAntiBSeries', label: 'Цоликлон анти-B: серия' },
      { name: 'reagentAntiBExpiration', label: 'Цоликлон анти-B: годен до', type: 'date' },
      { name: 'reagentAntiBManufacturer', label: 'Цоликлон анти-B: производитель' },
      { name: 'reagentAntiABSeries', label: 'Цоликлон анти-AB: серия' },
      { name: 'reagentAntiABExpiration', label: 'Цоликлон анти-AB: годен до', type: 'date' },
      { name: 'reagentAntiABManufacturer', label: 'Цоликлон анти-AB: производитель' },
      { name: 'reagentAntiDSeries', label: 'Цоликлон анти-D: серия' },
      { name: 'reagentAntiDExpiration', label: 'Цоликлон анти-D: годен до', type: 'date' },
      { name: 'reagentAntiDManufacturer', label: 'Цоликлон анти-D: производитель' },
      { name: 'reagentNames', label: 'Наименования реагентов', wide: true },
      { name: 'reagentSeries', label: '№ серии реагента' },
      { name: 'reagentExpiration', label: 'Срок годности реагента', type: 'date' },
      {
        name: 'confirmedRecipientAboResult',
        label: 'Подтверждена группа крови реципиента',
      },
      {
        name: 'confirmedDonorAboResult',
        label: 'Подтверждена группа крови донора',
      },
      {
        name: 'planeTestResult',
        label: 'Проба на плоскости',
      },
      {
        name: 'biologicalTestResult',
        label: 'Биологическая проба',
      },
    ],
  },
  {
    id: 'complications',
    title: 'Реакции и осложнения',
    size: 'medium',
    fields: [
      { name: 'complicationsStatus', label: 'complicationsStatus' },
      { name: 'symptoms', label: 'Основные симптомы', type: 'textarea', wide: true },
      {
        name: 'severity',
        label: 'Степень тяжести',
        type: 'select',
        options: ['Средней степени тяжести', 'Тяжёлое', 'Крайне тяжёлое'],
        wide: true,
        required: true,
      },
    ],
  },
  {
    id: 'monitoring',
    title: 'Наблюдение за состоянием реципиента',
    size: 'medium',
    fields: monitoringFields,
  },
  {
    id: 'doctor',
    title: 'Персонал, осуществивший трансфузию',
    size: 'medium',
    fields: [
      { name: 'doctorName', label: 'ФИО врача', wide: true },
      { name: 'nurseName', label: 'ФИО мед. сестры / мед. брата', wide: true },
    ],
  },
];
