import { expect, it } from 'vitest';
import {
  componentCatalogForGroup,
  COMPONENT_NOMENCLATURE,
} from '../components/blood-requests/component-request-catalog';
import { BLOOD_COMPONENTS, inferBloodComponentGroup } from './blood-components';
import { TRANSFUSABLE_COMPONENTS } from './transfusable-components';

it('keeps only the 34 filtered names in four groups, with exact codes', () => {
  const counts = {
    erythrocytes: 10,
    'plasma-cryo': 9,
    platelets: 13,
    granulocytes: 2,
  };
  expect(BLOOD_COMPONENTS.map(({ value }) => value)).toEqual(Object.keys(counts));

  const originalCodes = new Set<string>(
    Object.values(COMPONENT_NOMENCLATURE)
      .flat()
      .map(({ code }) => code),
  );
  for (const [group, count] of Object.entries(counts)) {
    const entries = componentCatalogForGroup(group);
    expect(entries).toHaveLength(count);
    expect(entries).toEqual(TRANSFUSABLE_COMPONENTS[group as keyof typeof counts]);
    expect(new Set(entries.map(({ code }) => code)).size).toBe(count);
    expect(new Set(entries.map(({ name }) => name)).size).toBe(count);
    expect(entries.every(({ code }) => originalCodes.has(code))).toBe(true);
    expect(entries.every(({ name }) => !name.includes('Иммуноспецифическая'))).toBe(true);
    expect(entries.every(({ name }) => !name.includes('Кровь консервированная'))).toBe(true);
  }
  expect(componentCatalogForGroup('')).toEqual([]);
});

it('removes erythrocyte mass, unfiltered platelets, and immune-specific plasma', () => {
  const erythrocytes = componentCatalogForGroup('erythrocytes');
  expect(erythrocytes.every(({ code }) => !code.startsWith('ЭМ-'))).toBe(true);
  const platelets = componentCatalogForGroup('platelets');
  expect(platelets.every(({ name }) => name.includes('лейкоредуцированный'))).toBe(true);
  const plasma = componentCatalogForGroup('plasma-cryo');
  expect(plasma.every(({ code }) => !code.startsWith('ИСП-'))).toBe(true);
  expect(plasma.filter(({ code }) => code.startsWith('КРИО'))).toHaveLength(4);
  expect(componentCatalogForGroup('granulocytes').map(({ code }) => code)).toEqual([
    'ГКО',
    'ГК-ПО',
  ]);
});

it('infers granulocytes, cryoprecipitate, and older names correctly', () => {
  expect(inferBloodComponentGroup('Концентрат гранулоцитов пулированный, облучённый')).toBe(
    'granulocytes',
  );
  expect(inferBloodComponentGroup('Криопреципитат пулированный')).toBe('plasma-cryo');
  expect(inferBloodComponentGroup('Эритроцитная масса')).toBe('erythrocytes');
});
