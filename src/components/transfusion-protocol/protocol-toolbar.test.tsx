// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { getProtocolHemaconWarning } from '../../domain/protocol-hemacon';
import { ProtocolToolbar } from './protocol-toolbar';
import { completeProtocolDates } from '../../test-fixtures/protocol';

const props = (): ComponentProps<typeof ProtocolToolbar> => ({
  hasContent: true,
  status: '',
  warning: '',
  hemaconWarning: getProtocolHemaconWarning({}),
  hemaconDateWarning: '',
  dangerWarning: '',
  bloodGroupWarning: '',
  bloodGroupWarningDismissible: false,
  onDismissBloodGroupWarning: vi.fn(),
  componentUnitNumberWarning: '',
  onDismissComponentUnitNumberWarning: vi.fn(),
  onClear: vi.fn(),
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

it('disables Clear and Save when only recipient or reusable data remain', () => {
  const handlers = props();
  render(<ProtocolToolbar {...handlers} hasContent={false} />);
  for (const name of ['Очистить бланк', 'Сохранить']) {
    const button = screen.getByRole('button', { name }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
  }
  expect(handlers.onSave).not.toHaveBeenCalled();
  expect(handlers.onClear).not.toHaveBeenCalled();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('has no New blank button and keeps date-order warnings non-dismissible', () => {
  const handlers = props();
  const message = 'Дата заготовки должна быть раньше даты окончания срока годности.';
  const { rerender } = render(
    <ProtocolToolbar {...handlers} hemaconWarning="" hemaconDateWarning={message} />,
  );
  expect(screen.queryByRole('button', { name: 'Новый бланк' })).toBeNull();
  expect(screen.getByRole('alert').textContent).toContain(message);
  expect(screen.queryByRole('button', { name: 'Закрыть предупреждение' })).toBeNull();
  rerender(<ProtocolToolbar {...handlers} hemaconWarning="" hemaconDateWarning="" />);
  expect(screen.queryByRole('alert')).toBeNull();
});

const expectWarningText = (message: string) => {
  const text = screen.getByRole('alert').textContent;
  for (const line of message.split('\n').filter(Boolean)) {
    expect(text).toContain(line.replace(/^• /, ''));
  }
};

it.each(['Сохранить', 'Печать страницы 1', 'Печать страницы 2'])(
  'shows the missing data warning only after attempting %s and prevents the action',
  (name) => {
    const callbacks = props();
    const warning = callbacks.hemaconWarning;
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
    ...completeProtocolDates,
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

it.each(Object.keys(completeProtocolDates))(
  'blocks Save and every print button again if %s is removed',
  (name) => {
    const callbacks = props();
    const complete = {
      ...completeProtocolDates,
      componentName: 'Эритроцитная взвесь',
      componentUnitNumber: '76102200045636',
      donorAbo: 'A(II)',
    };
    const { rerender } = render(<ProtocolToolbar {...callbacks} hemaconWarning="" />);
    const warning = getProtocolHemaconWarning({ ...complete, [name]: '' });
    rerender(<ProtocolToolbar {...callbacks} hemaconWarning={warning} />);
    expect(screen.queryByRole('alert')).toBeNull();
    for (const label of ['Сохранить', 'Печать страницы 1', 'Печать страницы 2']) {
      const button = screen.getByRole('button', { name: label });
      expect(button.getAttribute('aria-disabled')).toBe('true');
      fireEvent.click(button);
      expectWarningText(warning);
    }
    expect(callbacks.onSave).not.toHaveBeenCalled();
    expect(callbacks.onPrintPage).not.toHaveBeenCalled();
    rerender(<ProtocolToolbar {...callbacks} hemaconWarning="" />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: 'Сохранить' }).getAttribute('aria-disabled')).toBe(
      'false',
    );
  },
);

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
          hasChanges: false,
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

it.each([
  ['view', false, true],
  ['edit', false, true],
  ['edit', true, false],
] as const)('allows saving in %s only with changes (%s)', (mode, hasChanges, disabled) => {
  const handlers = props();
  render(
    <ProtocolToolbar
      {...handlers}
      hemaconWarning=""
      document={{
        mode,
        hasChanges,
        record: { id: 42, recipientId: 2 },
        edit: vi.fn(),
        cancel: vi.fn(),
        close: vi.fn(),
      }}
    />,
  );
  const save = screen.getByRole('button', { name: /^Сохранить$/ }) as HTMLButtonElement;
  expect(save.disabled).toBe(disabled);
  expect(save.getAttribute('aria-disabled')).toBe(String(disabled));
  fireEvent.click(save);
  expect(handlers.onSave).toHaveBeenCalledTimes(disabled ? 0 : 1);
});
