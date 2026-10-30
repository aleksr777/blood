// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { PropsWithChildren } from 'react';
import { PrintSavePrompt } from './print-save-prompt';

vi.mock('../modal/modal', () => ({
  default: ({
    title,
    children,
    onClose,
  }: PropsWithChildren<{ title: string; onClose: () => void }>) => (
    <section role="dialog" aria-label={title}>
      <button onClick={onClose}>Close modal</button>
      {children}
    </section>
  ),
}));
afterEach(cleanup);
const finishPrint = () => act(() => window.dispatchEvent(new Event('afterprint')));

it('asks after printing and saves only on explicit confirmation', () => {
  const onSave = vi.fn(async () => true);
  render(<PrintSavePrompt canSave editing={false} onSave={onSave} />);
  expect(screen.queryByRole('dialog')).toBeNull();
  finishPrint();
  expect(screen.getByText('Сохранить бланк в базе реципиентов?')).toBeTruthy();
  expect(onSave).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /^Сохранить$/ }));
  expect(onSave).toHaveBeenCalledOnce();
  expect(screen.queryByRole('dialog')).toBeNull();
});

it.each(['Не сохранять', 'Close modal'])(
  '%s keeps the form unsaved and a later print asks again',
  (name) => {
    const onSave = vi.fn(async () => true);
    render(<PrintSavePrompt canSave editing={false} onSave={onSave} />);
    finishPrint();
    fireEvent.click(screen.getByRole('button', { name }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    finishPrint();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  },
);

it('asks about unsaved edits and stops asking once the update is committed', () => {
  const onSave = vi.fn(async () => true);
  const { rerender } = render(<PrintSavePrompt canSave editing onSave={onSave} />);
  finishPrint();
  expect(screen.getByText('В бланке есть несохранённые изменения. Сохранить их?')).toBeTruthy();
  rerender(<PrintSavePrompt canSave={false} editing onSave={onSave} />);
  expect(screen.queryByRole('dialog')).toBeNull();
  finishPrint();
  expect(screen.queryByRole('dialog')).toBeNull();
  rerender(<PrintSavePrompt canSave editing onSave={onSave} />);
  expect(screen.queryByRole('dialog')).toBeNull();
  finishPrint();
  expect(screen.getByRole('dialog')).toBeTruthy();
});

it('ignores unchanged documents and removes the print listener when leaving the page', () => {
  const onSave = vi.fn(async () => true);
  const { unmount } = render(<PrintSavePrompt canSave={false} editing={false} onSave={onSave} />);
  finishPrint();
  expect(screen.queryByRole('dialog')).toBeNull();
  unmount();
  finishPrint();
  expect(onSave).not.toHaveBeenCalled();
});
