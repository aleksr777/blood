// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { listProtocolRecords, type ProtocolRecord } from '../../storage/repositories/recipients';
import { RegistrationTransfusionsModal } from './registration-transfusions-modal';
import { buildRegistrationTransfusionRow } from './registration-transfusion-table';

vi.mock('../../storage/repositories/recipients', () => ({ listProtocolRecords: vi.fn() }));
vi.mock('../modal/modal', () => ({
  default: ({ children }: { children: ReactNode }) => <div role="dialog">{children}</div>,
}));
afterEach(cleanup);

const record = (id: number, date: string, [start, end]: [string, string]): ProtocolRecord => ({
  id,
  recipientId: 1,
  createdAt: id,
  updatedAt: 100 - id,
  values: {
    componentName: `Компонент ${id}`,
    transfusionDate: date,
    startTime: start,
    endTime: end,
  },
});
const earlier = record(9, '2026-01-31', ['23:00', '23:30']);
const morning = record(5, '2026-02-01', ['08:00', '10:30']);
const later = record(1, '2026-02-01', ['09:00', '10:00']);

it('lists and applies protocols by transfusion start, independent of edits and selection order', async () => {
  vi.mocked(listProtocolRecords).mockResolvedValue([later, morning, earlier]);
  const onApply = vi.fn();
  const onClose = vi.fn();
  render(
    <RegistrationTransfusionsModal
      recipientId={1}
      values={{}}
      onApply={onApply}
      onClose={onClose}
    />,
  );
  await waitFor(() => expect(screen.getAllByRole('checkbox')).toHaveLength(3));
  const checkboxes = screen.getAllByRole('checkbox');
  const apply = screen.getByRole('button', { name: 'Внести в таблицу' }) as HTMLButtonElement;
  expect(apply.disabled).toBe(true);
  fireEvent.click(checkboxes[0]);
  expect(apply.disabled).toBe(false);
  fireEvent.click(checkboxes[0]);
  expect(apply.disabled).toBe(true);
  fireEvent.click(apply);
  expect(onApply).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
  expect(checkboxes.map((input) => input.closest('label')?.textContent)).toEqual([
    expect.stringContaining('Компонент 9'),
    expect.stringContaining('Компонент 5'),
    expect.stringContaining('Компонент 1'),
  ]);
  expect(checkboxes[1].closest('label')?.textContent).toContain('01.02.2026 08:00');
  for (const input of [...checkboxes].reverse()) fireEvent.click(input);
  expect(apply.disabled).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Внести в таблицу' }));
  const rows = JSON.parse(onApply.mock.calls[0][0].registrationTransfusionRows);
  expect(rows.map((row: { protocolId: number }) => row.protocolId)).toEqual([9, 5, 1]);
  expect(onClose).toHaveBeenCalledOnce();
});

it('interleaves retained snapshot rows with selected protocols by their transfusion time', async () => {
  vi.mocked(listProtocolRecords).mockResolvedValue([later, earlier]);
  const onApply = vi.fn();
  render(
    <RegistrationTransfusionsModal
      recipientId={1}
      values={{
        registrationTransfusionRows: JSON.stringify([buildRegistrationTransfusionRow(morning)]),
      }}
      onApply={onApply}
      onClose={vi.fn()}
    />,
  );
  await waitFor(() => expect(screen.getAllByRole('checkbox')).toHaveLength(2));
  for (const input of screen.getAllByRole('checkbox')) fireEvent.click(input);
  fireEvent.click(screen.getByRole('button', { name: 'Внести в таблицу' }));
  const rows = JSON.parse(onApply.mock.calls[0][0].registrationTransfusionRows);
  expect(rows.map((row: { protocolId: number }) => row.protocolId)).toEqual([9, 5, 1]);
});

it('places legacy records without dates last and uses ending time only when start is absent', async () => {
  vi.mocked(listProtocolRecords).mockResolvedValue([
    record(4, '', ['07:00', '']),
    record(3, '2026-02-01', ['', '']),
    record(2, '2026-02-01', ['', '08:30']),
    later,
  ]);
  render(
    <RegistrationTransfusionsModal
      recipientId={1}
      values={{}}
      onApply={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  await waitFor(() => expect(screen.getAllByRole('checkbox')).toHaveLength(4));
  expect(
    screen.getAllByRole('checkbox').map((input) => input.closest('label')?.textContent),
  ).toEqual([
    expect.stringContaining('Компонент 2'),
    expect.stringContaining('Компонент 1'),
    expect.stringContaining('Компонент 3'),
    expect.stringContaining('Компонент 4'),
  ]);
});
