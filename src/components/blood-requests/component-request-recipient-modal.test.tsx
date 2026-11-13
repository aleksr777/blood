// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { adoptCurrentRecipientFromValues } from '../../storage/repositories/current-recipient';
import { ComponentRequest } from './component-request';

vi.mock('../../storage/sqlite/database-client', () => ({
  database: {
    loadProtocolDraft: vi.fn(async () => ({ values: {}, protocolRecordId: null, updatedAt: 0 })),
    listSavedOptions: vi.fn(async () => []),
    rememberSavedOption: vi.fn(async () => []),
    listDepartments: vi.fn(async () => []),
    rememberDepartment: vi.fn(async () => []),
  },
}));

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  adoptCurrentRecipientFromValues({
    recipientId: '1',
    recipientName: 'Иванов Иван Иванович',
    recipientBirthDate: '1980-01-15',
    medicalRecordNumber: '123',
    diagnosis: 'Анемия',
    recipientAbo: 'A(II)',
    recipientRh: 'Rh(+)',
  });
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
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('открывает одно окно для граф 1–5 с данными и обследованием реципиента', () => {
  render(<ComponentRequest />);
  const cells = screen
    .getByRole('table', { name: 'Графы 1–12 заявки' })
    .querySelectorAll('tbody td');
  fireEvent.click(cells[4]);
  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.getByText('Данные реципиента')).toBeTruthy();
  expect(dialog.getByText('Группа крови и антигены реципиента')).toBeTruthy();
  expect(dialog.getByText('Группа крови AB0')).toBeTruthy();
  expect(dialog.getByText('Резус-принадлежность')).toBeTruthy();
  expect(dialog.getByText('Антигены:')).toBeTruthy();
  expect(dialog.getByText('Диагноз')).toBeTruthy();
  expect(dialog.getByText('№ медицинской карты')).toBeTruthy();
});
