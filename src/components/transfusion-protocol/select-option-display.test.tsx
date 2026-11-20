// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CustomSelectField } from './custom-select-field';
import { ObstetricCountField } from './obstetric-count-field';

afterEach(cleanup);

it('keeps the selected state in a custom list without displaying a checkmark', () => {
  render(
    <CustomSelectField
      name="result"
      label="Результат"
      options={['Первый', 'Второй']}
      value="Первый"
      onChange={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Результат' }));
  const list = screen.getByRole('listbox', { name: 'Результат' });
  const selected = within(list).getByRole('option', { name: 'Первый', selected: true });
  expect(selected.textContent).toBe('Первый');
  expect(list.textContent).not.toContain('✓');
});

it('keeps the selected count accessible without displaying a checkmark', () => {
  render(
    <ObstetricCountField
      name="count"
      label="Количество"
      value="2"
      maximum={3}
      onChange={vi.fn()}
    />,
  );
  const selected = screen.getByRole('radio', { name: 'Количество:' }) as HTMLInputElement;
  expect(selected.checked).toBe(true);
  expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('2');
  expect(document.body.textContent).not.toContain('✓');
});
