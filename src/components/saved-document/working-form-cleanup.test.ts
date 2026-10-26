import { expect, it } from 'vitest';
import { parseRegistrationTransfusionRows } from '../transfusion-registration/registration-transfusion-table';
import {
  clearComponentRequestSelection,
  clearProtocolHemacon,
  clearRegistrationTable,
} from './working-form-cleanup';

it('clears the entire hemacon while retaining all other protocol sections', () => {
  const hemacon = {
    componentName: 'Эритроцитная взвесь',
    collectionOrganization: 'Станция крови',
    componentUnitNumber: '76102200045636',
    amountMl: '250',
    collectionDate: '2026-10-01',
    expirationDate: '2026-11-01',
    donorAbo: 'A(II)',
    donorRh: 'Rh(+)',
    donorAntigens: 'C+ c−',
    donorAntigenC: '+',
    donorAntigenc: '−',
    donorAntigenCw: '−',
    donorAntigenE: '−',
    donorAntigene: '+',
    donorAntigenK: '−',
    donorAntigenk: '+',
  };
  const other = {
    recipientId: '1',
    recipientName: 'Рабочий реципиент',
    recipientAbo: 'A(II)',
    componentGroup: 'erythrocytes',
    indicationComponent: 'erythrocytes',
    indications: 'Рабочие показания',
    transfusionDate: '2026-10-26',
    startTime: '10:00',
    planeTestResult: 'Совместимо',
    beforePulse: '70',
    reagentAntiASeries: 'Серия цоликлона',
    doctorName: 'Врач',
    nurseName: 'Медсестра',
  };
  const original = { ...other, ...hemacon };
  expect(clearProtocolHemacon(original)).toEqual({
    ...other,
    ...Object.fromEntries(Object.keys(hemacon).map((name) => [name, ''])),
  });
  expect(original).toEqual({ ...other, ...hemacon });
});

it('clears only the registration table', () => {
  const draft = {
    recipientId: '1',
    recipientName: 'Рабочий реципиент',
    recipientBirthDate: '1980-01-02',
    medicalRecordNumber: '123',
    department: 'ОРИТ',
    registrationTransfusionRows: JSON.stringify([{ protocolId: 42, componentName: 'Компонент' }]),
  };
  const next = clearRegistrationTable(draft);
  expect(next).toEqual({ ...draft, registrationTransfusionRows: '[]' });
  expect(parseRegistrationTransfusionRows(next)).toEqual([]);
  expect(parseRegistrationTransfusionRows(draft)).toHaveLength(1);
});

it('clears requested component details while preserving indications and request information', () => {
  const draft = {
    sourceRecipientId: '1',
    recipientName: 'Рабочий реципиент',
    requiredComponent: 'Эритроцитная взвесь',
    componentAbo: 'A(II)',
    componentRh: 'Rh(+)',
    quantity: '2',
    transfusionOrder: 'planned',
    componentSelectionRequirement: 'individual',
    individualSelectionIndications: 'Рабочие показания',
    indicationValues: { indicationComponent: 'erythrocytes', indications: 'Анемия' },
    medicalOrganization: 'ЛПУ',
    directionDate: '2026-10-26',
    doctorName: 'Врач',
    doctorPhone: '12345',
    recipientProfileSnapshot: { diagnosis: 'Рабочий диагноз' },
  };
  expect(clearComponentRequestSelection(draft)).toEqual({
    ...draft,
    requiredComponent: '',
    componentAbo: '',
    componentRh: '',
    quantity: '',
  });
  expect(draft.requiredComponent).toBe('Эритроцитная взвесь');
});
