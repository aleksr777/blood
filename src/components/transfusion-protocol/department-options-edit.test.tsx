// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DepartmentField } from './department-field';

const storage = vi.hoisted(() => ({
  rename: vi.fn(async () => [{ id: 1, name: 'Новое отделение' }]),
  remove: vi.fn(async () => []),
}));
vi.mock('../../storage/repositories/departments', () => ({
  loadDepartments: vi.fn(async () => [{ id: 1, name: 'ОРИТ' }]),
  renameDepartment: storage.rename,
  removeDepartment: storage.remove,
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it('renames and deletes a saved department and updates the selected text', async () => {
  const Field = () => {
    const [value, setValue] = useState('ОРИТ');
    return <DepartmentField value={value} onChange={setValue} />;
  };
  render(<Field />);
  const input = screen.getByRole('textbox', { name: 'Отделение' }) as HTMLInputElement;
  fireEvent.click(screen.getByRole('button', { name: 'Показать ранее введённые отделения' }));
  await screen.findByRole('button', { name: 'ОРИТ' });
  fireEvent.click(screen.getByRole('button', { name: 'Изменить значение' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Изменить: Отделение' }), {
    target: { value: 'Новое отделение' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменение' }));
  await waitFor(() => expect(input.value).toBe('Новое отделение'));
  expect(storage.rename).toHaveBeenCalledWith(1, 'Новое отделение');
  expect(screen.getByRole('button', { name: 'Новое отделение' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Удалить значение' }));
  await waitFor(() => expect(input.value).toBe(''));
  expect(storage.remove).toHaveBeenCalledWith(1);
  expect(screen.queryByRole('button', { name: 'Новое отделение' })).toBeNull();
});

it('does not clear the field or list when deleting a department fails', async () => {
  storage.remove.mockRejectedValueOnce(new Error('Ошибка базы'));
  const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const Field = () => {
    const [value, setValue] = useState('ОРИТ');
    return <DepartmentField value={value} onChange={setValue} />;
  };
  render(<Field />);
  fireEvent.click(screen.getByRole('button', { name: 'Показать ранее введённые отделения' }));
  await screen.findByRole('button', { name: 'ОРИТ' });
  fireEvent.click(screen.getByRole('button', { name: 'Удалить значение' }));
  await waitFor(() => expect(log).toHaveBeenCalled());
  expect((screen.getByRole('textbox', { name: 'Отделение' }) as HTMLInputElement).value).toBe(
    'ОРИТ',
  );
  expect(screen.getByRole('button', { name: 'ОРИТ' })).toBeTruthy();
  log.mockRestore();
});
