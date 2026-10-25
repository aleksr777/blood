// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ProtocolEditorModal } from './protocol-editor-modal';
import { RecipientHistoryModal } from './recipient-history-modal';

vi.mock('../modal/modal', () => ({
  default: ({ title, children }: { title: string; children: ReactNode }) => (
    <section role="dialog" aria-label={title}>
      {children}
    </section>
  ),
}));
afterEach(cleanup);

const values = {
  recipientSex: 'Женский',
  recipientPregnanciesCount: '2',
  previousTransfusionsStatus: 'had',
  previousTransfusions: 'Эритроцитная взвесь в 2020 году',
  previousReactionsStatus: 'had',
  previousReactions: 'Описание реакции',
  individualSelectionHistoryStatus: 'unknown',
};

const renderHistory = (source: string, savedDocument = false) => {
  const onChange = vi.fn();
  const props = {
    values: savedDocument ? { ...values, previousTransfusionsStatus: 'none' } : values,
    savedDocument,
    onChange,
    onClose: vi.fn(),
  };
  render(
    source === 'direction' ? (
      <RecipientHistoryModal {...props} />
    ) : (
      <ProtocolEditorModal
        {...props}
        blockId="history"
        bloodGroupWarning=""
        bloodGroupWarningDismissible
        onDismissBloodGroupWarning={vi.fn()}
        componentUnitNumberWarning=""
        onDismissComponentUnitNumberWarning={vi.fn()}
        previousTransfusionSuggestion=""
        persistReusableOptions={false}
        onOpenRecipients={vi.fn()}
        onSelectRecipient={vi.fn()}
        onSave={onChange}
      />
    ),
  );
  return onChange;
};

it.each(['protocol', 'direction'])(
  'edits the same history and obstetric fields from %s',
  (source) => {
    const onChange = renderHistory(source);
    expect(screen.getByRole('dialog', { name: 'Анамнез реципиента' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Акушерский анамнез' })).toBeTruthy();
    expect(
      (screen.getByRole('spinbutton', { name: 'Количество беременностей' }) as HTMLInputElement)
        .value,
    ).toBe('2');
    const reactions = screen.getByRole('textbox', {
      name: 'Реакции и осложнения на трансфузии в анамнезе',
    });
    expect((reactions as HTMLTextAreaElement).value).toBe('Описание реакции');
    fireEvent.change(reactions, { target: { value: 'Уточнённое описание' } });
    expect(onChange).toHaveBeenLastCalledWith({ previousReactions: 'Уточнённое описание' });
    expect(
      screen.getByRole('group', { name: 'Трансфузии по индивидуальному подбору в анамнезе' }),
    ).toBeTruthy();
  },
);

it.each(['protocol', 'direction'])(
  'leaves saved history unchanged on opening from %s',
  (source) => {
    const onChange = renderHistory(source, true);
    expect(onChange).not.toHaveBeenCalled();
  },
);
