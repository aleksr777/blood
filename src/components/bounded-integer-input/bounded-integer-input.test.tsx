// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BoundedIntegerInput } from './bounded-integer-input';

afterEach(cleanup);
const setup = (min: number, max: number, initial: string) => {
  const onChange = vi.fn();
  const Field = () => {
    const [value, setValue] = useState(initial);
    return (
      <label>
        Число
        <BoundedIntegerInput
          name="number"
          value={value}
          min={min}
          max={max}
          onChange={(next) => {
            onChange(next);
            setValue(next);
          }}
        />
      </label>
    );
  };
  render(<Field />);
  return { input: screen.getByRole('spinbutton') as HTMLInputElement, onChange };
};

it.each([
  [1, 99, '2'],
  [10, 999, '250'],
] as const)('restricts committed integers to %i–%i', (min, max, initial) => {
  const { input, onChange } = setup(min, max, initial);
  expect([input.min, input.max, input.step]).toEqual([String(min), String(max), '1']);
  for (const value of ['0', '-1', '1.5', '1e2', String(max + 1)]) {
    fireEvent.change(input, { target: { value } });
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe(initial);
  }
  for (const value of [String(min), String(max), '']) {
    fireEvent.change(input, { target: { value } });
    expect(onChange).toHaveBeenLastCalledWith(value);
    expect(input.value).toBe(value);
  }
});

it('allows typing the first digit of a volume without committing an incomplete value', () => {
  const { input, onChange } = setup(10, 999, '250');
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: '1' } });
  expect(input.value).toBe('1');
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.blur(input);
  expect(input.value).toBe('250');
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: '1' } });
  fireEvent.change(input, { target: { value: '10' } });
  fireEvent.blur(input);
  expect(input.value).toBe('10');
  expect(onChange).toHaveBeenLastCalledWith('10');
});

it('does not rewrite legacy values on opening', () => {
  const { input, onChange } = setup(10, 999, '5');
  expect(input.value).toBe('5');
  expect(onChange).not.toHaveBeenCalled();
});
