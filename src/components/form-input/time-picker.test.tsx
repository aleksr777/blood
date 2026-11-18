// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { FormInput } from './form-input';
import { DateTimeInputs } from './date-time-inputs';

afterEach(cleanup);

it('keeps one visible heading while both controls retain accessible labels', () => {
  render(
    <DateTimeInputs
      name="request"
      label="Дата и время подачи заявки"
      value=""
      onChange={() => {}}
    />,
  );
  const group = screen.getByRole('group', { name: 'Дата и время подачи заявки' });
  expect(within(group).queryByText('Дата')).toBeNull();
  expect(within(group).queryByText('Время')).toBeNull();
  expect(within(group).getByLabelText('Дата')).toBeTruthy();
  expect(within(group).getByLabelText('Время')).toBeTruthy();
});

it('shows only numeric hours and minutes and does not fill an incomplete selection', () => {
  const onChange = vi.fn();
  const Example = () => {
    const [value, setValue] = useState('');
    return (
      <FormInput
        type="time"
        aria-label="Время"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setValue(event.target.value);
        }}
      />
    );
  };
  render(<Example />);
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать время' }));
  const hours = within(screen.getByRole('listbox', { name: 'Часы' })).getAllByRole('option');
  const minutes = within(screen.getByRole('listbox', { name: 'Минуты' })).getAllByRole('option');
  expect(hours.map((option) => option.textContent)).toEqual(
    Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')),
  );
  expect(minutes.map((option) => option.textContent)).toEqual(
    Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')),
  );
  fireEvent.click(hours[7]);
  expect(onChange).not.toHaveBeenCalled();
  expect((screen.getByLabelText('Время') as HTMLInputElement).value).toBe('');
  fireEvent.click(minutes[5]);
  expect(onChange).toHaveBeenLastCalledWith('07:05');
  expect((screen.getByLabelText('Время') as HTMLInputElement).value).toBe('07:05');
  fireEvent.click(screen.getByRole('button', { name: 'Очистить время' }));
  expect(onChange).toHaveBeenLastCalledWith('');
});

it('changes an existing time without replacing the other component and closes on escape', () => {
  const change = vi.fn();
  const Example = () => {
    const [value, setValue] = useState('14:37');
    return (
      <FormInput
        type="time"
        aria-label="Время"
        value={value}
        onChange={(event) => {
          change(event.target.value);
          setValue(event.target.value);
        }}
      />
    );
  };
  render(<Example />);
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать время' }));
  const hours = screen.getByRole('listbox', { name: 'Часы' });
  expect(within(hours).getByRole('option', { name: '14' }).getAttribute('aria-selected')).toBe(
    'true',
  );
  fireEvent.click(within(hours).getByRole('option', { name: '09' }));
  expect(change).toHaveBeenLastCalledWith('09:37');
  fireEvent.keyDown(screen.getByRole('group', { name: 'Выбор времени' }), { key: 'Escape' });
  expect(screen.queryByRole('group', { name: 'Выбор времени' })).toBeNull();
});
