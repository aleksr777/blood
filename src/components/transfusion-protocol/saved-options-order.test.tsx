// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SavedOptionsField } from './saved-options-field';

vi.mock('../../storage/repositories/saved-options', () => ({
  loadSavedOptions: vi.fn(async () => [
    { id: 5, value: 'Новый пользовательский вариант' },
    { id: 1, value: 'Старый пользовательский вариант' },
  ]),
  subscribeSavedOptions: () => () => undefined,
  rememberSavedOption: vi.fn(),
}));
afterEach(cleanup);

const isBefore = (first: Element, second: Element) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

it('shows newest editable values before older ones and before immutable presets', async () => {
  render(
    <SavedOptionsField
      name="componentName"
      label="Наименование"
      category="componentName:granulocytes"
      fixedOptions={['Фиксированный компонент']}
      value=""
      onChange={vi.fn()}
    />,
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Показать сохранённые варианты: Наименование' }),
  );
  const newest = await screen.findByRole('button', { name: 'Новый пользовательский вариант' });
  const older = screen.getByRole('button', { name: 'Старый пользовательский вариант' });
  const fixed = screen.getByRole('button', { name: 'Фиксированный компонент' });
  expect(isBefore(newest, older)).toBe(true);
  expect(isBefore(older, fixed)).toBe(true);
  expect(newest.closest('div')?.querySelector('[aria-label="Изменить значение"]')).toBeTruthy();
  expect(fixed.closest('div')?.querySelector('[aria-label="Изменить значение"]')).toBeNull();
});
