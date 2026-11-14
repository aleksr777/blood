import { TRANSFUSABLE_COMPONENTS } from './transfusable-components';

export const BLOOD_COMPONENTS = [
  {
    value: 'erythrocytes',
    label: 'Эритроциты',
    names: TRANSFUSABLE_COMPONENTS.erythrocytes.map(({ name }) => name),
    legacyCategories: [
      'componentRequestRequiredComponent:erythrocytes',
      'individualSelectionRequiredComponent',
    ],
  },
  {
    value: 'plasma-cryo',
    label: 'Плазма',
    names: TRANSFUSABLE_COMPONENTS['plasma-cryo'].map(({ name }) => name),
    legacyCategories: ['componentRequestRequiredComponent:plasma'],
  },
  {
    value: 'platelets',
    label: 'Тромбоциты',
    names: TRANSFUSABLE_COMPONENTS.platelets.map(({ name }) => name),
    legacyCategories: ['componentRequestRequiredComponent:platelets'],
  },
  {
    value: 'granulocytes',
    label: 'Гранулоциты',
    names: TRANSFUSABLE_COMPONENTS.granulocytes.map(({ name }) => name),
    legacyCategories: [],
  },
] as const;

export const getBloodComponentNameCategory = (group?: string) =>
  BLOOD_COMPONENTS.some(({ value }) => value === group) ? `componentName:${group}` : null;

export const inferBloodComponentGroup = (name = '') => {
  const normalized = name.trim().toLocaleLowerCase('ru-RU');
  if (normalized.includes('эритроц') || normalized.includes('эритромас')) return 'erythrocytes';
  if (
    normalized.includes('плазм') ||
    normalized.includes('криопреципитат') ||
    /^сзп(?:\s|$)/.test(normalized)
  )
    return 'plasma-cryo';
  if (normalized.includes('тромбоц')) return 'platelets';
  if (normalized.includes('гранулоц')) return 'granulocytes';
  return '';
};
