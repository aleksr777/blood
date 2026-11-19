// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PatientDetailsFields } from './patient-details-fields';

vi.mock('../../storage/repositories/departments', () => ({
  loadDepartments: vi.fn(async () => []),
}));
afterEach(cleanup);

it('edits patient identity and admission fields in the shared modal section', () => {
  const onChange = vi.fn();
  render(
    <PatientDetailsFields
      values={{ recipientName: 'Иванов', recipientBirthDate: '1980-01-02' }}
      onChange={onChange}
      onOpenRecipients={vi.fn()}
      onSelectRecipient={vi.fn()}
    />,
  );
  const group = within(screen.getByRole('group', { name: 'Данные реципиента' }));
  expect(group.getByText('Возраст')).toBeTruthy();
  expect(group.getByText('Пол')).toBeTruthy();
  fireEvent.change(group.getByRole('textbox', { name: 'Фамилия, имя, отчество реципиента' }), {
    target: { value: 'Петров' },
  });
  fireEvent.change(group.getByLabelText('№ медицинской карты'), { target: { value: '123' } });
  fireEvent.change(group.getByLabelText('Отделение'), { target: { value: 'ОРИТ' } });
  fireEvent.change(group.getByLabelText('Диагноз'), { target: { value: 'Анемия' } });
  expect(onChange.mock.calls.map(([patch]) => patch)).toEqual([
    { recipientName: 'Петров' },
    { medicalRecordNumber: '123' },
    { department: 'ОРИТ' },
    { diagnosis: 'Анемия' },
  ]);
});

it('preserves the identity in an archived document while allowing the diagnosis to be edited', () => {
  const onChange = vi.fn();
  render(
    <PatientDetailsFields
      values={{ recipientName: 'Иванов', recipientBirthDate: '1980-01-02' }}
      onChange={onChange}
      savedDocument
      archivedAge="40 лет"
    />,
  );
  const group = within(screen.getByRole('group', { name: 'Данные реципиента' }));
  expect(
    (group.getByLabelText('Фамилия, имя, отчество реципиента') as HTMLInputElement).readOnly,
  ).toBe(true);
  expect(group.getByText('40 лет')).toBeTruthy();
  expect(group.queryByRole('button', { name: 'Новый' })).toBeNull();
  fireEvent.change(group.getByLabelText('Диагноз'), { target: { value: 'Анемия' } });
  expect(onChange).toHaveBeenCalledWith({ diagnosis: 'Анемия' });
});
