// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { RecipientNewModal } from './recipient-new-modal';
import { RecipientEditModal } from './recipient-edit-modal';

const state = vi.hoisted(() => ({ find: vi.fn() }));
vi.mock('../../storage/repositories/recipients', () => ({ findRecipientsByName: state.find }));
vi.mock('../modal/modal', () => ({
  default: ({ title, children }: PropsWithChildren<{ title: string }>) => (
    <section role="dialog" aria-label={title}>
      {children}
    </section>
  ),
  ModalDismissButton: ({ children }: PropsWithChildren) => (
    <button type="button">{children}</button>
  ),
}));
const existing = {
  id: 1,
  fullName: 'Иванов Иван Иванович',
  profile: { recipientBirthDate: '1980-01-01' },
  protocolCount: 0,
  registrationCount: 0,
  individualSelectionDirectionCount: 0,
  componentRequestCount: 0,
};
beforeEach(() => {
  state.find.mockReset().mockResolvedValue([]);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const fill = () => {
  fireEvent.change(screen.getByLabelText('Фамилия, имя, отчество'), {
    target: { value: existing.fullName },
  });
  fireEvent.change(screen.getByLabelText('Дата рождения'), { target: { value: '1990-02-03' } });
};

it('creates a recipient with the same complete data form and passes all entered profile fields', async () => {
  const onCreate = vi.fn();
  const onClose = vi.fn();
  render(<RecipientNewModal onCreate={onCreate} onExisting={vi.fn()} onClose={onClose} />);
  expect(screen.getByRole('dialog', { name: 'Новый реципиент' })).toBeTruthy();
  fill();
  fireEvent.change(screen.getByLabelText('Пол'), { target: { value: 'Женский' } });
  fireEvent.click(screen.getByRole('button', { name: 'Группа крови AB0' }));
  fireEvent.click(screen.getByRole('option', { name: 'A(II)' }));
  fireEvent.click(screen.getByRole('button', { name: 'Резус-принадлежность' }));
  fireEvent.click(screen.getByRole('option', { name: 'Rh(-)' }));
  fireEvent.click(screen.getByRole('button', { name: 'Создать' }));
  await waitFor(() =>
    expect(onCreate).toHaveBeenCalledWith(
      existing.fullName,
      expect.objectContaining({
        recipientName: existing.fullName,
        recipientBirthDate: '1990-02-03',
        recipientSex: 'Женский',
        recipientAbo: 'A(II)',
        recipientRh: 'Rh(-)',
        recipientPregnanciesCount: '0',
      }),
    ),
  );
  expect(onClose).toHaveBeenCalledOnce();
});

it('keeps the full draft when reviewing name matches before creating a separate recipient', async () => {
  state.find.mockResolvedValue([existing]);
  const onCreate = vi.fn();
  render(<RecipientNewModal onCreate={onCreate} onExisting={vi.fn()} onClose={vi.fn()} />);
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Создать' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Посмотреть данные совпадений' }));
  expect(onCreate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Вернуться к созданию нового' }));
  expect((screen.getByLabelText('Дата рождения') as HTMLInputElement).value).toBe('1990-02-03');
  fireEvent.click(screen.getByRole('button', { name: 'Создать' }));
  await waitFor(() =>
    expect(onCreate).toHaveBeenCalledWith(
      existing.fullName,
      expect.objectContaining({ recipientBirthDate: '1990-02-03' }),
    ),
  );
});

it('uses a matching card without applying the new draft to that recipient', async () => {
  state.find.mockResolvedValue([existing]);
  const onCreate = vi.fn();
  const onExisting = vi.fn();
  render(<RecipientNewModal onCreate={onCreate} onExisting={onExisting} onClose={vi.fn()} />);
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Создать' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Посмотреть данные совпадений' }));
  fireEvent.click(screen.getByRole('button', { name: 'Использовать реципиента' }));
  await waitFor(() => expect(onExisting).toHaveBeenCalledWith(existing));
  expect(onCreate).not.toHaveBeenCalled();
  expect(existing.profile.recipientBirthDate).toBe('1980-01-01');
});

it('renames the editing modal and saves changes through the shared form', async () => {
  const onSave = vi.fn();
  render(<RecipientEditModal recipient={existing} onSave={onSave} onClose={vi.fn()} />);
  expect(screen.getByRole('dialog', { name: 'Данные реципиента' })).toBeTruthy();
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ recipientBirthDate: '1990-02-03' }),
    ),
  );
});
