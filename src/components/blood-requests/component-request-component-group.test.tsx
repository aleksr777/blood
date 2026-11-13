// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ComponentRequestForm } from './component-request-form';
import { request } from './component-request-form.fixture';

afterEach(cleanup);

it('подсвечивает графы 1–5 и 6–10 с заголовками и номерами как два подраздела', () => {
  const onEdit = vi.fn();
  render(
    <ComponentRequestForm values={request} examination={{}} readOnly={false} onEdit={onEdit} />,
  );
  const table = screen.getByRole('table', { name: 'Графы 1–12 заявки' });
  const rows = [
    table.querySelectorAll('thead tr:nth-child(2) th'),
    table.querySelectorAll('thead tr:nth-child(3) th'),
    table.querySelectorAll('tbody tr td'),
  ];
  for (const [start, end, section, group] of [
    [0, 5, 'recipient', 'recipientCell'],
    [5, 10, 'component', 'componentCell'],
  ] as const) {
    for (const row of rows) {
      for (let index = start; index < end; index++) {
        const cell = row[index];
        expect(Array.from(cell.classList).some((name) => name.includes(group))).toBe(true);
        expect(cell.getAttribute('role')).toBe('button');
        fireEvent.click(cell);
        expect(onEdit).toHaveBeenLastCalledWith(section);
      }
    }
  }
  for (const row of rows) {
    for (let index = 10; index < 12; index++) {
      expect(row[index].getAttribute('role')).toBeNull();
    }
  }
  onEdit.mockClear();
  fireEvent.keyDown(rows[1][6], { key: 'Enter' });
  expect(onEdit).toHaveBeenCalledWith('component');
  fireEvent.keyDown(rows[0][3], { key: ' ' });
  expect(onEdit).toHaveBeenCalledWith('recipient');
});

it('в просмотре заголовки, номера и значения не редактируются', () => {
  const onEdit = vi.fn();
  render(<ComponentRequestForm values={request} examination={{}} readOnly onEdit={onEdit} />);
  const table = screen.getByRole('table', { name: 'Графы 1–12 заявки' });
  const cells = table.querySelectorAll(
    'thead tr:nth-child(2) th, thead tr:nth-child(3) th, tbody td',
  );
  for (const cell of cells) {
    fireEvent.click(cell);
    fireEvent.keyDown(cell, { key: 'Enter' });
    expect(cell.getAttribute('role')).toBeNull();
  }
  expect(onEdit).not.toHaveBeenCalled();
});
