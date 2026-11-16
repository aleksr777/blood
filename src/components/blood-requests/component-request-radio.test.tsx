// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ComponentRequestIndividualSelectionFields } from './component-request-selection-fields';
import type { ComponentRequestDetailsValues } from './component-request-details-types';

vi.mock('./individual-selection-reason-select', () => ({
  IndividualSelectionReasonSelect: () => <div>Показание к подбору</div>,
}));
afterEach(cleanup);

it('clears the requested selection and its code when the selected radio is clicked again', () => {
  const Field = () => {
    const [values, setValues] = useState<ComponentRequestDetailsValues>({
      requiredComponent: 'Эритроциты',
      componentCode: '',
      quantity: '',
      estimatedVolumeMl: '',
      transfusionIndicationCode: '',
      individualSelectionRequired: 'yes',
      individualSelectionCode: '3',
      indicationValues: {},
    });
    return (
      <>
        <ComponentRequestIndividualSelectionFields
          values={values}
          onChange={(next) => setValues((old) => ({ ...old, ...next }))}
        />
        <output>{JSON.stringify(values)}</output>
      </>
    );
  };
  render(<Field />);
  fireEvent.click(screen.getByRole('radio', { name: 'Да' }));
  expect(screen.queryByText('Показание к подбору')).toBeNull();
  expect(screen.getByText(/individualSelectionRequired/).textContent).toContain(
    '"individualSelectionRequired":""',
  );
  expect(screen.getByText(/individualSelectionCode/).textContent).toContain(
    '"individualSelectionCode":""',
  );
  fireEvent.click(screen.getByRole('radio', { name: 'Нет' }));
  expect((screen.getByRole('radio', { name: 'Нет' }) as HTMLInputElement).checked).toBe(true);
  fireEvent.click(screen.getByRole('radio', { name: 'Нет' }));
  expect((screen.getByRole('radio', { name: 'Нет' }) as HTMLInputElement).checked).toBe(false);
});
