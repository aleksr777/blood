export const BLOOD_COMPONENTS = [
  {
    value: 'erythrocytes',
    label: 'Эритроциты',
    names: [
      'Эритроцитная взвесь',
      'Отмытые эритроциты',
      'Эритроцитная взвесь с удалённым лейкотромбоцитным слоем',
      'Эритроцитная взвесь лейкоредуцированная',
    ],
    legacyCategories: [
      'componentRequestRequiredComponent:erythrocytes',
      'individualSelectionRequiredComponent',
    ],
  },
  {
    value: 'plasma-cryo',
    label: 'Плазма',
    names: ['Свежезамороженная плазма'],
    legacyCategories: ['componentRequestRequiredComponent:plasma'],
  },
  {
    value: 'platelets',
    label: 'Тромбоциты',
    names: ['Тромбоциты', 'Концентрат тромбоцитов'],
    legacyCategories: ['componentRequestRequiredComponent:platelets'],
  },
] as const;

export const getBloodComponentNameCategory = (group?: string) =>
  BLOOD_COMPONENTS.some(({ value }) => value === group) ? `componentName:${group}` : null;

export const formatBloodComponentName = (name: string, group?: string) =>
  name.trim() ? name : (BLOOD_COMPONENTS.find(({ value }) => value === group)?.label ?? '');

export const inferBloodComponentGroup = (name = '') => {
  const normalized = name.trim().toLocaleLowerCase('ru-RU');
  if (normalized.includes('эритроц') || normalized.includes('эритромас')) return 'erythrocytes';
  if (normalized.includes('плазм') || /^сзп(?:\s|$)/.test(normalized)) return 'plasma-cryo';
  if (normalized.includes('тромбоц')) return 'platelets';
  return '';
};
