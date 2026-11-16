// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ComponentRequestForm } from './component-request-form';
import { request } from './component-request-form.fixture';

afterEach(cleanup);

it('не позволяет редактировать сохранённый документ в режиме просмотра', () => {
  const onEdit = vi.fn();
  render(<ComponentRequestForm values={request} examination={{}} readOnly onEdit={onEdit} />);
  fireEvent.click(screen.getByText('ЭВ-Л'));
  fireEvent.click(screen.getByText('Получил компоненты крови:'));
  expect(onEdit).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Получил компоненты крови' })).toBeNull();
});

it('открывает подпись со второй страницы с клавиатуры', () => {
  const onEdit = vi.fn();
  render(
    <ComponentRequestForm values={request} examination={{}} readOnly={false} onEdit={onEdit} />,
  );
  fireEvent.keyDown(screen.getByRole('button', { name: 'Получил компоненты крови' }), {
    key: 'Enter',
  });
  expect(onEdit).toHaveBeenCalledWith('footer');
});
