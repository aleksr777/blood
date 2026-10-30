// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { RecipientHistoryPanel } from './recipient-history-panel';

const recipient = {
  id: 1,
  fullName: 'Реципиент',
  profile: {},
  protocolCount: 2,
  registrationCount: 1,
  componentRequestCount: 1,
  individualSelectionDirectionCount: 1,
};
const record = {
  id: 1,
  recipientId: 1,
  values: {
    transfusionDate: '2026-10-23',
    startTime: '09:15',
    endTime: '10:30',
    componentName: 'Эритроцитная взвесь лейкоредуцированная',
    amountMl: '300',
    componentUnitNumber: '761022 000456 36',
    doctorName: 'Петров А. Н.',
  },
  createdAt: 1,
  updatedAt: 1,
};
const props = (): ComponentProps<typeof RecipientHistoryPanel> => ({
  recipient,
  records: [record, { ...record, id: 2, values: { transfusionDate: '2026-10-24' } }],
  registrationRecords: [record],
  componentRequestRecords: [{ ...record, kind: 'component-request' }],
  individualSelectionDirectionRecords: [{ ...record, kind: 'individual-selection-direction' }],
  onOpenRecord: vi.fn(),
  onOpenRegistrationRecord: vi.fn(),
  onOpenComponentRequestRecord: vi.fn(),
  onOpenIndividualSelectionDirectionRecord: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onDeleteRecord: vi.fn(),
  onDeleteRegistrationRecord: vi.fn(),
  onDeleteBloodRequestRecord: vi.fn(),
});
afterEach(cleanup);

const cases = [
  ['Протоколы трансфузии', 'records', 'onOpenRecord', 'onDeleteRecord'],
  [
    'Листы регистрации трансфузий',
    'registrationRecords',
    'onOpenRegistrationRecord',
    'onDeleteRegistrationRecord',
  ],
  [
    'Заявки в трансфузиологический кабинет',
    'componentRequestRecords',
    'onOpenComponentRequestRecord',
    'onDeleteBloodRequestRecord',
  ],
  [
    'Направления на индивидуальный подбор',
    'individualSelectionDirectionRecords',
    'onOpenIndividualSelectionDirectionRecord',
    'onDeleteBloodRequestRecord',
  ],
] as const;
it.each(cases.map(([label, records, open, remove]) => ({ label, records, open, remove })))(
  'shows actions only after selecting a record in $label',
  ({ label, records, open, remove }) => {
    const handlers = props();
    render(<RecipientHistoryPanel {...handlers} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${label}`) }));
    const list = screen.getByRole('list', { name: 'Сохранённые бланки' });
    expect(list.querySelectorAll('input, select, textarea')).toHaveLength(0);
    if (records === 'records') {
      expect(within(list).getByText(record.values.componentName)).toBeDefined();
      expect(within(list).getByText('23.10.2026 09:15')).toBeDefined();
      expect(within(list).getByText('300 мл · № 761022 000456 36')).toBeDefined();
      expect(within(list).queryByText(/Петров А\. Н\./)).toBeNull();
    }
    expect(list.querySelectorAll('button')).toHaveLength(0);
    expect(screen.queryByRole('group', { name: 'Действия с бланком' })).toBeNull();
    const row = within(list).getAllByRole('button')[0];
    fireEvent.click(row);
    expect(handlers[open]).not.toHaveBeenCalled();
    expect(handlers[remove]).not.toHaveBeenCalled();
    const actions = within(screen.getByRole('group', { name: 'Действия с бланком' }));
    expect(actions.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Посмотреть',
      'Редактировать',
      'Удалить',
    ]);
    fireEvent.click(actions.getByRole('button', { name: 'Посмотреть' }));
    expect(handlers[open]).toHaveBeenLastCalledWith(handlers[records][0], recipient, 'view');
    fireEvent.click(actions.getByRole('button', { name: 'Редактировать' }));
    expect(handlers[open]).toHaveBeenLastCalledWith(handlers[records][0], recipient, 'edit');
    fireEvent.click(actions.getByRole('button', { name: 'Удалить' }));
    expect(handlers[remove]).toHaveBeenCalledWith(handlers[records][0]);
  },
);

it('keeps actions under one record, supports keyboard selection and resets on category/patient changes', () => {
  const handlers = props();
  const { rerender } = render(<RecipientHistoryPanel {...handlers} />);
  const chooseProtocols = () =>
    fireEvent.click(screen.getByRole('button', { name: /^Протоколы трансфузии/ }));
  chooseProtocols();
  const rows = screen.getAllByRole('listitem');
  fireEvent.keyDown(within(rows[0]).getByRole('button'), { key: 'Enter' });
  expect(within(rows[0]).getByRole('group')).toBeDefined();
  fireEvent.keyDown(within(rows[1]).getByRole('button'), { key: ' ' });
  expect(within(rows[0]).queryByRole('group')).toBeNull();
  expect(within(rows[1]).getByRole('group')).toBeDefined();
  fireEvent.click(within(rows[1]).getByRole('button', { expanded: true }));
  expect(screen.queryByRole('group')).toBeNull();
  fireEvent.click(within(rows[0]).getByRole('button'));
  fireEvent.click(screen.getByRole('button', { name: '← К категориям' }));
  fireEvent.click(screen.getByRole('button', { name: /^Листы регистрации трансфузий/ }));
  expect(screen.queryByRole('group')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /^Лист регистрации трансфузий/ }));
  rerender(<RecipientHistoryPanel {...handlers} recipient={{ ...recipient, id: 2 }} />);
  expect(screen.queryByRole('group')).toBeNull();
  chooseProtocols();
  expect(screen.queryByRole('group')).toBeNull();
});
