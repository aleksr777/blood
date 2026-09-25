import type { ProtocolBlockConfig } from './protocol-types';

const monitoringFields = [
  ['before', 'Перед началом переливания'],
  ['hour1', 'Через 1 час после переливания'],
  ['hour2', 'Через 2 часа после переливания'],
].flatMap(([prefix, period]) => [
  { name: `${prefix}Bp`, label: `${period}: АД, мм рт. ст.` },
  { name: `${prefix}Pulse`, label: `${period}: пульс, уд/мин`, type: 'number' as const },
  {
    name: `${prefix}Temperature`,
    label: `${period}: температура, °C`,
    type: 'number' as const,
    step: '0.1',
  },
  { name: `${prefix}Urine`, label: `${period}: диурез, цвет мочи` },
]);

export const secondPageBlockConfigs: ProtocolBlockConfig[] = [
  {
    id: 'responsible',
    title: 'Ответственное лицо и заключение',
    size: 'medium',
    fields: [
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
    size: 'large',
    fields: [
      { name: 'reagentNames', label: 'Наименования реагентов', wide: true },
      { name: 'reagentSeries', label: '№ серии реагента' },
      { name: 'reagentExpiration', label: 'Срок годности реагента', type: 'date' },
      {
        name: 'planeTestResult',
        label: 'Проба на плоскости',
        type: 'select',
        options: ['Совместимо', 'Несовместимо'],
      },
      {
        name: 'biologicalTestResult',
        label: 'Биологическая проба',
        type: 'select',
        options: ['Совместимо', 'Несовместимо'],
      },
    ],
  },
  {
    id: 'complications',
    title: 'Реакции и осложнения',
    size: 'medium',
    fields: [
      { name: 'symptoms', label: 'Основные симптомы', type: 'textarea', wide: true },
      { name: 'severity', label: 'Степень тяжести', wide: true },
    ],
  },
  {
    id: 'monitoring',
    title: 'Наблюдение за состоянием реципиента',
    size: 'xlarge',
    fields: monitoringFields,
  },
  {
    id: 'doctor',
    title: 'Врач, осуществивший трансфузию',
    size: 'small',
    fields: [{ name: 'doctorName', label: 'Фамилия, имя, отчество врача', wide: true }],
  },
];
