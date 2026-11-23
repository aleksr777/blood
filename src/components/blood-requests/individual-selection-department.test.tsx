// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { adoptCurrentRecipientFromValues } from '../../storage/repositories/current-recipient';
import { IndividualSelectionDirection } from './individual-selection-direction';

vi.mock('../../storage/sqlite/database-client', () => ({
  database: {
    loadProtocolDraft: vi.fn(async () => ({ values: {}, protocolRecordId: null, updatedAt: 0 })),
    listProtocolRecords: vi.fn(async () => []),
    listDepartments: vi.fn(async () => []),
    listSavedOptions: vi.fn(async () => []),
  },
}));
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

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  adoptCurrentRecipientFromValues({
    recipientId: '1',
    recipientName: 'Тестовый реципиент',
    recipientSex: 'Женский',
  });
});
afterEach(cleanup);

it('highlights recipient and history rows as separate groups', async () => {
  const { container } = render(<IndividualSelectionDirection />);
  const organization = screen.getAllByText('Наименование ЛПУ:')[0].closest('[data-form-section]');
  const department = screen.getAllByText('Отделение:')[0].closest('[data-form-section]');
  const recipientName = screen.getAllByText('Ф.И.О. реципиента:')[0].closest('[data-form-section]');
  const bloodGroup = screen
    .getAllByText('Группа крови и резус-фактор реципиента:')[0]
    .closest('[data-form-section]');
  const antigens = screen.getAllByText('Фенотип реципиента:')[0].closest('[data-form-section]');
  const antibodies = screen
    .getAllByText('Аллоиммунные антитела:')[0]
    .closest('[data-form-section]');
  expect(department).toBe(recipientName);
  expect(bloodGroup).toBe(recipientName);
  expect(antigens).toBe(recipientName);
  expect(antibodies).toBe(recipientName);
  const history = screen
    .getAllByText('Трансфузии компонентов крови в анамнезе:')[0]
    .closest('[data-form-section]');
  const obstetric = (await screen.findAllByText('Акушерский анамнез у женщин:'))[0].closest(
    '[data-form-section]',
  );
  for (const section of [organization, department]) {
    expect(section?.hasAttribute('data-recipient-group')).toBe(true);
  }
  for (const section of [history, obstetric]) {
    expect(section?.hasAttribute('data-history-group')).toBe(true);
    expect(section?.hasAttribute('data-recipient-group')).toBe(false);
  }
  expect(department?.getAttribute('data-recipient-position')).toBe('last');
  expect(obstetric?.getAttribute('data-history-position')).toBe('last');
  const paper = container.querySelector('[data-document-paper]');
  fireEvent.mouseMove(organization!);
  expect(paper?.getAttribute('data-recipient-hovered')).toBe('true');
  expect(paper?.hasAttribute('data-history-hovered')).toBe(false);
  fireEvent.mouseMove(history!);
  expect(paper?.hasAttribute('data-recipient-hovered')).toBe(false);
  expect(paper?.getAttribute('data-history-hovered')).toBe('true');
  fireEvent.mouseMove(screen.getAllByText('Наименование требуемого компонента:')[0]);
  expect(paper?.hasAttribute('data-history-hovered')).toBe(false);
});

it('opens the recipient dialog with examination inputs from the blood group row', () => {
  render(<IndividualSelectionDirection />);
  fireEvent.click(screen.getAllByText('Группа крови и резус-фактор реципиента:')[0]);
  const dialog = screen.getByRole('dialog', { name: 'Данные реципиента' });
  const examination = within(dialog).getByRole('group', {
    name: 'Данные медицинского обследования реципиента',
  });
  expect(within(examination).getByRole('button', { name: 'Группа крови AB0' })).toBeTruthy();
  expect(within(examination).getByRole('button', { name: 'Резус-принадлежность' })).toBeTruthy();
  expect(within(examination).getByText('Антигены:')).toBeTruthy();
  expect(within(examination).getByRole('group', { name: 'Аллоиммунные антитела' })).toBeTruthy();
  expect(
    screen.queryByRole('dialog', { name: 'Данные медицинского обследования реципиента' }),
  ).toBeNull();
});

it('edits the organization name and patient data in one dialog', () => {
  render(<IndividualSelectionDirection />);
  fireEvent.click(screen.getAllByText('Наименование ЛПУ:')[0]);
  const dialog = screen.getByRole('dialog', { name: 'Данные реципиента' });
  expect(within(dialog).getByRole('textbox', { name: 'Наименование ЛПУ' })).toBeTruthy();
  expect(within(dialog).getByRole('textbox', { name: 'Отделение' })).toBeTruthy();
  expect(within(dialog).queryByRole('group', { name: 'Анамнез реципиента' })).toBeNull();
  expect(screen.queryByRole('dialog', { name: 'Медицинская организация' })).toBeNull();
});

it('opens the separate history dialog from the transfusion history row', () => {
  render(<IndividualSelectionDirection />);
  fireEvent.click(screen.getAllByText('Трансфузии компонентов крови в анамнезе:')[0]);
  const dialog = screen.getByRole('dialog', { name: 'Анамнез реципиента' });
  expect(
    within(dialog).getByRole('group', { name: 'Трансфузии компонентов крови в анамнезе' }),
  ).toBeTruthy();
  expect(within(dialog).getByText('Акушерский анамнез')).toBeTruthy();
  expect(screen.queryByRole('dialog', { name: 'Данные реципиента' })).toBeNull();
});
