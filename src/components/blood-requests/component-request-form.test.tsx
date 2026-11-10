// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ComponentRequestForm, type ComponentRequestFormValues } from './component-request-form';

afterEach(cleanup);

const request: ComponentRequestFormValues = {
  recipientName: 'Иванов Иван Иванович',
  recipientProfileSnapshot: { recipientBirthDate: '1980-01-15' },
  recipientAge: '46',
  diagnosis: 'Анемия',
  medicalRecordNumber: '1234',
  recipientAboRh: 'A(II) Rh(+)',
  recipientPhenotype: 'C+ c+ E− e+ K− k+',
  department: 'ОРИТ',
  departmentPhone: '123-45-67',
  requestDateTime: '2026-11-10T09:30',
  plannedTransfusionDateTime: '2026-11-10T12:00',
  transfusionOrder: 'planned',
  requiredComponent: 'Эритроцитная взвесь',
  componentCode: 'ЭВ-Л',
  quantity: '2',
  estimatedVolumeMl: '',
  transfusionIndicationCode: '1.1',
  individualSelectionRequired: 'yes',
  individualSelectionCode: '3',
  stemCellDonorAbo: 'O(I)',
  stemCellDonorRh: 'Rh(-)',
  stemCellDonorAntigens: 'C− c+ E− e+ K−',
  doctorName: 'Петров Пётр Петрович',
  directionDate: '',
};

it('отображает единую заявку с двенадцатью нумерованными графами', () => {
  const { container } = render(
    <ComponentRequestForm
      values={request}
      examination={{ recipientAbo: 'A(II)', recipientRh: 'Rh(+)' }}
      readOnly={false}
      onEdit={() => {}}
    />,
  );
  const dataTable = screen.getByRole('table', { name: 'Графы 1–12 заявки' });
  expect(dataTable.querySelectorAll('thead tr:nth-child(2) th')).toHaveLength(12);
  expect(
    Array.from(dataTable.querySelectorAll('thead tr:last-child th'), (th) => th.textContent),
  ).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
  expect(dataTable.querySelectorAll('tbody tr')).toHaveLength(1);
  expect(dataTable.querySelector('tbody tr')?.textContent).toContain('Иванов Иван Иванович');
  expect(dataTable.querySelector('tbody tr')?.textContent).toContain('15.01.1980');
  expect(dataTable.querySelector('tbody tr')?.textContent).toContain('ЭВ-Л');
  expect(dataTable.querySelector('tbody tr')?.textContent).toContain('2 ед.');
  expect(dataTable.querySelector('tbody tr')?.textContent).toContain('Rh(-)');
  const approval = container.querySelector('[data-request-approval]');
  expect(approval?.querySelectorAll('span')).toHaveLength(1);
  expect(approval?.firstElementChild?.textContent).toContain('от 18 мая 2026 г. № 447н');
  expect(container.querySelectorAll('[data-document-paper]')).toHaveLength(1);
  expect(container.querySelectorAll('section[aria-label*="страница"]')).toHaveLength(2);
  const departmentCell = container.querySelector(
    'section[aria-label*="страница 1"] table tbody tr:first-child td',
  );
  expect(Array.from(departmentCell?.children ?? [], (element) => element.textContent)).toEqual([
    'ОРИТ',
    '123-45-67',
  ]);
  expect(screen.getByText('10.11.2026 09:30')).toBeTruthy();
});

it('восстанавливает вторую страницу с таблицей выдачи и шестью пустыми строками', () => {
  render(<ComponentRequestForm values={request} examination={{}} readOnly onEdit={() => {}} />);
  expect(
    screen.getByRole('heading', { name: 'Выдано из трансфузиологического кабинета' }),
  ).toBeTruthy();
  const issuedTable = screen.getByRole('table', { name: 'Таблица выдачи компонентов крови' });
  expect(issuedTable.querySelectorAll('colgroup col')).toHaveLength(11);
  expect(issuedTable.querySelectorAll('thead th')).toHaveLength(11);
  expect(issuedTable.querySelectorAll('tbody tr')).toHaveLength(6);
  expect(issuedTable.querySelectorAll('tbody td')).toHaveLength(66);
  expect(issuedTable.querySelector('thead')?.textContent).toContain('№ контейнера');
  expect(issuedTable.querySelector('thead')?.textContent).toContain('Изготовитель');
  expect(screen.getByText('Получил компоненты крови:')).toBeTruthy();
  expect(screen.getByText('Выдал компоненты крови:')).toBeTruthy();
});

it('открывает переиспользуемые редакторы для логических разделов', () => {
  const onEdit = vi.fn();
  const { container } = render(
    <ComponentRequestForm values={request} examination={{}} readOnly={false} onEdit={onEdit} />,
  );
  const organization = screen.getByRole('button', {
    name: 'Подразделение, сроки и форма оказания помощи',
  });
  expect(organization.querySelectorAll('tbody tr')).toHaveLength(4);
  expect(organization.querySelectorAll('tr[role="button"]')).toHaveLength(0);
  fireEvent.click(screen.getByText('123-45-67'));
  fireEvent.click(screen.getByText('Дата и время подачи заявки'));
  fireEvent.keyDown(organization, { key: 'Enter' });
  fireEvent.click(screen.getByText('Иванов Иван Иванович'));
  fireEvent.click(screen.getByText('ЭВ-Л'));
  fireEvent.click(screen.getByText('Rh(-), C− c+ E− e+ K−'));
  fireEvent.click(screen.getByText('Петров Пётр Петрович'));
  expect(onEdit.mock.calls.map(([section]) => section)).toEqual([
    'organization',
    'organization',
    'organization',
    'recipient',
    'component',
    'stem-donor',
    'footer',
  ]);
  onEdit.mockClear();
  const examinationCell = container.querySelector(
    '[aria-label="Графы 1–12 заявки"] tbody td:nth-child(3)',
  );
  expect(examinationCell).not.toBeNull();
  fireEvent.keyDown(examinationCell!, { key: 'Enter' });
  expect(onEdit).toHaveBeenCalledWith('examination');
});

it('не позволяет редактировать сохранённый документ в режиме просмотра', () => {
  const onEdit = vi.fn();
  render(<ComponentRequestForm values={request} examination={{}} readOnly onEdit={onEdit} />);
  fireEvent.click(screen.getByText('ЭВ-Л'));
  expect(onEdit).not.toHaveBeenCalled();
});
