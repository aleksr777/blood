// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { FormInput } from './form-input';

afterEach(cleanup);

it('opens a custom calendar and stores the selected date in ISO format', () => {
  const changed = vi.fn();
  const Example = () => {
    const [value, setValue] = useState('2026-11-18');
    return (
      <FormInput
        type="date"
        aria-label="Дата рождения"
        value={value}
        onValueChange={(next) => {
          changed(next);
          setValue(next);
        }}
      />
    );
  };
  render(<Example />);
  const input = screen.getByLabelText('Дата рождения') as HTMLInputElement;
  expect(input.type).toBe('text');
  expect(input.value).toBe('18.11.2026');
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать дату' }));
  const picker = screen.getByRole('dialog', { name: 'Выбор даты' });
  fireEvent.click(within(picker).getByRole('button', { name: '21 ноября 2026 г.' }));
  expect(changed).toHaveBeenCalledWith('2026-11-21');
  expect(input.value).toBe('21.11.2026');
  expect(screen.queryByRole('dialog', { name: 'Выбор даты' })).toBeNull();
});

it('changes the calendar year without clicking through many months and supports escape', () => {
  const onValueChange = vi.fn();
  render(
    <FormInput type="date" aria-label="Дата рождения" value="" onValueChange={onValueChange} />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать дату' }));
  const picker = screen.getByRole('dialog', { name: 'Выбор даты' });
  fireEvent.change(within(picker).getByRole('textbox', { name: 'Год календаря' }), {
    target: { value: '2005' },
  });
  fireEvent.keyDown(within(picker).getByRole('textbox', { name: 'Год календаря' }), {
    key: 'Enter',
  });
  expect(within(picker).getAllByRole('button', { name: /2005 г\./ }).length).toBeGreaterThan(0);
  fireEvent.click(within(picker).getAllByRole('button', { name: /2005 г\./ })[5]);
  expect(onValueChange).toHaveBeenCalledWith(expect.stringMatching(/^2005-\d{2}-\d{2}$/));
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать дату' }));
  const reopened = screen.getByRole('dialog', { name: 'Выбор даты' });
  fireEvent.keyDown(reopened, { key: 'Escape' });
  expect(screen.queryByRole('dialog', { name: 'Выбор даты' })).toBeNull();
  expect(onValueChange).toHaveBeenCalledTimes(1);
});

it('accepts a manually entered date and time while rejecting an impossible time', () => {
  const Example = () => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    return (
      <>
        <FormInput type="date" aria-label="Дата" value={date} onValueChange={setDate} />
        <FormInput type="time" aria-label="Время" value={time} onValueChange={setTime} />
        <output>{`${date}T${time}`}</output>
      </>
    );
  };
  render(<Example />);
  const date = screen.getByLabelText('Дата') as HTMLInputElement;
  const time = screen.getByLabelText('Время') as HTMLInputElement;
  fireEvent.focus(date);
  fireEvent.change(date, { target: { value: '29.02.2024' } });
  fireEvent.focus(time);
  fireEvent.change(time, { target: { value: '24:00' } });
  expect(screen.getByText('2024-02-29T')).toBeTruthy();
  fireEvent.change(time, { target: { value: '9:05' } });
  expect(screen.getByText('2024-02-29T09:05')).toBeTruthy();
  fireEvent.blur(time);
  expect(time.value).toBe('09:05');
});

it('renders the calendar above the scrollable area of a modal window', () => {
  render(
    <dialog open>
      <div style={{ overflowY: 'auto' }}>
        <FormInput type="date" aria-label="Дата" value="2026-11-18" />
      </div>
    </dialog>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать дату' }));
  expect(screen.getByRole('dialog', { name: 'Выбор даты' }).parentElement?.tagName).toBe('DIALOG');
});
