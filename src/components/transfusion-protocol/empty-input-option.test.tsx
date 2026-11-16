// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DepartmentField } from './department-field';
import { SavedOptionsField } from './saved-options-field';

vi.mock('../../storage/repositories/saved-options', () => ({
  loadSavedOptions: vi.fn(async () => [{ id: 1, value: 'Сохранённое' }]),
  subscribeSavedOptions: () => () => undefined,
}));
vi.mock('../../storage/repositories/departments', () => ({
  loadDepartments: vi.fn(async () => [{ id: 1, name: 'ОРИТ' }]),
}));
afterEach(cleanup);

it('clears a selected option, focuses the field, and keeps saved options available', async () => {
  const Field = () => {
    const [value, setValue] = useState('Готовое');
    return (
      <SavedOptionsField
        name="test"
        label="Показание"
        category="test"
        value={value}
        fixedOptions={['Готовое']}
        onChange={setValue}
      />
    );
  };
  render(<Field />);
  const input = screen.getByRole('textbox', { name: 'Показание' }) as HTMLInputElement;
  const toggle = screen.getByRole('button', { name: 'Показать сохранённые варианты: Показание' });
  fireEvent.click(toggle);
  const saved = await screen.findByRole('button', { name: 'Сохранённое' });
  const empty = screen.getByRole('button', { name: 'Очистить поле: Показание' });
  expect(empty.textContent).toBe('');
  expect(empty.compareDocumentPosition(saved) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  fireEvent.click(empty);
  expect(input.value).toBe('');
  expect(document.activeElement).toBe(input);
  fireEvent.change(input, { target: { value: 'Новое показание' } });
  expect(input.value).toBe('Новое показание');
  fireEvent.click(toggle);
  expect(screen.getByRole('button', { name: 'Сохранённое' })).toBeTruthy();
});

it('allows direct editing of a chosen department and offers controls without a blank option', async () => {
  const Field = () => {
    const [value, setValue] = useState('');
    return <DepartmentField value={value} onChange={setValue} />;
  };
  render(<Field />);
  const input = screen.getByRole('textbox') as HTMLInputElement;
  const toggle = screen.getByRole('button', { name: 'Показать ранее введённые отделения' });
  fireEvent.click(toggle);
  fireEvent.click(await screen.findByRole('button', { name: 'ОРИТ' }));
  expect(input.value).toBe('ОРИТ');
  expect(input.readOnly).toBe(false);
  fireEvent.change(input, { target: { value: 'ОРИТ 2' } });
  expect(input.value).toBe('ОРИТ 2');
  fireEvent.click(toggle);
  expect(screen.queryByRole('button', { name: 'Очистить поле: Отделение' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Изменить значение' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Удалить значение' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'ОРИТ' })).toBeTruthy();
});
