// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadRegistrationDraft } from '../../storage/repositories/registration-draft';
import { TransfusionRegistration } from './transfusion-registration';

vi.mock('../../storage/sqlite/database-client', () => ({ database: {} }));
vi.mock('../../storage/repositories/registration-draft', () => ({
  loadRegistrationDraft: vi.fn().mockResolvedValue({
    values: {},
    registrationRecordId: null,
    updatedAt: 0,
  }),
  saveRegistrationDraft: vi.fn(async () => undefined),
  clearRegistrationDraft: vi.fn(async () => undefined),
}));

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});
afterEach(cleanup);

it('opens a registration snapshot in StrictMode and loads the working draft separately', () => {
  window.sessionStorage.setItem(
    'blood:registration-open-record',
    JSON.stringify({
      id: 10,
      recipientId: 1,
      values: {
        recipientId: '1',
        recipientName: 'Иванов Иван Иванович',
        recipientBirthDate: '1980-01-02',
      },
      createdAt: 1,
      updatedAt: 1,
    }),
  );
  render(
    <StrictMode>
      <TransfusionRegistration />
    </StrictMode>,
  );
  expect(screen.getAllByText('Иванов Иван Иванович').length).toBeGreaterThan(0);
  expect(loadRegistrationDraft).toHaveBeenCalled();
  expect(screen.getByRole('button', { name: /^Редактировать$/ })).toBeDefined();
  expect(screen.getByRole('button', { name: /^Сохранить$/ }).hasAttribute('disabled')).toBe(true);
  expect(window.sessionStorage.getItem('blood:registration-open-record')).toBeNull();
});
