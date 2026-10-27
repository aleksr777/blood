// @vitest-environment jsdom
import { useState, type ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ProtocolEditorModal } from './protocol-editor-modal';
import type { ProtocolValues } from './protocol-types';

vi.mock('../modal/modal', () => ({
  default: ({ children, onClose }: { children: ReactNode; onClose: () => void }) => (
    <section>
      {children}
      <button onClick={onClose}>Готово</button>
    </section>
  ),
}));
afterEach(cleanup);

it('keeps unknown history selected and blocked after the protocol receives updated values', () => {
  const onClose = vi.fn();
  const Editor = () => {
    const [values, setValues] = useState<ProtocolValues>({
      recipientSex: 'Женский',
      recipientPregnanciesCount: '2',
      recipientBirthsCount: '1',
    });
    return (
      <ProtocolEditorModal
        blockId="history"
        values={values}
        savedDocument
        persistReusableOptions={false}
        bloodGroupWarning=""
        bloodGroupWarningDismissible={false}
        onDismissBloodGroupWarning={vi.fn()}
        componentUnitNumberWarning=""
        onDismissComponentUnitNumberWarning={vi.fn()}
        previousTransfusionSuggestion=""
        onOpenRecipients={vi.fn()}
        onSelectRecipient={vi.fn()}
        onSave={(changes) => setValues((current) => ({ ...current, ...changes }))}
        onClose={onClose}
      />
    );
  };
  render(<Editor />);
  fireEvent.click(screen.getByRole('radio', { name: 'Не известен' }));
  expect((screen.getByRole('radio', { name: 'Не известен' }) as HTMLInputElement).checked).toBe(
    true,
  );
  for (const control of screen.getAllByRole('spinbutton'))
    expect(control.matches(':disabled')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Готово' }));
  expect(onClose).toHaveBeenCalledWith(
    expect.objectContaining({ recipientObstetricHistoryStatus: 'unknown' }),
  );
});
