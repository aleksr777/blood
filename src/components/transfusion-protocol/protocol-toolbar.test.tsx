// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import {
  getProtocolHemaconWarning,
  getProtocolNewBlankWarning,
} from '../../domain/protocol-hemacon';
import { ProtocolToolbar } from './protocol-toolbar';

const props = (): ComponentProps<typeof ProtocolToolbar> => ({
  status: '',
  warning: '',
  hemaconWarning: getProtocolHemaconWarning({}),
  newBlankWarning: getProtocolNewBlankWarning({}),
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

const expectWarningText = (message: string) => {
  const text = screen.getByRole('alert').textContent;
  for (const line of message.split('\n').filter(Boolean)) {
    expect(text).toContain(line.replace(/^• /, ''));
  }
};

it.each(['Новый бланк', 'Сохранить', 'Печать страницы 1', 'Печать страницы 2'])(
  'shows the missing data warning only after attempting %s and prevents the action',
  (name) => {
    const callbacks = props();
    const warning = name === 'Новый бланк' ? callbacks.newBlankWarning : callbacks.hemaconWarning;
    render(<ProtocolToolbar {...callbacks} />);
    expect(screen.queryByRole('alert')).toBeNull();
    const button = screen.getByRole('button', { name });
    expect(button.getAttribute('aria-disabled')).toBe('true');
    fireEvent.mouseOver(button);
    fireEvent.focus(button);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(button.hasAttribute('title')).toBe(false);
    fireEvent.click(button);
    expectWarningText(warning);
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть предупреждение' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(button.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(button);
    expectWarningText(warning);
    expect(callbacks.onNew).not.toHaveBeenCalled();
    expect(callbacks.onSave).not.toHaveBeenCalled();
    expect(callbacks.onPrintPage).not.toHaveBeenCalled();
  },
);

it('unlocks all actions after the required fields are completed and hides the warning for the next blank', () => {
  const callbacks = props();
  const { rerender } = render(<ProtocolToolbar {...callbacks} />);
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
  expect(screen.getByRole('alert')).toBeTruthy();
  const partialWarning = getProtocolHemaconWarning({ componentName: 'Эритроцитная взвесь' });
  rerender(<ProtocolToolbar {...callbacks} hemaconWarning={partialWarning} />);
  expectWarningText(partialWarning);
  const hemaconWarning = getProtocolHemaconWarning({
    componentName: 'Эритроцитная взвесь',
    componentUnitNumber: '76102200045636',
    donorAbo: 'A(II)',
  });
  expect(hemaconWarning).toBe('');
  rerender(<ProtocolToolbar {...callbacks} hemaconWarning={hemaconWarning} newBlankWarning="" />);
  expect(screen.queryByRole('alert')).toBeNull();
  for (const name of ['Новый бланк', 'Сохранить', 'Печать страницы 1', 'Печать страницы 2']) {
    const button = screen.getByRole('button', { name });
    expect(button.getAttribute('aria-disabled')).toBe('false');
    fireEvent.click(button);
  }
  expect(callbacks.onSave).toHaveBeenCalledTimes(1);
  expect(callbacks.onNew).toHaveBeenCalledTimes(1);
  expect(callbacks.onPrintPage).toHaveBeenNthCalledWith(1, 0);
  expect(callbacks.onPrintPage).toHaveBeenNthCalledWith(2, 1);
  rerender(<ProtocolToolbar {...callbacks} />);
  expect(screen.queryByRole('alert')).toBeNull();
});

it('keeps New blank blocked without a recipient name even when the hemacon is complete', () => {
  const callbacks = props();
  const newBlankWarning = getProtocolNewBlankWarning({
    componentName: 'Эритроцитная взвесь',
    componentUnitNumber: '76102200045636',
    donorAbo: 'A(II)',
  });
  const { rerender } = render(
    <ProtocolToolbar {...callbacks} hemaconWarning="" newBlankWarning={newBlankWarning} />,
  );
  const button = screen.getByRole('button', { name: 'Новый бланк' });
  expect(button.getAttribute('aria-disabled')).toBe('true');
  expect(screen.queryByRole('alert')).toBeNull();
  fireEvent.click(button);
  expectWarningText(newBlankWarning);
  expect(screen.getByRole('alert').textContent).toContain('ФИО реципиента');
  expect(callbacks.onNew).not.toHaveBeenCalled();
  rerender(<ProtocolToolbar {...callbacks} hemaconWarning="" newBlankWarning="" />);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(button.getAttribute('aria-disabled')).toBe('false');
  fireEvent.click(button);
  expect(callbacks.onNew).toHaveBeenCalledTimes(1);
});

it.each(['view', 'edit'] as const)(
  'keeps the %s archive header free of current-patient, draft and expiration controls',
  (mode) => {
    const handlers = props();
    render(
      <ProtocolToolbar
        {...handlers}
        document={{
          mode,
          record: { id: 42, recipientId: 2 },
          edit: vi.fn(),
          cancel: vi.fn(),
          close: vi.fn(),
        }}
        documentTitle="Протокол трансфузии · 21.10.2020"
        currentRecipientName="Текущий реципиент"
        currentRecipientAvailable
        warning="Внимание: истёк срок годности."
        hemaconWarning=""
      />,
    );
    expect(screen.queryByText('Текущий реципиент:')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Очистить бланк' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Новый бланк' })).toBeNull();
    expect(screen.queryByText(/истёк срок годности/)).toBeNull();
    expect(screen.getByText('Протокол трансфузии · 21.10.2020')).toBeDefined();
    expect(screen.queryByText(/№ 42/)).toBeNull();
    expect(
      screen.getByRole('button', {
        name: mode === 'edit' ? 'Закрыть без сохранения' : 'Вернуться к текущему бланку',
      }).className,
    ).not.toContain('text-button');
  },
);
