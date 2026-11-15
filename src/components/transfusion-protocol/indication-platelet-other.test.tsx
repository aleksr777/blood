// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { PlateletIndications } from './indication-platelet-fields';
import { formatIndications } from './indications-model';
import type { ProtocolValues } from './protocol-types';

afterEach(cleanup);

const PlateletHarness = () => {
  const [values, setValues] = useState<ProtocolValues>({
    indicationComponent: 'platelets',
    indicationPlateletVersion: '2',
  });
  return (
    <>
      <PlateletIndications
        values={values}
        onChange={(changes) => setValues((current) => ({ ...current, ...changes }))}
      />
      <output data-testid="stored">{JSON.stringify(values)}</output>
      <output data-testid="printed">{formatIndications(values)}</output>
    </>
  );
};

it('shows an editable textarea for Other indications and prints its wording', () => {
  const { container } = render(<PlateletHarness />);
  const other = screen.getByRole('checkbox', { name: 'Другие показания' });
  const input = () =>
    container.querySelector<HTMLTextAreaElement>('textarea[name="indicationPlateletOtherText"]');

  expect(input()).toBeNull();
  fireEvent.click(other);
  expect(other).toHaveProperty('checked', true);
  expect(input()).not.toBeNull();
  fireEvent.change(input()!, { target: { value: '  Индивидуальное показание пациента  ' } });
  expect(screen.getByTestId('printed').textContent).toBe('Индивидуальное показание пациента.');
  expect(screen.getByTestId('stored').textContent).toContain('Индивидуальное показание пациента');
});

it('hides the free-text indication when unchecked, retaining the typed text for re-selection', () => {
  const { container } = render(<PlateletHarness />);
  const other = screen.getByRole('checkbox', { name: 'Другие показания' });
  fireEvent.click(other);
  const input = () =>
    container.querySelector<HTMLTextAreaElement>('textarea[name="indicationPlateletOtherText"]');

  fireEvent.change(input()!, { target: { value: 'Дополнительное показание' } });
  fireEvent.click(other);
  expect(input()).toBeNull();
  expect(screen.getByTestId('printed').textContent).toBe('');
  expect(screen.getByTestId('stored').textContent).toContain('Дополнительное показание');
  fireEvent.click(other);
  expect(input()?.value).toBe('Дополнительное показание');
  expect(screen.getByTestId('printed').textContent).toBe('Дополнительное показание.');
});
