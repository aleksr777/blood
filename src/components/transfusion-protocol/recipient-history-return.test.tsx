// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RecipientHistoryPanel } from './recipient-history-panel';

afterEach(cleanup);
const recipient = {
  id: 7,
  fullName: 'Архивный реципиент',
  profile: {},
  protocolCount: 2,
  registrationCount: 2,
  componentRequestCount: 2,
  individualSelectionDirectionCount: 2,
};
const record = { id: 42, recipientId: 7, values: {}, createdAt: 1, updatedAt: 1 };
const records = [record, { ...record, id: 43 }];

it.each([
  ['protocol', 'Протоколы трансфузии'],
  ['registration', 'Листы регистрации трансфузий'],
  ['component-request', 'Заявки в трансфузиологический кабинет'],
  ['individual-selection-direction', 'Направления на индивидуальный подбор'],
] as const)('restores %s and the selected form after the recipient loads', (kind, heading) => {
  const props = {
    initialList: { kind, recipientId: 7, recordId: 43, query: 'Архивный' },
    records,
    registrationRecords: records,
    componentRequestRecords: records.map((item) => ({
      ...item,
      kind: 'component-request' as const,
    })),
    individualSelectionDirectionRecords: records.map((item) => ({
      ...item,
      kind: 'individual-selection-direction' as const,
    })),
    onOpenRecord: vi.fn(),
    onOpenRegistrationRecord: vi.fn(),
    onOpenIndividualSelectionDirectionRecord: vi.fn(),
    onOpenComponentRequestRecord: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onDeleteRecord: vi.fn(),
    onDeleteRegistrationRecord: vi.fn(),
    onDeleteBloodRequestRecord: vi.fn(),
  };
  const { rerender } = render(<RecipientHistoryPanel {...props} recipient={null} />);
  rerender(<RecipientHistoryPanel {...props} recipient={recipient} />);
  expect(screen.getByText(heading)).toBeTruthy();
  const list = screen.getByRole('list', { name: 'Сохранённые бланки' });
  const selected = list.querySelector<HTMLElement>('[data-record-id="43"]')!;
  expect(within(selected).getByRole('button', { expanded: true })).toBeTruthy();
  expect(within(selected).getByRole('group', { name: 'Действия с бланком' })).toBeTruthy();
  expect(screen.getAllByRole('group', { name: 'Действия с бланком' })).toHaveLength(1);
  rerender(<RecipientHistoryPanel {...props} recipient={{ ...recipient, id: 8 }} />);
  expect(screen.queryByRole('list', { name: 'Сохранённые бланки' })).toBeNull();
});
