import { expect, it } from 'vitest';
import { hasDocumentContent, type DocumentContentKind } from './document-content';

const profile = {
  recipientId: '42',
  sourceRecipientId: '42',
  recipientName: 'Тестовый реципиент',
  recipientBirthDate: '2000-01-01',
  recipientAge: '26 лет',
  recipientSex: 'Женский',
  medicalRecordNumber: '123',
  diagnosis: 'Диагноз',
  department: 'ОРИТ',
  recipientAbo: 'A(II)',
  recipientRh: 'Rh(+)',
  recipientAboRh: 'A(II) Rh(+)',
  recipientPhenotype: 'C+ c+',
  recipientPregnanciesCount: '0',
  recipientBirthsCount: 'Не известно',
  alloimmuneAntibodyStatus: 'none',
  previousTransfusionsStatus: 'had',
  previousTransfusions: 'Переливания в анамнезе',
  previousTransfusionsAutoText: 'Сводка анамнеза',
  previousTransfusionsSuggestedText: 'Служебная подсказка',
  obstetricHistory: 'Беременностей не было',
  transfusionHistory: 'Анамнез',
};
const kinds: DocumentContentKind[] = [
  'protocol',
  'registration',
  'component-request',
  'individual-selection-direction',
];

it.each(kinds)('ignores an empty form and recipient-only data in %s', (kind) => {
  expect(hasDocumentContent(kind, {})).toBe(false);
  expect(
    hasDocumentContent(kind, {
      ...profile,
      recipientProfileSnapshot: profile,
      autoValues: { diagnosis: 'Диагноз' },
      registrationTransfusionRows: '[]',
      indicationValues: {},
      doctorName: '   ',
    }),
  ).toBe(false);
});

it('does not treat persistent reagent defaults as a filled protocol', () => {
  expect(
    hasDocumentContent('protocol', {
      ...profile,
      reagentAntiASeries: '123',
      reagentAntiAExpiration: '2027-01-01',
      reagentAntiAManufacturer: 'Производитель',
    }),
  ).toBe(false);
});

it('ignores the default erythrocyte group while detecting actual direction indications', () => {
  const indicationValues = { componentGroup: 'erythrocytes', indicationComponent: 'erythrocytes' };
  expect(
    hasDocumentContent('individual-selection-direction', { ...profile, indicationValues }),
  ).toBe(false);
  expect(
    hasDocumentContent('individual-selection-direction', {
      ...profile,
      indicationValues: { ...indicationValues, indicationRbcHemicHypoxia: '1' },
    }),
  ).toBe(true);
});

it.each([
  ['protocol', { componentGroup: 'erythrocytes' }],
  ['protocol', { componentName: 'Компонент' }],
  ['protocol', { beforeUrine: '0' }],
  ['protocol', { transfusionDate: '2026-10-29' }],
  ['component-request', { quantity: '1' }],
  ['component-request', { indicationValues: { componentGroup: 'platelets' } }],
  ['component-request', { transfusionOrder: 'emergency' }],
  ['individual-selection-direction', { doctorName: 'Врач' }],
  ['individual-selection-direction', { individualSelectionIndications: 'Показание' }],
] as const)('detects document data in %s', (kind, values) => {
  expect(hasDocumentContent(kind, { ...profile, ...values })).toBe(true);
});

it.each(['', '[]', ' [ ] ', 'null', '{}', '[null]', '[{}]', 'invalid'])(
  'treats an empty or unusable registration table %s as empty',
  (rows) => {
    expect(
      hasDocumentContent('registration', { ...profile, registrationTransfusionRows: rows }),
    ).toBe(false);
  },
);

it('enables registration actions only while an actual transfusion row is selected', () => {
  const values = {
    ...profile,
    registrationTransfusionRows: '[{"protocolId":42,"componentName":"Компонент"}]',
  };
  expect(hasDocumentContent('registration', values)).toBe(true);
  expect(hasDocumentContent('registration', { ...values, registrationTransfusionRows: '[]' })).toBe(
    false,
  );
});
