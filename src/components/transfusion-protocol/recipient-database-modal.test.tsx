// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ProtocolRecord, RecipientRecord } from '../../storage/repositories/recipients';
import { RecipientDatabaseModal } from './recipient-database-modal';

const state = vi.hoisted(() => ({
  searchRecipients: vi.fn(),
  listProtocolRecords: vi.fn(),
}));
vi.mock('../../storage/sqlite/database-client', () => ({
  database: {
    searchRecipients: state.searchRecipients,
    listProtocolRecords: state.listProtocolRecords,
    listRegistrationRecords: async () => [],
    listBloodRequestRecords: async () => [],
  },
}));
vi.mock('../modal/modal', () => ({ default: ({ children }: PropsWithChildren) => children }));
vi.mock('./recipient-database-dialogs', () => ({ RecipientDatabaseDialogs: () => null }));
vi.mock('./recipient-list-panel', () => ({
  RecipientListPanel: ({
    recipients,
    onSelect,
  }: {
    recipients: RecipientRecord[];
    onSelect: (recipient: RecipientRecord) => void;
  }) =>
    recipients.map((recipient) => (
      <button key={recipient.id} onClick={() => onSelect(recipient)}>
        {recipient.fullName}
      </button>
    )),
}));
vi.mock('./recipient-history-panel', () => ({
  RecipientHistoryPanel: ({ records }: { records: ProtocolRecord[] }) => (
    <div data-testid="records">{records.map(({ recipientId }) => recipientId).join(',')}</div>
  ),
}));

const recipient = (id: number): RecipientRecord => ({
  id,
  fullName: `Пациент ${id}`,
  profile: {},
  protocolCount: 1,
  registrationCount: 0,
  componentRequestCount: 0,
  individualSelectionDirectionCount: 0,
});
const protocol = (recipientId: number): ProtocolRecord => ({
  id: recipientId,
  recipientId,
  values: {},
  createdAt: 1,
  updatedAt: 1,
});

beforeEach(() => {
  window.localStorage.clear();
  state.searchRecipients.mockResolvedValue([recipient(1), recipient(2)]);
});
afterEach(cleanup);

it('ignores late responses for a recipient that is no longer selected', async () => {
  let resolveFirst: (records: ProtocolRecord[]) => void = () => undefined;
  state.listProtocolRecords.mockImplementation((id: number) =>
    id === 1
      ? new Promise<ProtocolRecord[]>((resolve) => {
          resolveFirst = resolve;
        })
      : Promise.resolve([protocol(2)]),
  );
  render(<RecipientDatabaseModal onClose={() => undefined} />);
  fireEvent.click(await screen.findByText('Пациент 1'));
  fireEvent.click(screen.getByText('Пациент 2'));
  await act(async () => undefined);
  expect(screen.getByTestId('records').textContent).toBe('2');
  await act(async () => resolveFirst([protocol(1)]));
  expect(screen.getByTestId('records').textContent).toBe('2');
});

it('clears the previous patient’s forms while the new patient’s forms are loading', async () => {
  state.listProtocolRecords.mockImplementation((id: number) =>
    id === 1 ? Promise.resolve([protocol(1)]) : new Promise(() => undefined),
  );
  render(<RecipientDatabaseModal onClose={() => undefined} />);
  fireEvent.click(await screen.findByText('Пациент 1'));
  await act(async () => undefined);
  expect(screen.getByTestId('records').textContent).toBe('1');
  fireEvent.click(screen.getByText('Пациент 2'));
  expect(screen.getByTestId('records').textContent).toBe('');
});
