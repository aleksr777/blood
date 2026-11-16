// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SavedOptionsField } from './saved-options-field';

const storage = vi.hoisted(() => ({
  rename: vi.fn(async () => []),
  remove: vi.fn(async () => []),
}));
vi.mock('../../storage/repositories/saved-options', () => ({
  loadSavedOptions: vi.fn(async () => [{ id: 1, value: 'Свой вариант' }]),
  subscribeSavedOptions: () => () => undefined,
  renameSavedOption: storage.rename,
  removeSavedOption: storage.remove,
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const Field = ({ withFixed, initial = '' }: { withFixed: boolean; initial?: string }) => {
  const [value, setValue] = useState(initial);
  return (
    <SavedOptionsField
      name="test"
      label="Показание"
      category="test"
      value={value}
      fixedOptions={withFixed ? ['Встроенный'] : []}
      onChange={setValue}
    />
  );
};
const toggle = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Показать сохранённые варианты: Показание' }));

it('locks selected fixed and saved options until the blank option is selected', async () => {
  render(<Field withFixed />);
  const input = screen.getByRole('textbox', { name: 'Показание' }) as HTMLInputElement;
  toggle();
  fireEvent.click(screen.getByRole('button', { name: 'Встроенный' }));
  expect(input.value).toBe('Встроенный');
  expect(input.readOnly).toBe(true);
  toggle();
  fireEvent.click(screen.getByRole('button', { name: 'Очистить поле: Показание' }));
  expect(input.value).toBe('');
  expect(input.readOnly).toBe(false);
  fireEvent.change(input, { target: { value: 'Новое значение' } });
  expect(input.value).toBe('Новое значение');
  toggle();
  fireEvent.click(await screen.findByRole('button', { name: 'Свой вариант' }));
  expect(input.value).toBe('Свой вариант');
  expect(input.readOnly).toBe(true);
  toggle();
  expect(screen.getByRole('button', { name: 'Изменить значение' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Удалить значение' })).toBeTruthy();
});

it('restores read-only state for an already selected built-in option', () => {
  render(<Field withFixed initial="Встроенный" />);
  expect((screen.getByRole('textbox', { name: 'Показание' }) as HTMLInputElement).readOnly).toBe(
    true,
  );
});

it('allows direct editing and offers list controls when there are no fixed options', async () => {
  render(<Field withFixed={false} />);
  const input = screen.getByRole('textbox', { name: 'Показание' }) as HTMLInputElement;
  toggle();
  fireEvent.click(await screen.findByRole('button', { name: 'Свой вариант' }));
  expect(input.readOnly).toBe(false);
  fireEvent.change(input, { target: { value: 'Изменённый вариант' } });
  expect(input.value).toBe('Изменённый вариант');
  toggle();
  expect(screen.getByRole('button', { name: 'Изменить значение' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Удалить значение' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Очистить поле: Показание' })).toBeNull();
  expect(storage.rename).not.toHaveBeenCalled();
  expect(storage.remove).not.toHaveBeenCalled();
});

it('uses the list controls to rename and delete custom options when fixed choices exist', async () => {
  render(<Field withFixed />);
  toggle();
  await screen.findByRole('button', { name: 'Свой вариант' });
  fireEvent.click(screen.getByRole('button', { name: 'Изменить значение' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Изменить: Показание' }), {
    target: { value: 'Исправленный вариант' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменение' }));
  expect(storage.rename).toHaveBeenCalledWith('test', 1, 'Исправленный вариант');
  fireEvent.click(screen.getByRole('button', { name: 'Удалить значение' }));
  expect(storage.remove).toHaveBeenCalledWith('test', 1);
});
