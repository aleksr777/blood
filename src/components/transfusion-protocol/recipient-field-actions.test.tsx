// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { RecipientField } from './recipient-field';

const repository = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn() }));
vi.mock('../../storage/repositories/recipients', () => ({
  getRecipientById: repository.get,
  updateRecipient: repository.update,
}));
vi.mock('./recipient-new-modal', () => ({
  RecipientNewModal: () => <section role="dialog" aria-label="Новый реципиент" />,
}));
vi.mock('./recipient-edit-modal', () => ({
  RecipientEditModal: ({
    onSave,
  }: PropsWithChildren<{ onSave: (values: Record<string, string>) => Promise<void> }>) => (
    <section role="dialog" aria-label="Данные реципиента">
      <button type="button" onClick={() => void onSave({ recipientName: 'Петров Иван' })}>
        Сохранить
      </button>
    </section>
  ),
}));
beforeEach(() => {
  repository.get.mockReset();
  repository.update.mockReset();
});
afterEach(cleanup);

it('puts the new-recipient action before the recipient list when no patient is selected', () => {
  const onOpenRecipients = vi.fn();
  render(
    <RecipientField
      value=""
      onChange={vi.fn()}
      onOpenRecipients={onOpenRecipients}
      onSelectRecipient={vi.fn()}
    />,
  );
  expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
    'Новый реципиент',
    'Реципиенты',
  ]);
  fireEvent.click(screen.getByRole('button', { name: 'Новый реципиент' }));
  expect(screen.getByRole('dialog', { name: 'Новый реципиент' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Реципиенты' }));
  expect(onOpenRecipients).toHaveBeenCalledOnce();
});

it('opens the selected patient record and applies edits to the current form', async () => {
  const original = { id: 7, fullName: 'Иванов Иван', profile: {} };
  const updated = { ...original, fullName: 'Петров Иван' };
  repository.get.mockResolvedValue(original);
  repository.update.mockResolvedValue(updated);
  const onSelectRecipient = vi.fn().mockResolvedValue(true);
  render(
    <RecipientField
      value={original.fullName}
      recipientId="7"
      onChange={vi.fn()}
      onOpenRecipients={vi.fn()}
      onSelectRecipient={onSelectRecipient}
    />,
  );
  expect(screen.queryByRole('button', { name: 'Новый реципиент' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Данные реципиента' }));
  await waitFor(() => expect(repository.get).toHaveBeenCalledWith(7));
  fireEvent.click(await screen.findByRole('button', { name: 'Сохранить' }));
  await waitFor(() =>
    expect(repository.update).toHaveBeenCalledWith(7, { recipientName: 'Петров Иван' }),
  );
  await waitFor(() => expect(onSelectRecipient).toHaveBeenCalledWith(updated));
});
