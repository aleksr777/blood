import { expect, it } from 'vitest';
import { preserveSavedRecipientIdentity } from './saved-recipient-identity';

it('preserves archived identity at both levels and accepts clinical edits without mutating the source', () => {
  const original = {
    recipientId: '2',
    sourceRecipientId: '2',
    recipientName: 'Сохранённое имя',
    medicalRecordNumber: 'Сохранённая карта',
    recipientBirthDate: '1980-01-02',
    recipientAge: '40 лет',
    diagnosis: 'Старый диагноз',
    recipientProfileSnapshot: {
      recipientName: 'Сохранённое имя',
      medicalRecordNumber: 'Сохранённая карта',
      recipientBirthDate: '1980-01-02',
      recipientAge: '40 лет',
      diagnosis: 'Старый диагноз',
    },
  };
  const changed = preserveSavedRecipientIdentity(original, {
    ...original,
    recipientId: '3',
    sourceRecipientId: '3',
    recipientName: 'Другое имя',
    medicalRecordNumber: 'Другая карта',
    recipientBirthDate: '1990-01-02',
    recipientAge: '50 лет',
    diagnosis: 'Правка',
    recipientProfileSnapshot: {
      recipientName: 'Другое имя',
      medicalRecordNumber: 'Другая карта',
      recipientBirthDate: '1990-01-02',
      recipientAge: '50 лет',
      diagnosis: 'Правка',
    },
  });
  expect(changed).toEqual({
    ...original,
    diagnosis: 'Правка',
    recipientProfileSnapshot: { ...original.recipientProfileSnapshot, diagnosis: 'Правка' },
  });
  expect(original.diagnosis).toBe('Старый диагноз');
});

it('does not inject missing identity values into legacy saved forms', () => {
  const original: Record<string, unknown> = {
    diagnosis: 'Старый диагноз',
    recipientProfileSnapshot: {},
  };
  const changed = preserveSavedRecipientIdentity(original, {
    recipientName: 'Текущее имя',
    recipientAge: '50 лет',
    diagnosis: 'Правка',
    recipientProfileSnapshot: {
      recipientName: 'Текущее имя',
      recipientAge: '50 лет',
      diagnosis: 'Правка',
    },
  });
  expect(changed).toEqual({
    diagnosis: 'Правка',
    recipientProfileSnapshot: { diagnosis: 'Правка' },
  });
});
