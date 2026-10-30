// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { bindModalScrollGuards } from './modal-scroll-guards';
import { addOpenDialog, removeOpenDialog } from './modal-scroll-lock';

let dialog: HTMLDialogElement;
let unbind: () => void;
beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  dialog = document.createElement('dialog');
  dialog.innerHTML =
    '<header><button>Закрыть</button></header><div data-modal-scroll-viewport></div>';
  document.body.append(dialog);
  dialog.querySelector<HTMLElement>('[data-modal-scroll-viewport]')!.scrollTo = vi.fn();
  addOpenDialog(dialog);
  unbind = bindModalScrollGuards(dialog);
});
afterEach(() => {
  unbind();
  removeOpenDialog(dialog);
  dialog.remove();
  vi.restoreAllMocks();
});

const keydown = (element: Element, key: string) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  element.dispatchEvent(event);
  return event;
};

it.each([
  '<button>Сохранить</button>',
  '<summary>Показать</summary>',
  '<div role="button" tabindex="0">Внести</div>',
])('allows the Space key to activate an interactive control: %s', (markup) => {
  const viewport = dialog.querySelector('[data-modal-scroll-viewport]')!;
  viewport.innerHTML = markup;
  expect(keydown(viewport.firstElementChild!, ' ').defaultPrevented).toBe(false);
});

it('does not scroll when a control already handled the keyboard event', () => {
  const button = dialog.querySelector('button')!;
  button.addEventListener('keydown', (event) => event.preventDefault());
  keydown(button, ' ');
  expect(
    dialog.querySelector<HTMLElement>('[data-modal-scroll-viewport]')!.scrollTo,
  ).not.toHaveBeenCalled();
});

it('still prevents scrolling the background from within a short modal', () => {
  expect(keydown(dialog, 'PageDown').defaultPrevented).toBe(true);
  const event = new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true });
  document.body.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
});
