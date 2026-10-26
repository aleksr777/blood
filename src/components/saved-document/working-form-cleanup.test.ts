import { expect, it } from 'vitest';
import { parseRegistrationTransfusionRows } from '../transfusion-registration/registration-transfusion-table';
import {
  cleanComponentRequestDraft,
  cleanProtocolDraft,
  clearRegistrationTable,
} from './working-form-cleanup';

it('clears the entire hemacon while retaining all other protocol sections', () => {
  const hemacon = {
    componentName: 'Эритроцитная взвесь',
    collectionOrganization: 'Станция крови',
    componentUnitNumber: '76102200045636',
    amountMl: '250',
    startTime: '10:00',
    endTime: '11:00',
    beforePulse: '70',
    beforeBp: '120/80',
    beforeTemperature: '36.6',
    beforeUrine: '100',
    beforeUrineColor: 'Светлая',
    hour1Bp: '120/80',
    hour1Pulse: '70',
    hour1Temperature: '36.6',
    hour1Urine: '100',
    hour1UrineColor: 'Светлая',
    hour2Bp: '120/80',
    hour2Pulse: '70',
    hour2Temperature: '36.6',
    hour2Urine: '100',
    hour2UrineColor: 'Светлая',
    doctorName: 'Врач',
    nurseName: 'Медсестра',
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
    requestDateTime: '2026-10-26T09:00',
    planeTestResult: 'Совместимо',
    reagentAntiASeries: 'Серия цоликлона',
  };
  const original = { ...other, ...hemacon };
  expect(cleanProtocolDraft(original)).toEqual({
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
    recipientProfileSnapshot: { diagnosis: 'Рабочий диагноз' },
  };
  expect(cleanComponentRequestDraft(draft)).toEqual({
    ...draft,
    requiredComponent: '',
    componentAbo: '',
    componentRh: '',
    quantity: '',
    doctorName: '',
  });
  expect(draft.requiredComponent).toBe('Эритроцитная взвесь');
});
