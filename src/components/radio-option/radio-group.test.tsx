// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RadioGroup } from './radio-group';

afterEach(cleanup);

it('supports an optional default and can cancel it or select another option', () => {
  const onChange = vi.fn();
  render(
    <RadioGroup
      name="example"
      defaultValue="a"
      options={[
        { value: 'a', label: 'Первый' },
        { value: 'b', label: 'Второй' },
      ]}
      onChange={onChange}
    />,
  );
  const a = screen.getByRole('radio', { name: 'Первый' }) as HTMLInputElement;
  const b = screen.getByRole('radio', { name: 'Второй' }) as HTMLInputElement;
  expect(a.checked).toBe(true);
  fireEvent.click(a);
  expect(a.checked).toBe(false);
  expect(onChange).toHaveBeenLastCalledWith('');
  fireEvent.click(b);
  expect(b.checked).toBe(true);
  expect(onChange).toHaveBeenLastCalledWith('b');
  fireEvent.click(a);
  expect(a.checked).toBe(true);
  expect(b.checked).toBe(false);
});

it('does not select anything when no default is provided', () => {
  render(
    <RadioGroup name="example" options={[{ value: 'a', label: 'Первый' }]} onChange={vi.fn()} />,
  );
  expect((screen.getByRole('radio', { name: 'Первый' }) as HTMLInputElement).checked).toBe(false);
});
