import type { ProtocolBlockConfig } from './protocol-types';

export const firstPageBlockConfigs: ProtocolBlockConfig[] = [
  {
    id: 'general',
    title: 'Общие данные о трансфузии',
    size: 'large',
    fields: [
      { name: 'recipientName', label: 'Фамилия, имя, отчество реципиента', wide: true },
      { name: 'requestDateTime', label: 'Дата и время подачи заявки', type: 'datetime-local' },
      { name: 'transfusionDate', label: 'Дата трансфузии', type: 'date' },
      { name: 'department', label: 'Отделение' },
      { name: 'medicalRecordNumber', label: '№ истории болезни' },
      { name: 'startTime', label: 'Время начала трансфузии', type: 'time' },
      { name: 'endTime', label: 'Время окончания трансфузии', type: 'time' },
    ],
  },
  {
    id: 'examination',
    title: 'Данные медицинского обследования реципиента',
    size: 'medium',
    fields: [
      {
        name: 'recipientAbo',
        label: 'Группа крови AB0',
        type: 'select',
        options: ['O(I)', 'A(II)', 'B(III)', 'AB(IV)'],
      },
      {
        name: 'recipientRh',
        label: 'Резус-принадлежность',
        type: 'select',
        options: ['Rh(D)+', 'Rh(D)-'],
      },
      { name: 'recipientAntigens', label: 'Антигены C, c, E, e, K', wide: true },
      { name: 'alloimmuneAntibodies', label: 'Аллоиммунные антитела', wide: true },
    ],
  },
  {
    id: 'indications',
    title: 'Показания к трансфузии',
    size: 'medium',
    fields: [
      { name: 'indications', label: 'Показания к трансфузии', type: 'textarea', wide: true },
    ],
  },
  {
    id: 'history',
    title: 'Анамнез реципиента',
    size: 'large',
    fields: [
      {
        name: 'previousTransfusions',
        label: 'Трансфузии компонентов крови в анамнезе',
        type: 'textarea',
        wide: true,
      },
      {
        name: 'previousReactions',
        label: 'Реакции и осложнения на трансфузии в анамнезе',
        type: 'textarea',
        wide: true,
      },
      {
        name: 'individualSelectionHistory',
        label: 'Трансфузии по индивидуальному подбору',
        type: 'textarea',
        wide: true,
      },
    ],
  },
  {
    id: 'donor',
    title: 'Данные о донорской крови или ее компоненте',
    size: 'xlarge',
    fields: [
      { name: 'componentName', label: 'Наименование компонента донорской крови', wide: true },
      { name: 'collectionOrganization', label: 'Организация, осуществившая заготовку', wide: true },
      {
        name: 'donorAbo',
        label: 'Группа крови донора AB0',
        type: 'select',
        options: ['O(I)', 'A(II)', 'B(III)', 'AB(IV)'],
      },
      { name: 'donorAntigens', label: 'Антигены эритроцитов донора C, c, E, e, K' },
      { name: 'componentUnitNumber', label: '№ единицы компонента крови' },
      { name: 'amountMl', label: 'Количество, мл', type: 'number', step: '1' },
      { name: 'collectionDate', label: 'Дата заготовки', type: 'date' },
      { name: 'expirationDate', label: 'Срок годности', type: 'date' },
    ],
  },
  {
    id: 'selection',
    title: 'Результаты индивидуального подбора',
    size: 'large',
    fields: [
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
];
