// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CompatibilityTestsFields } from './compatibility-tests-fields';
import { ComplicationsFields } from './complications-fields';
import { SelectionFields } from './selection-fields';
import { CompatibilityTestsBlock, ComplicationsBlock } from './second-page-blocks';
import { SelectionBlock } from './first-page-blocks-secondary';
import { RecipientExaminationFields } from './recipient-examination-fields';
import { formatAlloimmuneAntibodies } from './recipient-examination-model';
import { formatHistoryValue } from './recipient-history-model';
import { RecipientHistoryFields } from './recipient-history-fields';
import { buildRegistrationTransfusionRow } from '../transfusion-registration/registration-transfusion-table';
import type { ProtocolValues } from './protocol-types';
vi.mock('./protocol-field-control', () => ({ ProtocolFieldControl: () => null }));
afterEach(cleanup);
it('keeps a cancelled compatibility result empty in the editor and in the printed form', () => {
  const Panel = () => {
    const [values, setValues] = useState<ProtocolValues>({
      componentGroup: 'erythrocytes',
      recipientAbo: 'A(II)',
    });
    return (
      <>
        <CompatibilityTestsFields
          values={values}
          onChange={(next) => setValues((old) => ({ ...old, ...next }))}
        />
        <table>
          <CompatibilityTestsBlock values={values} onOpenBlock={vi.fn()} part="confirmed" />
          <CompatibilityTestsBlock values={values} onOpenBlock={vi.fn()} part="tests" />
        </table>
      </>
    );
  };
  render(<Panel />);
  for (const groupName of [
    'Подтверждена группа крови реципиента',
    'Проба на плоскости',
    'Биологическая проба',
  ]) {
    const group = screen.getByRole('group', { name: groupName });
    const selected = within(group).getByRole('radio', { checked: true }) as HTMLInputElement;
    fireEvent.click(selected);
    expect(selected.checked).toBe(false);
  }
  expect(
    screen.getByText('Подтверждена группа крови реципиента:').nextElementSibling?.textContent,
  ).toBe('');
  expect(screen.getByText('На плоскости:').nextElementSibling?.textContent).toBe('');
  expect(screen.getByText('Биологическая проба:').nextElementSibling?.textContent).toBe('');
});
it('does not infer cancelled selection or complications from retained old details', () => {
  const Panel = () => {
    const [values, setValues] = useState<ProtocolValues>({
      selectionStatus: 'performed',
      selectionOrganization: 'Старый подбор',
      complicationsStatus: 'had',
      symptoms: 'Старые симптомы',
      severity: 'Тяжёлое',
    });
    const change = (next: ProtocolValues) => setValues((old) => ({ ...old, ...next }));
    return (
      <>
        <SelectionFields values={values} onChange={change} />
        <ComplicationsFields values={values} onChange={change} />
        <table>
          <SelectionBlock values={values} onOpenBlock={vi.fn()} part="main" />
          <ComplicationsBlock values={values} onOpenBlock={vi.fn()} part="main" />
        </table>
        <output data-testid="registration">
          {
            buildRegistrationTransfusionRow({
              id: 1,
              recipientId: 1,
              values,
              createdAt: 0,
              updatedAt: 0,
            }).complications
          }
        </output>
      </>
    );
  };
  render(<Panel />);
  fireEvent.click(screen.getByRole('radio', { name: 'Проводился' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Были' }));
  expect(screen.queryByText('Старый подбор')).toBeNull();
  expect(screen.queryByText('Старые симптомы')).toBeNull();
  expect(screen.queryByText('Не проводился', { selector: '.cell-value' })).toBeNull();
  expect(screen.queryByText('Не было', { selector: '.cell-value' })).toBeNull();
  expect(screen.getByTestId('registration').textContent).toBe('');
});
it('clears antibody and transfusion history text from the form after deselection', () => {
  const Panel = () => {
    const [values, setValues] = useState<ProtocolValues>({
      alloimmuneAntibodyStatus: 'not-found',
      alloimmuneAntibodies: 'Старый текст',
      previousTransfusionsStatus: 'had',
      previousTransfusions: 'Старая трансфузия',
    });
    const change = (next: ProtocolValues) => setValues((old) => ({ ...old, ...next }));
    return (
      <>
        <RecipientExaminationFields values={values} onChange={change} />
        <RecipientHistoryFields values={values} onChange={change} showObstetricHistory={false} />
        <output data-testid="antibodies">{formatAlloimmuneAntibodies(values)}</output>
        <output data-testid="history">
          {formatHistoryValue(values, 'previousTransfusionsStatus', 'previousTransfusions')}
        </output>
      </>
    );
  };
  render(<Panel />);
  fireEvent.click(screen.getByRole('radio', { name: 'не найдены' }));
  fireEvent.click(
    within(
      screen.getByRole('group', { name: 'Трансфузии компонентов крови в анамнезе' }),
    ).getByRole('radio', { name: 'Были' }),
  );
  expect(screen.getByTestId('antibodies').textContent).toBe('');
  expect(screen.getByTestId('history').textContent).toBe('');
});
