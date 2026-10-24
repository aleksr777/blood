import { expect, it } from 'vitest';
import { updateSavedRequestProfile } from './saved-request-profile';

const draft = {
  recipientName: 'Сохранённое имя',
  medicalRecordNumber: 'Сохранённая карта',
  recipientAboRh: 'A(II) Rh(+)',
  recipientAge: '40 лет',
  diagnosis: 'Сохранённый диагноз',
  recipientProfileSnapshot: {
    recipientBirthDate: '1980-01-02',
    recipientName: 'Сохранённое имя',
    recipientAbo: 'A(II)',
    recipientRh: 'Rh(+)',
    diagnosis: 'Сохранённый диагноз',
  },
  autoValues: { recipientAge: '40 лет' },
};

it('changes only explicitly edited snapshot fields and keeps the remaining saved values', () => {
  const changed = updateSavedRequestProfile(draft, { medicalRecordNumber: 'Исправленная карта' });
  expect(changed).toMatchObject({ ...draft, medicalRecordNumber: 'Исправленная карта' });
  expect(changed.recipientProfileSnapshot).toEqual({
    ...draft.recipientProfileSnapshot,
    medicalRecordNumber: 'Исправленная карта',
  });
  expect(draft.medicalRecordNumber).toBe('Сохранённая карта');
});

it('combines an edited blood group with the saved Rh and computes age at the saved date', () => {
  const changed = updateSavedRequestProfile(
    draft,
    { recipientAbo: 'B(III)', recipientBirthDate: '1981-01-02' },
    Date.UTC(2020, 1, 3),
  );
  expect(changed).toMatchObject({
    recipientAboRh: 'B(III) Rh(+)',
    recipientAge: '39 лет',
    diagnosis: 'Сохранённый диагноз',
  });
  expect(changed.autoValues.recipientAge).toBe('39 лет');
  expect(draft.recipientAge).toBe('40 лет');
});
