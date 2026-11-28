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
          onValueChange={(next) => {
            onChange(next);
            setValue(next);
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

it('does not save partial or impossible text and restores the last valid value on blur', () => {
  const onValueChange = vi.fn();
  render(
    <FormInput type="date" aria-label="Дата" value="2026-11-18" onValueChange={onValueChange} />,
  );
  const input = screen.getByLabelText('Дата') as HTMLInputElement;
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: '31.02.2026' } });
  expect(input.value).toBe('31.02.2026');
  expect(onValueChange).not.toHaveBeenCalled();
  fireEvent.blur(input);
  expect(input.value).toBe('18.11.2026');
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: '' } });
  expect(onValueChange).toHaveBeenCalledWith('');
});

it.each([
  {
    type: 'date',
    digits: '12032026',
    expected: ['1', '12.', '12.0', '12.03.', '12.03.2', '12.03.20', '12.03.202', '12.03.2026'],
    saved: '2026-03-12',
  },
  {
    type: 'time',
    digits: '0935',
    expected: ['0', '09:', '09:3', '09:35'],
    saved: '09:35',
  },
] as const)(
  'inserts separators during manual $type input and supports deleting them',
  ({ type, digits, expected, saved }) => {
    const onValueChange = vi.fn();
    const Example = () => {
      const [value, setValue] = useState('');
      return (
        <FormInput
          type={type}
          aria-label="Значение"
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    };
    render(<Example />);
    const input = screen.getByLabelText('Значение') as HTMLInputElement;
    fireEvent.focus(input);
    [...digits].forEach((digit, index) => {
      fireEvent.change(input, { target: { value: `${input.value}${digit}` } });
      expect(input.value).toBe(expected[index]);
    });
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(saved);
    fireEvent.change(input, { target: { value: '12' } });
    if (type === 'date') {
      input.setSelectionRange(3, 3);
      fireEvent.keyDown(input, { key: 'Backspace' });
      expect(input.value).toBe('1');
      fireEvent.change(input, { target: { value: '2026-03-12' } });
      expect(input.value).toBe('12.03.2026');
    } else {
      fireEvent.change(input, { target: { value: '12:34' } });
      input.setSelectionRange(2, 2);
      fireEvent.keyDown(input, { key: 'Delete' });
      expect(input.value).toBe('12:4');
    }
  },
);
