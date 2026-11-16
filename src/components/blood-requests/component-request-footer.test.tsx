// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { database } from '../../storage/sqlite/database-client';
import { adoptCurrentRecipientFromValues } from '../../storage/repositories/current-recipient';
import { ComponentRequest } from './component-request';

vi.mock('../../storage/sqlite/database-client', () => ({
  database: {
    loadProtocolDraft: vi.fn(async () => ({ values: {}, protocolRecordId: null, updatedAt: 0 })),
    listSavedOptions: vi.fn(async () => []),
    rememberSavedOption: vi.fn(async () => []),
    listDepartments: vi.fn(async () => []),
    rememberDepartment: vi.fn(async () => []),
    saveBloodRequestRecord: vi.fn(async ({ values }) => ({
      id: 1,
      recipientId: 1,
      kind: 'component-request',
      values,
      createdAt: 1,
      updatedAt: 1,
    })),
  },
}));
const key = 'blood:component-request-direction-draft';
const profile = { recipientId: '1', recipientName: 'Тестовый реципиент' };
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  vi.stubGlobal('matchMedia', () => ({ matches: true, addListener() {}, removeListener() {} }));
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.setAttribute('open', '');
      },
    },
    close: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.removeAttribute('open');
      },
    },
  });
  adoptCurrentRecipientFromValues(profile);
  window.localStorage.setItem(
    key,
    JSON.stringify({
      sourceRecipientId: '1',
      recipientName: profile.recipientName,
      recipientProfileSnapshot: profile,
      doctorName: 'Первый врач',
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('edits and saves the same doctor from the second page and the first page', async () => {
  render(<ComponentRequest />);
  const page1 = screen.getByRole('region', { name: /страница 1/ });
  const page2 = screen.getByRole('region', { name: /страница 2/ });
  expect(within(page1).getByText('Первый врач')).toBeTruthy();
  expect(within(page2).getByText('Первый врач')).toBeTruthy();
  fireEvent.click(within(page2).getByRole('button', { name: 'Получил компоненты крови' }));
  const dialog = await screen.findByRole('dialog', { name: 'Подпись врача' });
  fireEvent.change(within(dialog).getByRole('textbox', { name: 'Врач, проводящий трансфузию' }), {
    target: { value: 'Второй врач' },
  });
  expect(within(page1).getByText('Второй врач')).toBeTruthy();
  expect(within(page2).getByText('Второй врач')).toBeTruthy();
  fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Подпись врача' })).toBeNull());
  fireEvent.click(within(page1).getByText('Второй врач'));
  const secondDialog = await screen.findByRole('dialog', { name: 'Подпись врача' });
  fireEvent.change(
    within(secondDialog).getByRole('textbox', { name: 'Врач, проводящий трансфузию' }),
    { target: { value: 'Третий врач' } },
  );
  expect(within(page2).getByText('Третий врач')).toBeTruthy();
  fireEvent(secondDialog, new Event('cancel', { bubbles: true, cancelable: true }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Подпись врача' })).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: /^Сохранить$/ }));
  await waitFor(() => expect(database.saveBloodRequestRecord).toHaveBeenCalledOnce());
  expect(vi.mocked(database.saveBloodRequestRecord).mock.calls[0][0].values.doctorName).toBe(
    'Третий врач',
  );
  expect(within(page1).getByText('Третий врач')).toBeTruthy();
  expect(within(page2).getByText('Третий врач')).toBeTruthy();
});
