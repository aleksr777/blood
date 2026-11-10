import { describe, expect, it } from 'vitest';
import { COMPONENT_NOMENCLATURE, componentCatalogForGroup } from './component-request-catalog';
import {
  COMPONENT_CODES,
  INDIVIDUAL_SELECTION_INDICATIONS,
  TRANSFUSION_INDICATIONS,
  componentTypeForCode,
  formatRequestDateTime,
  formatRequestedQuantity,
  indicationOptionsForComponent,
} from './component-request-447n';

describe('Заявка по приложению № 17 к приказу № 447н', () => {
  it('содержит коды всех шести групп компонентов и коды показаний из приложения № 18', () => {
    expect(Object.keys(COMPONENT_CODES)).toEqual([
      'erythrocytes',
      'platelets',
      'plasma',
      'cryoprecipitate',
      'cryosupernatant',
      'granulocytes',
    ]);
    expect(TRANSFUSION_INDICATIONS.map(({ code }) => code)).toEqual([
      '1.1',
      '1.2',
      '1.3',
      '1.4',
      '2.1',
      '2.2',
      '2.3',
      '2.4',
      '2.5',
      '2.6',
      '2.7',
      '2.8',
      '3.1',
      '3.2',
      '4.1',
      '4.2',
      '4.3',
      '5',
      '6',
    ]);
    expect(INDIVIDUAL_SELECTION_INDICATIONS.map(({ code }) => code)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
    ]);
  });

  it('определяет показания по коду компонента даже при другой выбранной группе', () => {
    expect(componentTypeForCode('эв-л')).toBe('erythrocytes');
    expect(componentTypeForCode('КРИО-П')).toBe('cryoprecipitate');
    expect(indicationOptionsForComponent('КП', 'erythrocytes').map(({ code }) => code)).toEqual([
      '5',
    ]);
    expect(indicationOptionsForComponent('', 'plasma-cryo').map(({ code }) => code)).toEqual([
      '3.1',
      '3.2',
      '4.1',
      '4.2',
      '4.3',
      '5',
    ]);
    expect(componentTypeForCode('ИСП-RhD')).toBe('plasma');
  });

  it('ограничивает варианты выбранной группой и хранит только нормативные коды с расшифровками', () => {
    const erythrocytes = componentCatalogForGroup('erythrocytes');
    const platelets = componentCatalogForGroup('platelets');
    const plasma = componentCatalogForGroup('plasma-cryo');
    expect(erythrocytes).toContainEqual({
      code: 'ЭВ-Л',
      name: 'Эритроцитная взвесь лейкоредуцированная',
    });
    expect(platelets.some(({ code }) => code.startsWith('ЭВ-'))).toBe(false);
    expect(plasma).toContainEqual({
      code: 'КРИО-ПЛ',
      name: 'Криопреципитат пулированный лиофилизированный',
    });
    expect(plasma.some(({ code }) => code.startsWith('КТ-'))).toBe(false);
    expect(componentCatalogForGroup('')).toEqual([]);
    expect(
      Object.values(COMPONENT_NOMENCLATURE)
        .flat()
        .every(({ name }) => name.length > 5),
    ).toBe(true);
    const validCodes: string[] = Object.values(COMPONENT_NOMENCLATURE)
      .flat()
      .map(({ code }) => code);
    expect(validCodes).not.toContain('ЭВ-УДСО');
  });

  it('выводит дату и количество в графы формы', () => {
    expect(formatRequestDateTime('2026-11-10T12:35')).toBe('10.11.2026 12:35');
    expect(formatRequestDateTime('')).toBe('');
    expect(formatRequestedQuantity('2', '450')).toBe('2 ед., ≈ 450 мл');
    expect(formatRequestedQuantity('1', '')).toBe('1 ед.');
  });
});
