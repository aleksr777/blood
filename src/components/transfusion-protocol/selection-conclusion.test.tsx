// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SelectionFields } from './selection-fields';
import { SelectionBlock } from './first-page-blocks-secondary';
import type { ProtocolValues } from './protocol-types';

vi.mock('./protocol-field-control', () => ({ ProtocolFieldControl: () => null }));
afterEach(cleanup);

it('selects and cancels the conclusion in the editor and printed form', () => {
  const Panel = () => {
    const [values, setValues] = useState<ProtocolValues>({ selectionStatus: 'performed' });
    return (
      <>
        <SelectionFields
          values={values}
          onChange={(changes) => setValues((current) => ({ ...current, ...changes }))}
        />
        <table>
          <SelectionBlock values={values} onOpenBlock={() => undefined} part="responsible" />
        </table>
      </>
    );
  };
  render(<Panel />);
  const group = within(screen.getByRole('group', { name: 'Заключение' }));
  const printedValue = () =>
    screen
      .getByText('Заключение (совместимо/несовместимо):')
      .parentElement?.querySelector('.cell-value')?.textContent ?? '';
  const compatible = group.getByRole('radio', { name: 'Совместимо' }) as HTMLInputElement;
  const incompatible = group.getByRole('radio', { name: 'Несовместимо' }) as HTMLInputElement;
  expect(compatible.checked).toBe(false);
  expect(incompatible.checked).toBe(false);
  fireEvent.click(incompatible);
  expect(incompatible.checked).toBe(true);
  expect(printedValue()).toContain('Несовместимо');
  fireEvent.click(compatible);
  expect(compatible.checked).toBe(true);
  expect(incompatible.checked).toBe(false);
  expect(printedValue()).toContain('Совместимо');
  fireEvent.click(compatible);
  expect(compatible.checked).toBe(false);
  expect(printedValue()).toBe('');
});
