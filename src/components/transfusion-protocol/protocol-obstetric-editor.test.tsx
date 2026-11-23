// @vitest-environment jsdom
import { useState, type ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ProtocolEditorModal } from './protocol-editor-modal';
import { chooseCount, countRadio } from './obstetric-test-controls';
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
    'Количество беременностей',
    'Количество родов',
    'Самопроизвольные аборты в анамнезе',
  ]) {
    chooseCount(label, 'Не известно');
    expect(countRadio(label, 'Не известно').checked).toBe(true);
  }
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
