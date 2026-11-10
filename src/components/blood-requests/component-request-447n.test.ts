import { describe, expect, it } from 'vitest';
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
  });

  it('выводит дату и количество в графы формы', () => {
    expect(formatRequestDateTime('2026-11-10T12:35')).toBe('10.11.2026 12:35');
    expect(formatRequestDateTime('')).toBe('');
    expect(formatRequestedQuantity('2', '450')).toBe('2 ед., ≈ 450 мл');
    expect(formatRequestedQuantity('1', '')).toBe('1 ед.');
  });
});
