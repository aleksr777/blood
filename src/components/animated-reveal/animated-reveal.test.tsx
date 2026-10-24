// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AnimatedReveal } from './animated-reveal';

const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate');
let animations: Array<{ finish: () => void; cancel: ReturnType<typeof vi.fn> }>;
beforeEach(() => {
  animations = [];
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => new DOMRect(0, 0, 200, 64),
  );
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    value: vi.fn(() => {
      let finish = () => undefined as void;
      const finished = new Promise<void>((resolve) => {
        finish = resolve;
      });
      const cancel = vi.fn();
      animations.push({ finish, cancel });
      return { finished, cancel };
    }),
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (originalAnimate) Object.defineProperty(HTMLElement.prototype, 'animate', originalAnimate);
  else Reflect.deleteProperty(HTMLElement.prototype, 'animate');
});

const panel = (open: boolean) => (
  <AnimatedReveal open={open}>
    <button>Действие</button>
  </AnimatedReveal>
);
it('collapses smoothly while making closing controls inaccessible immediately', async () => {
  const { rerender, container } = render(panel(false));
  expect(screen.queryByRole('button')).toBeNull();
  rerender(panel(true));
  const root = container.querySelector<HTMLElement>('[data-animated-reveal]')!;
  expect(screen.getByRole('button')).toBeDefined();
  expect(root.inert).toBe(false);
  await act(async () => animations[animations.length - 1]!.finish());
  expect(root.style.height).toBe('auto');
  rerender(panel(false));
  expect(root.inert).toBe(true);
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByText('Действие')).toBeDefined();
  await act(async () => animations[animations.length - 1]!.finish());
  expect(screen.queryByText('Действие')).toBeNull();
  expect(root.style.height).toBe('0px');
});

it('ignores a cancelled closing completion when the panel is reopened quickly', async () => {
  const { rerender } = render(panel(true));
  await act(async () => animations[animations.length - 1]!.finish());
  rerender(panel(false));
  const closing = animations[animations.length - 1]!;
  rerender(panel(true));
  expect(closing.cancel).toHaveBeenCalled();
  await act(async () => closing.finish());
  expect(screen.getByRole('button')).toBeDefined();
});

it('keeps the UI usable when the browser has no animation API', () => {
  Reflect.deleteProperty(HTMLElement.prototype, 'animate');
  const { rerender, container } = render(panel(true));
  expect(screen.getByRole('button')).toBeDefined();
  expect(container.querySelector<HTMLElement>('[data-animated-reveal]')!.style.height).toBe('auto');
  rerender(panel(false));
  expect(screen.queryByText('Действие')).toBeNull();
});
