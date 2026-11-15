// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { database } from '../../storage/sqlite/database-client';
import {
  adoptCurrentRecipientFromValues,
  readCurrentRecipient,
} from '../../storage/repositories/current-recipient';
import { IndividualSelectionDirection } from './individual-selection-direction';

vi.mock('../../storage/sqlite/database-client', () => ({
  database: {
    loadProtocolDraft: vi.fn(async () => ({ values: {}, protocolRecordId: null, updatedAt: 0 })),
    listProtocolRecords: vi.fn(async () => []),
    saveBloodRequestRecord: vi.fn(),
  },
}));
const storageKey = 'blood:individual-selection-direction-draft';
const profile = {
  recipientId: '1',
  recipientName: 'Тестовый реципиент',
  recipientBirthDate: '1980-01-02',
  recipientSex: 'Мужской',
  diagnosis: 'Диагноз',
  medicalRecordNumber: '123',
  department: 'ОРИТ',
};
const readDraft = () => JSON.parse(window.localStorage.getItem(storageKey)!);
const clearButton = () =>
  screen.getByRole('button', { name: 'Очистить бланк' }) as HTMLButtonElement;
const saveButton = () => screen.getByRole('button', { name: 'Сохранить' }) as HTMLButtonElement;
const open = async (values = {}) => {
  window.localStorage.setItem(storageKey, JSON.stringify({ sourceRecipientId: '1', ...values }));
  render(<IndividualSelectionDirection />);
  await waitFor(() => expect(readDraft().recipientName).toBe(profile.recipientName));
};
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  adoptCurrentRecipientFromValues(profile);
});
afterEach(cleanup);

it('disables clearing for recipient data and the default erythrocyte group alone', async () => {
  await open();
  expect(clearButton().disabled).toBe(true);
  expect(saveButton().disabled).toBe(true);
});

it('ignores obsolete shared indications and keeps the blank form empty', async () => {
  window.localStorage.setItem('blood:current-indications', JSON.stringify({ recipientId: 1 }));
  await open();
  expect(clearButton().disabled).toBe(true);
  expect(saveButton().disabled).toBe(true);
});

it('clears its own fields and indications while preserving recipient data', async () => {
  const recipient = readCurrentRecipient();
  await open({
    requiredComponent: 'Отмытые эритроциты',
    quantity: '2',
    medicalOrganization: 'ЛПУ',
    directionDate: '2026-10-30',
    doctorName: 'Врач',
    doctorPhone: '123',
    individualSelectionIndications: 'Показания к подбору',
    indicationValues: {
      componentGroup: 'erythrocytes',
      indicationComponent: 'erythrocytes',
      indicationRbcOngoingBleeding: '1',
    },
  });
  expect(clearButton().disabled).toBe(false);
  fireEvent.click(clearButton());
  await waitFor(() => expect(readDraft().requiredComponent).toBe(''));
  for (const field of [
    'requiredComponent',
    'quantity',
    'medicalOrganization',
    'directionDate',
    'doctorName',
    'doctorPhone',
  ])
    expect(readDraft()[field]).toBe('');
  expect(readDraft()).toMatchObject({
    recipientName: profile.recipientName,
    diagnosis: profile.diagnosis,
    medicalRecordNumber: profile.medicalRecordNumber,
    individualSelectionIndications: '',
    indicationValues: { componentGroup: 'erythrocytes' },
  });
  expect(readCurrentRecipient()).toEqual(recipient);
  expect(clearButton().disabled).toBe(true);
  expect(saveButton().disabled).toBe(true);
  expect(database.saveBloodRequestRecord).not.toHaveBeenCalled();
  cleanup();
  render(<IndividualSelectionDirection />);
  await waitFor(() => expect(clearButton().disabled).toBe(true));
});

it('returns a non-default group to erythrocytes and then disables clearing', async () => {
  await open({
    indicationValues: { componentGroup: 'platelets', indicationComponent: 'platelets' },
  });
  expect(clearButton().disabled).toBe(false);
  fireEvent.click(clearButton());
  await waitFor(() => expect(clearButton().disabled).toBe(true));
  expect(readDraft().indicationValues.componentGroup).toBe('erythrocytes');
  expect(saveButton().disabled).toBe(true);
});
