// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ComponentRequestForm } from './component-request-form';
import { request } from './component-request-form.fixture';

afterEach(cleanup);

it('объединяет графы 1–5 для редактирования данных реципиента', () => {
  const onEdit = vi.fn();
  render(
    <ComponentRequestForm values={request} examination={{}} readOnly={false} onEdit={onEdit} />,
  );
  const cells = screen
    .getByRole('table', { name: 'Графы 1–12 заявки' })
    .querySelectorAll('tbody td');
  const recipientClass = Array.from(cells[0].classList).find((className) =>
    className.includes('recipientCell'),
  );
  expect(recipientClass).toBeTruthy();
  for (let index = 0; index < 5; index++) {
    expect(cells[index].classList.contains(recipientClass!)).toBe(true);
    fireEvent.click(cells[index]);
    expect(onEdit).toHaveBeenLastCalledWith('recipient');
  }
  expect(cells[5].classList.contains(recipientClass!)).toBe(false);
  fireEvent.click(cells[5]);
  expect(onEdit).toHaveBeenLastCalledWith('component');
  onEdit.mockClear();
  fireEvent.keyDown(cells[4], { key: 'Enter' });
  expect(onEdit).toHaveBeenCalledWith('recipient');
});

it('не разрешает открывать единое окно из граф 1–5 в режиме просмотра', () => {
  const onEdit = vi.fn();
  render(<ComponentRequestForm values={request} examination={{}} readOnly onEdit={onEdit} />);
  const cells = screen
    .getByRole('table', { name: 'Графы 1–12 заявки' })
    .querySelectorAll('tbody td');
  for (const cell of Array.from(cells).slice(0, 5)) {
    fireEvent.click(cell);
    fireEvent.keyDown(cell, { key: 'Enter' });
    expect(cell.getAttribute('role')).toBeNull();
  }
  expect(onEdit).not.toHaveBeenCalled();
});
