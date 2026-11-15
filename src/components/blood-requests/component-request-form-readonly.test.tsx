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
  expect(onEdit).not.toHaveBeenCalled();
});
