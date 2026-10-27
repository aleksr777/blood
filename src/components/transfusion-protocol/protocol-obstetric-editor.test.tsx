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

it('keeps unknown choices in all fields after the protocol receives updated values', () => {
  const onClose = vi.fn();
  const Editor = () => {
    const [values, setValues] = useState<ProtocolValues>({
      recipientSex: 'Женский',
      recipientPregnanciesCount: '2',
      recipientBirthsCount: '1',
      recipientSpontaneousAbortionsCount: '1',
      recipientHemolyticDiseaseNewbornHistory: 'Да',
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
  for (const label of [
    'Варианты: Количество беременностей',
    'Варианты: Количество родов',
    'Варианты: Самопроизвольные аборты в анамнезе',
  ]) {
    fireEvent.click(screen.getByRole('button', { name: label }));
    fireEvent.click(screen.getByRole('option', { name: 'Не известно' }));
  }
  for (const control of screen.getAllByRole('textbox'))
    expect((control as HTMLInputElement).value).toBe('Не известно');
  fireEvent.click(screen.getByRole('button', { name: 'Готово' }));
  expect(onClose).toHaveBeenCalledWith(
    expect.objectContaining({
      recipientPregnanciesCount: 'Не известно',
      recipientBirthsCount: 'Не известно',
      recipientSpontaneousAbortionsCount: 'Не известно',
      recipientHemolyticDiseaseNewbornHistory: 'Не известно',
    }),
  );
});
