// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { formatIndications } from './indications-model';
import { ProtocolEditorModal } from './protocol-editor-modal';

vi.mock('../modal/modal', () => ({
  default: ({ title, children }: { title: string; children: ReactNode }) => (
    <section role="dialog" aria-label={title}>
      {children}
    </section>
  ),
}));
vi.mock('../../storage/repositories/saved-options', () => ({
  loadSavedOptions: vi.fn(async () => []),
  subscribeSavedOptions: () => () => undefined,
  rememberSavedOption: vi.fn(async () => []),
}));
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const isBefore = (first: Node, second: Node) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

it.each(['donor', 'indications'] as const)(
  'показывает показания перед гемаконом и блокирует ввод до выбора группы (%s)',
  (blockId) => {
    const onSave = vi.fn();
    render(
      <ProtocolEditorModal
        blockId={blockId}
        values={{}}
        bloodGroupWarning=""
        bloodGroupWarningDismissible={false}
        onDismissBloodGroupWarning={vi.fn()}
        componentUnitNumberWarning=""
        onDismissComponentUnitNumberWarning={vi.fn()}
        previousTransfusionSuggestion=""
        persistReusableOptions={false}
        onOpenRecipients={vi.fn()}
        onSelectRecipient={vi.fn()}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Компонент крови и показания к трансфузии',
    });
    const dependent = dialog.querySelector(
      'fieldset[data-component-dependent]',
    ) as HTMLFieldSetElement;
    expect(dependent.disabled).toBe(true);
    const controls = dependent.querySelectorAll('input, button, textarea, select');
    expect(Array.from(controls).every((control) => control.matches(':disabled'))).toBe(true);
    expect(
      screen.queryByRole('textbox', { name: 'Наименование компонента донорской крови' }),
    ).toBeNull();

    const indications = screen.getByText('Показания к трансфузии');
    const donor = screen.getByText('Данные гемакона');
    expect(isBefore(indications, donor)).toBe(true);

    const select = screen.getByRole('button', { name: 'Эритроциты' }) as HTMLButtonElement;
    expect(select.disabled).toBe(false);
    fireEvent.click(select);
    expect(dependent.disabled).toBe(false);
    const name = screen.getByRole('textbox', {
      name: 'Наименование компонента донорской крови',
    });
    expect(isBefore(name, indications)).toBe(true);
    const anemic = screen.getByRole('checkbox', { name: 'Анемический синдром' });
    expect(anemic.matches(':disabled')).toBe(false);
    fireEvent.click(anemic);
    expect(onSave).toHaveBeenLastCalledWith({ indicationRbcAnemicSyndrome: '1' });
  },
);

it('формирует запись об анемическом синдроме независимо от гемической гипоксии', () => {
  expect(
    formatIndications({
      indicationComponent: 'erythrocytes',
      indicationRbcAnemicSyndrome: '1',
    }),
  ).toBe('Анемический синдром.');
  expect(
    formatIndications({
      indicationComponent: 'erythrocytes',
      indicationRbcAnemicSyndrome: '1',
      indicationRbcHemicHypoxia: '1',
    }),
  ).toBe('Признаки гемической гипоксии. Анемический синдром.');
});
