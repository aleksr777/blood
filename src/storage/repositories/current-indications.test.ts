// @vitest-environment jsdom
import { beforeEach, expect, it } from 'vitest';
import {
  currentIndicationsForComponent,
  readCurrentIndications,
  writeCurrentIndications,
} from './current-indications';

const key = 'blood:current-indications';
const selection = {
  componentGroup: 'platelets',
  indicationComponent: 'platelets',
  componentName: 'Чужое наименование',
  requiredComponent: 'Чужой компонент',
  componentCode: 'ЧУЖОЙ-КОД',
};

beforeEach(() => window.localStorage.clear());

it('shares only clinical indication fields, without a page component selection', () => {
  const values = {
    ...selection,
    indicationRbcHemicHypoxia: '1',
    indicationPlateletCount: '50',
  };
  expect(currentIndicationsForComponent(values, 'erythrocytes')).toEqual({
    indicationRbcHemicHypoxia: '1',
  });
  writeCurrentIndications(1, 'erythrocytes', values);
  expect(JSON.parse(window.localStorage.getItem(key)!).byComponent.erythrocytes).toEqual({
    indicationRbcHemicHypoxia: '1',
  });
});

it('ignores component selections left in an older shared cache', () => {
  window.localStorage.setItem(
    key,
    JSON.stringify({
      recipientId: 1,
      byComponent: {
        erythrocytes: { ...selection, indicationRbcHemicHypoxia: '1' },
      },
    }),
  );
  const values = readCurrentIndications(1, 'erythrocytes');
  expect(values.indicationRbcHemicHypoxia).toBe('1');
  for (const field of Object.keys(selection)) expect(values).not.toHaveProperty(field);
  expect(readCurrentIndications(2, 'erythrocytes').indicationRbcHemicHypoxia).toBe('');
  expect(readCurrentIndications(1, 'unselected')).toEqual({});
});
