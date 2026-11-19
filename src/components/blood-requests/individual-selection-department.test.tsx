// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { adoptCurrentRecipientFromValues } from '../../storage/repositories/current-recipient';
import { IndividualSelectionDirection } from './individual-selection-direction';

vi.mock('../../storage/sqlite/database-client', () => ({
  database: {
    loadProtocolDraft: vi.fn(async () => ({ values: {}, protocolRecordId: null, updatedAt: 0 })),
    listProtocolRecords: vi.fn(async () => []),
    listDepartments: vi.fn(async () => []),
    listSavedOptions: vi.fn(async () => []),
  },
}));
vi.mock('../modal/modal', () => ({
  default: ({ title, children }: PropsWithChildren<{ title: string }>) => (
    <section role="dialog" aria-label={title}>
      {children}
    </section>
  ),
  ModalDismissButton: ({ children }: PropsWithChildren) => (
    <button type="button">{children}</button>
  ),
}));

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  adoptCurrentRecipientFromValues({ recipientId: '1', recipientName: 'Тестовый реципиент' });
});
afterEach(cleanup);

it('opens recipient data from the department row and highlights it with recipient details', () => {
  render(<IndividualSelectionDirection />);
  const organization = screen.getAllByText('Наименование ЛПУ:')[0].closest('[data-form-section]');
  const department = screen.getAllByText('Отделение:')[0].closest('[data-form-section]');
  const recipientName = screen.getAllByText('Ф.И.О. реципиента:')[0].closest('[data-form-section]');
  expect(department).toBe(recipientName);
  expect(department).not.toBe(organization);
  fireEvent.click(screen.getAllByText('Отделение:')[0]);
  expect(screen.getByRole('dialog', { name: 'Данные реципиента' })).toBeTruthy();
  expect(screen.getByRole('textbox', { name: 'Отделение' })).toBeTruthy();
});

it('edits only the organization name in the medical organization dialog', () => {
  render(<IndividualSelectionDirection />);
  fireEvent.click(screen.getAllByText('Наименование ЛПУ:')[0]);
  expect(screen.getByRole('dialog', { name: 'Медицинская организация' })).toBeTruthy();
  expect(screen.getByText('Наименование ЛПУ')).toBeTruthy();
  expect(screen.queryByRole('textbox', { name: 'Отделение' })).toBeNull();
});
