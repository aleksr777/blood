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

export const selectedBloodComponentGroup = (
  values: { componentGroup?: string; indicationComponent?: string },
  componentName = '',
) => {
  if (values.componentGroup !== undefined) return values.componentGroup;
  if (values.indicationComponent !== undefined) return values.indicationComponent;
  return inferBloodComponentGroup(componentName);
};

export const componentGroupChanges = (
  values: { componentGroup?: string; indicationComponent?: string; componentName?: string },
  group: string,
  name: string,
) => ({
  componentGroup: group,
  indicationComponent: group,
  componentName: name,
  lastSelectedComponentGroup: group || selectedBloodComponentGroup(values, values.componentName),
});

export const visibleProtocolComponentValues = <T extends Record<string, string>>(values: T): T =>
  selectedBloodComponentGroup(values, values.componentName) ? values : ({} as T);
