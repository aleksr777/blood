// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { getProtocolHemaconWarning } from '../../domain/protocol-hemacon';
import { ProtocolToolbar } from './protocol-toolbar';

const props = (): ComponentProps<typeof ProtocolToolbar> => ({
  status: '',
  warning: '',
  hemaconWarning: getProtocolHemaconWarning({}),
  dangerWarning: '',
  bloodGroupWarning: '',
  bloodGroupWarningDismissible: false,
  onDismissBloodGroupWarning: vi.fn(),
  componentUnitNumberWarning: '',
  onDismissComponentUnitNumberWarning: vi.fn(),
  onClear: vi.fn(),
  onNew: vi.fn(),
  onOpenRegistry: vi.fn(),
  onOpenCurrentRecipient: vi.fn(),
  currentRecipientName: '',
  currentRecipientAbo: '',
  currentRecipientRh: '',
  currentRecipientAvailable: false,
  onSave: vi.fn(),
  pageCount: 2,
  onPrintPage: vi.fn(),
});

afterEach(cleanup);

it.each(['Сохранить', 'Печать страницы 1', 'Печать страницы 2'])(
  'shows the missing data warning only after attempting %s and prevents the action',
  (name) => {
    const callbacks = props();
    render(<ProtocolToolbar {...callbacks} />);
    expect(screen.queryByRole('alert')).toBeNull();
    const button = screen.getByRole('button', { name });
    expect(button.getAttribute('aria-disabled')).toBe('true');
    fireEvent.mouseOver(button);
    fireEvent.focus(button);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(button.hasAttribute('title')).toBe(false);
    fireEvent.click(button);
    expect(screen.getByText(callbacks.hemaconWarning)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть предупреждение' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(button.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(button);
    expect(screen.getByText(callbacks.hemaconWarning)).toBeTruthy();
    expect(callbacks.onSave).not.toHaveBeenCalled();
    expect(callbacks.onPrintPage).not.toHaveBeenCalled();
  },
);

it('unlocks save and every print page with three fields and hides the warning for the next blank', () => {
  const callbacks = props();
  const { rerender } = render(<ProtocolToolbar {...callbacks} />);
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
  expect(screen.getByRole('alert')).toBeTruthy();
  const partialWarning = getProtocolHemaconWarning({ componentName: 'Эритроцитная взвесь' });
  rerender(<ProtocolToolbar {...callbacks} hemaconWarning={partialWarning} />);
  expect(screen.getByText(partialWarning)).toBeTruthy();
  const hemaconWarning = getProtocolHemaconWarning({
    componentName: 'Эритроцитная взвесь',
    componentUnitNumber: '76102200045636',
    donorAbo: 'A(II)',
  });
  expect(hemaconWarning).toBe('');
  rerender(<ProtocolToolbar {...callbacks} hemaconWarning={hemaconWarning} />);
  expect(screen.queryByRole('alert')).toBeNull();
  for (const name of ['Сохранить', 'Печать страницы 1', 'Печать страницы 2']) {
    const button = screen.getByRole('button', { name });
    expect(button.getAttribute('aria-disabled')).toBe('false');
    fireEvent.click(button);
  }
  expect(callbacks.onSave).toHaveBeenCalledTimes(1);
  expect(callbacks.onPrintPage).toHaveBeenNthCalledWith(1, 0);
  expect(callbacks.onPrintPage).toHaveBeenNthCalledWith(2, 1);
  rerender(<ProtocolToolbar {...callbacks} />);
  expect(screen.queryByRole('alert')).toBeNull();
});
