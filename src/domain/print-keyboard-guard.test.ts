// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { installPrintKeyboardGuard } from './print-keyboard-guard';

afterEach(() => {
  document.body.innerHTML = '';
});

it('blocks print shortcuts across keyboard layouts but leaves other shortcuts alone', () => {
  const cleanup = installPrintKeyboardGuard();
  const key = (options: KeyboardEventInit) =>
    window.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...options }),
    );
  expect(key({ key: 'з', code: 'KeyP', ctrlKey: true })).toBe(false);
  expect(key({ key: 'P', code: 'KeyP', metaKey: true, shiftKey: true })).toBe(false);
  expect(key({ key: 'p', ctrlKey: true })).toBe(false);
  expect(key({ key: 's', code: 'KeyS', ctrlKey: true })).toBe(true);
  cleanup();
  expect(key({ key: 'p', code: 'KeyP', ctrlKey: true })).toBe(true);
});

it('prevents keyboard activation of print buttons while allowing ordinary clicks and other buttons', () => {
  const cleanup = installPrintKeyboardGuard();
  document.body.innerHTML =
    '<button class="print-button"><span>Печать</span></button><button>Другое</button>';
  const button = document.querySelector('.print-button')!;
  const other = document.querySelectorAll('button')[1];
  const click = vi.fn();
  button.addEventListener('click', click);
  const key = (element: Element, value: string) =>
    element.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: value }),
    );
  expect(key(button.querySelector('span')!, 'Enter')).toBe(false);
  expect(key(button, ' ')).toBe(false);
  expect(key(other, 'Enter')).toBe(true);
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
  expect(click).toHaveBeenCalledOnce();
  cleanup();
});
