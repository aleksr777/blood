// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { database } from '../../storage/sqlite/database-client';
import { readCurrentRecipient } from '../../storage/repositories/current-recipient';
import {
  loadRegistrationDraft,
  saveRegistrationDraft,
} from '../../storage/repositories/registration-draft';
import { formatRecipientAge } from '../transfusion-protocol/recipient-demographics';
import { TransfusionRegistration } from './transfusion-registration';

vi.mock('../../storage/sqlite/database-client', () => ({
  database: { saveRegistrationRecord: vi.fn() },
}));
vi.mock('../../storage/repositories/registration-draft', () => ({
  loadRegistrationDraft: vi.fn(),
  saveRegistrationDraft: vi.fn(async () => undefined),
  clearRegistrationDraft: vi.fn(async () => undefined),
}));

const working = {
  recipientId: '1',
  recipientName: 'Рабочий реципиент',
  recipientBirthDate: '1980-01-02',
  recipientAge: formatRecipientAge('1980-01-02'),
  recipientSex: 'Мужской',
  medicalRecordNumber: '123',
  department: 'ОРИТ',
  registrationTransfusionRows: JSON.stringify([
    { protocolId: 7, componentName: 'Рабочая таблица' },
  ]),
};
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.mocked(loadRegistrationDraft).mockResolvedValue({
    values: working,
    registrationRecordId: null,
    updatedAt: 1,
  });
  vi.mocked(database.saveRegistrationRecord).mockImplementation(async (values) => ({
    id: 42,
    recipientId: 1,
    values,
    createdAt: 1,
    updatedAt: 1,
  }));
});
afterEach(cleanup);

const expectEmptyWorkingTable = async () => {
  await waitFor(() =>
    expect(saveRegistrationDraft).toHaveBeenLastCalledWith(
      expect.objectContaining({ values: { ...working, registrationTransfusionRows: '[]' } }),
    ),
  );
  expect(readCurrentRecipient()?.id).toBe(1);
  expect(screen.queryByText('Рабочая таблица')).toBeNull();
};

it.each(['view', 'edit'] as const)(
  'clears only the working table when returning from %s',
  async (mode) => {
    window.sessionStorage.setItem(
      'blood:registration-open-record',
      JSON.stringify({
        record: {
          id: 42,
          recipientId: 2,
          values: { recipientId: '2', recipientName: 'Архивный реципиент' },
        },
        mode,
      }),
    );
    render(<TransfusionRegistration />);
    await waitFor(() => expect(readCurrentRecipient()?.id).toBe(1));
    fireEvent.click(screen.getByRole('button', { name: 'К созданию нового бланка' }));
    await expectEmptyWorkingTable();
    expect(database.saveRegistrationRecord).not.toHaveBeenCalled();
  },
);

it('keeps all non-table data when saving a working sheet and returning to it', async () => {
  const { container } = render(<TransfusionRegistration />);
  await waitFor(() => expect(readCurrentRecipient()?.id).toBe(1));
  fireEvent.click(screen.getByRole('button', { name: /^Сохранить$/ }));
  await screen.findByRole('button', { name: 'К созданию нового бланка' });
  expect(container.querySelector('main')?.getAttribute('data-document-mode')).toBe('edit');
  expect(screen.getByRole('button', { name: 'Сохранить' }).hasAttribute('disabled')).toBe(true);
  expect(screen.getByText('Рабочая таблица')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'К созданию нового бланка' }));
  await expectEmptyWorkingTable();
  expect(database.saveRegistrationRecord).toHaveBeenCalledOnce();
  expect(database.saveRegistrationRecord).toHaveBeenCalledWith(working);
});
