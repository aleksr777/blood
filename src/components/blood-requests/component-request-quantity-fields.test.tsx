// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ComponentRequestQuantityFields } from './component-request-quantity-fields';
import { TRANSFUSION_INDICATIONS } from './component-request-447n';
import type { ComponentRequestDetailsValues } from './component-request-details-types';

afterEach(cleanup);

it('allows a selected transfusion indication to be cleared using the blank first option', () => {
  const Field = () => {
    const [values, setValues] = useState<ComponentRequestDetailsValues>({
      requiredComponent: '',
      componentCode: '',
      quantity: '',
      estimatedVolumeMl: '',
      transfusionIndicationCode: '',
      individualSelectionRequired: '',
      individualSelectionCode: '',
      indicationValues: {},
    });
    return (
      <ComponentRequestQuantityFields
        values={values}
        indications={TRANSFUSION_INDICATIONS}
        selectedIndication={TRANSFUSION_INDICATIONS.find(
          ({ code }) => code === values.transfusionIndicationCode,
        )}
        onChange={(next) => setValues((current) => ({ ...current, ...next }))}
      />
    );
  };
  render(<Field />);
  const select = screen.getByRole('combobox', {
    name: 'Код показания к трансфузии (графа 8)',
  }) as HTMLSelectElement;
  expect(select.options[0].value).toBe('');
  expect(select.options[0].textContent).toBe('');
  expect(screen.queryByText('Выберите показание')).toBeNull();
  fireEvent.change(select, { target: { value: '1.1' } });
  expect(select.value).toBe('1.1');
  fireEvent.change(select, { target: { value: '' } });
  expect(select.value).toBe('');
});
