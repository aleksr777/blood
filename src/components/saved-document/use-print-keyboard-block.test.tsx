// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { usePrintKeyboardBlock } from './use-print-keyboard-block';

const Page = () => {
  usePrintKeyboardBlock();
  return (
    <>
      <input aria-label="Поле" />
      <button className="print-button">Печать</button>
      <button>Другая кнопка</button>
    </>
  );
};
afterEach(cleanup);

it('blocks print shortcuts in different keyboard layouts without blocking unrelated shortcuts', () => {
  render(<Page />);
  const field = screen.getByLabelText('Поле');
  expect(fireEvent.keyDown(field, { key: 'з', code: 'KeyP', ctrlKey: true })).toBe(false);
  expect(fireEvent.keyDown(field, { key: 'p', code: 'KeyP', metaKey: true, shiftKey: true })).toBe(
    false,
  );
  expect(fireEvent.keyDown(field, { key: 's', code: 'KeyS', ctrlKey: true })).toBe(true);
});

it('blocks keyboard activation of print buttons while leaving clicks and other buttons usable', () => {
  render(<Page />);
  const print = screen.getByRole('button', { name: 'Печать' });
  const onClick = vi.fn();
  print.addEventListener('click', onClick);
  expect(fireEvent.keyDown(print, { key: 'Enter' })).toBe(false);
  expect(fireEvent.keyDown(print, { key: ' ' })).toBe(false);
  expect(
    fireEvent.keyDown(screen.getByRole('button', { name: 'Другая кнопка' }), { key: 'Enter' }),
  ).toBe(true);
  fireEvent.click(print);
  expect(onClick).toHaveBeenCalledOnce();
});
