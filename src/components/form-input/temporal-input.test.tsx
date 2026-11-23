// @vitest-environment jsdom
import { createRef, useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { FormInput } from './form-input';
import { DateTimeInputs } from './date-time-inputs';

afterEach(cleanup);

it.each(['date', 'time'] as const)(
  'clears a controlled %s input through its normal change handler',
  (type) => {
    const onChange = vi.fn();
    const ref = createRef<HTMLInputElement>();
    const initial = type === 'date' ? '2026-11-18' : '08:30';
    const Example = () => {
      const [value, setValue] = useState(initial);
      return (
        <FormInput
          ref={ref}
          aria-label="Значение"
          type={type}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setValue(event.target.value);
          }}
        />
      );
    };
    render(<Example />);
    fireEvent.click(
      screen.getByRole('button', { name: type === 'date' ? 'Очистить дату' : 'Очистить время' }),
    );
    expect(onChange).toHaveBeenCalledExactlyOnceWith('');
    expect(ref.current?.value).toBe('');
    expect(document.activeElement).toBe(ref.current);
  },
);

it('clears only the chosen half of a combined saved value', () => {
  const Example = () => {
    const [value, setValue] = useState('2026-11-18T08:30');
    return (
      <>
        <DateTimeInputs name="requestDateTime" label="Заявка" value={value} onChange={setValue} />
        <output>{value}</output>
      </>
    );
  };
  render(<Example />);
  const group = screen.getByRole('group', { name: 'Заявка' });
  fireEvent.click(within(group).getByRole('button', { name: 'Очистить дату' }));
  expect(screen.getByText('T08:30')).toBeTruthy();
  fireEvent.click(within(group).getByRole('button', { name: 'Очистить время' }));
  expect((within(group).getByLabelText('Дата') as HTMLInputElement).value).toBe('');
  expect((within(group).getByLabelText('Время') as HTMLInputElement).value).toBe('');
});

it('respects read-only and disabled date fields', () => {
  const onChange = vi.fn();
  render(
    <>
      <FormInput
        type="date"
        aria-label="Только чтение"
        value="2026-11-18"
        readOnly
        onChange={onChange}
      />
      <FormInput type="time" aria-label="Отключено" value="08:30" disabled onChange={onChange} />
    </>,
  );
  expect(screen.queryByRole('button', { name: 'Очистить дату' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Выбрать дату' })).toBeNull();
  expect(
    (screen.getByRole('button', { name: 'Очистить время' }) as HTMLButtonElement).disabled,
  ).toBe(true);
  expect(onChange).not.toHaveBeenCalled();
});

it('opens the native date picker from its separate button', () => {
  render(<FormInput type="date" aria-label="Дата рождения" value="2026-11-18" readOnly={false} />);
  const input = screen.getByLabelText('Дата рождения') as HTMLInputElement;
  const showPicker = vi.fn();
  input.showPicker = showPicker;
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать дату' }));
  expect(showPicker).toHaveBeenCalledOnce();
  expect(input.value).toBe('2026-11-18');
});
