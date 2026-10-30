// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BoundedNumberInput } from './bounded-number-input';

afterEach(cleanup);

const setup = (min: number, max: number, initial = '36.6') => {
  const onChange = vi.fn();
  const Field = () => {
    const [value, setValue] = useState(initial);
    return (
      <BoundedNumberInput
        name="value"
        value={value}
        min={min}
        max={max}
        step="any"
        onChange={(next) => {
          onChange(next);
          setValue(next);
        }}
      />
    );
  };
  render(<Field />);
  return { input: screen.getByRole('spinbutton') as HTMLInputElement, onChange };
};

it('accepts fractional values and both boundaries while rejecting out-of-range and exponential input', () => {
  const { input, onChange } = setup(20, 50);
  for (const value of ['19.9', '50.1', '-1', '2e1', '999']) {
    fireEvent.change(input, { target: { value } });
    expect(input.value).toBe('36.6');
    expect(onChange).not.toHaveBeenCalled();
  }
  for (const value of ['20', '37.5', '50', '']) {
    fireEvent.change(input, { target: { value } });
    expect(input.value).toBe(value);
    expect(onChange).toHaveBeenLastCalledWith(value);
  }
});

it('lets users type a temperature prefix without committing an out-of-range value', () => {
  const { input, onChange } = setup(20, 50);
  fireEvent.change(input, { target: { value: '2' } });
  expect(input.value).toBe('2');
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.blur(input);
  expect(input.value).toBe('36.6');
  fireEvent.change(input, { target: { value: '2' } });
  fireEvent.change(input, { target: { value: '25' } });
  fireEvent.change(input, { target: { value: '25.7' } });
  expect(onChange).toHaveBeenLastCalledWith('25.7');
});

it('accepts zero and fractional diuresis but never commits a value above 9999', () => {
  const { input, onChange } = setup(0, 9999, '150');
  for (const value of ['0', '0.5', '125.5', '9999']) {
    fireEvent.change(input, { target: { value } });
    expect(input.value).toBe(value);
    expect(onChange).toHaveBeenLastCalledWith(value);
  }
  onChange.mockClear();
  for (const value of ['-1', '10000', '9999.1', '1e3']) {
    fireEvent.change(input, { target: { value } });
    expect(input.value).toBe('9999');
    expect(onChange).not.toHaveBeenCalled();
  }
});

it('blocks sign and exponent keys while preserving keyboard shortcuts and decimal input', () => {
  const { input } = setup(20, 50);
  for (const key of ['e', 'E', '+', '-']) expect(fireEvent.keyDown(input, { key })).toBe(false);
  expect(fireEvent.keyDown(input, { key: '.' })).toBe(true);
  expect(fireEvent.keyDown(input, { key: 'e', ctrlKey: true })).toBe(true);
});

it('keeps legacy out-of-range values until the user changes them and honours read-only mode', () => {
  const onChange = vi.fn();
  const { rerender } = render(
    <BoundedNumberInput name="value" value="15" min={20} max={50} onChange={onChange} />,
  );
  const input = screen.getByRole('spinbutton') as HTMLInputElement;
  expect(input.value).toBe('15');
  expect(input.getAttribute('aria-invalid')).toBe('true');
  fireEvent.blur(input);
  expect(input.value).toBe('15');
  expect(onChange).not.toHaveBeenCalled();
  rerender(
    <BoundedNumberInput name="value" value="30" min={20} max={50} readOnly onChange={onChange} />,
  );
  expect(input.value).toBe('30');
  fireEvent.change(input, { target: { value: '40' } });
  expect(input.value).toBe('30');
  expect(onChange).not.toHaveBeenCalled();
});
