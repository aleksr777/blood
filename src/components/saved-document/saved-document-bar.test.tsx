// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SavedDocumentBar } from './saved-document-bar';

afterEach(cleanup);

it.each(['view', 'edit'] as const)('returns from %s without discarding edits', (mode) => {
  const document = {
    mode,
    record: { id: 42, recipientId: 7 },
    hasChanges: false,
    edit: vi.fn(),
    cancel: vi.fn(),
    close: vi.fn(),
  };
  const onReturnToList = vi.fn();
  render(
    <SavedDocumentBar
      document={document}
      title="Протокол трансфузии"
      onReturnToList={onReturnToList}
    />,
  );
  const button = screen.getByRole('button', { name: 'К списку бланков' });
  expect(button.classList.contains('ui-compact-button')).toBe(true);
  fireEvent.click(button);
  expect(onReturnToList).toHaveBeenCalledOnce();
  expect(document.close).not.toHaveBeenCalled();
  expect(document.cancel).not.toHaveBeenCalled();
  expect(document.edit).not.toHaveBeenCalled();
});

it.each(['view', 'edit'] as const)(
  'offers the same new-form navigation in %s without cancelling the saved document',
  (mode) => {
    const document = {
      mode,
      record: { id: 42, recipientId: 7 },
      hasChanges: mode === 'edit',
      edit: vi.fn(),
      cancel: vi.fn(),
      close: vi.fn(),
    };
    render(<SavedDocumentBar document={document} title="Протокол трансфузии" />);
    const button = screen.getByRole('button', { name: 'К созданию нового бланка' });
    expect(button.querySelector('[aria-hidden="true"]')?.textContent).toBe('←');
    fireEvent.click(button);
    expect(document.close).toHaveBeenCalledOnce();
    expect(document.cancel).not.toHaveBeenCalled();
    expect(document.edit).not.toHaveBeenCalled();
  },
);
