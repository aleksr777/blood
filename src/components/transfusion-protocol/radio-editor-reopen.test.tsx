// @vitest-environment jsdom
import { useState, type ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
vi.mock('./protocol-field-control', () => ({ ProtocolFieldControl: () => null }));
afterEach(cleanup);

it('retains a cancelled default after closing and reopening the real editor', () => {
  const App = () => {
    const [values, setValues] = useState<ProtocolValues>({ componentGroup: 'erythrocytes' });
    const [open, setOpen] = useState(true);
    return (
      <>
        <button onClick={() => setOpen(true)}>Открыть</button>
        {open && (
          <ProtocolEditorModal
            blockId="compatibilityTests"
            values={values}
            persistReusableOptions={false}
            bloodGroupWarning=""
            bloodGroupWarningDismissible={false}
            onDismissBloodGroupWarning={vi.fn()}
            componentUnitNumberWarning=""
            onDismissComponentUnitNumberWarning={vi.fn()}
            previousTransfusionSuggestion=""
            onOpenRecipients={vi.fn()}
            onSelectRecipient={vi.fn()}
            onSave={(changes) => setValues((old) => ({ ...old, ...changes }))}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    );
  };
  render(<App />);
  const getRadio = () =>
    within(screen.getByRole('group', { name: 'Проба на плоскости' })).getByRole('radio', {
      name: 'Совместимо',
    }) as HTMLInputElement;
  expect(getRadio().checked).toBe(true);
  fireEvent.click(getRadio());
  expect(getRadio().checked).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Готово' }));
  fireEvent.click(screen.getByRole('button', { name: 'Открыть' }));
  expect(getRadio().checked).toBe(false);
});
