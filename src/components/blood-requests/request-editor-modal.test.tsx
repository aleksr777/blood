// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RequestEditorModal } from './request-editor-modal';

vi.mock('../modal/modal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
afterEach(cleanup);

it('saves a custom calendar date from a request modal in the existing format', () => {
  const onChange = vi.fn();
  render(
    <RequestEditorModal
      title="Проверка"
      fields={[{ name: 'directionDate', label: 'Дата направления', type: 'date' }]}
      values={{ directionDate: '' }}
      onChange={onChange}
      onClose={() => {}}
    />,
  );
  fireEvent.focus(screen.getByLabelText('Дата направления'));
  fireEvent.change(screen.getByLabelText('Дата направления'), {
    target: { value: '01.12.2026' },
  });
  expect(onChange).toHaveBeenCalledWith({ directionDate: '2026-12-01' });
});
