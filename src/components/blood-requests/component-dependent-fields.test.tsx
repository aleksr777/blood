// @vitest-environment jsdom
import { useState, type ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ComponentRequestDetailsModal } from './component-request-details-modal';
import { IndividualSelectionComponentModal } from './individual-selection-component-modal';
import type { ComponentRequestDetailsValues } from './component-request-details-types';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';

vi.mock('../modal/modal', () => ({
  default: ({ title, children }: { title: string; children: ReactNode }) => (
    <section role="dialog" aria-label={title}>
      {children}
    </section>
  ),
}));
vi.mock('../../storage/repositories/saved-options', () => ({
  loadSavedOptions: vi.fn(async () => []),
  subscribeSavedOptions: () => () => undefined,
  rememberSavedOption: vi.fn(async () => []),
}));
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const dependentFields = () =>
  document.querySelector('fieldset[data-component-dependent]') as HTMLFieldSetElement;

const emptyDetails: ComponentRequestDetailsValues = {
  requiredComponent: '',
  componentCode: '',
  quantity: '',
  estimatedVolumeMl: '',
  transfusionIndicationCode: '',
  individualSelectionRequired: '',
  individualSelectionCode: '',
  indicationValues: {},
};

const RequestHarness = () => {
  const [values, setValues] = useState(emptyDetails);
  return (
    <ComponentRequestDetailsModal
      values={values}
      onChange={(changes) => setValues((current) => ({ ...current, ...changes }))}
      onIndicationsChange={(changes) =>
        setValues((current) => ({
          ...current,
          indicationValues: { ...current.indicationValues, ...changes },
        }))
      }
      onClose={() => undefined}
    />
  );
};

const DirectionHarness = () => {
  const [indicationValues, setIndicationValues] = useState<ProtocolValues>({});
  const [local, setLocal] = useState({
    requiredComponent: '',
    quantity: '',
    individualSelectionIndications: '',
  });
  return (
    <IndividualSelectionComponentModal
      {...local}
      indicationValues={indicationValues}
      onLocalChange={(changes) => setLocal((current) => ({ ...current, ...changes }))}
      onIndicationsChange={(changes) =>
        setIndicationValues((current) => ({ ...current, ...changes }))
      }
      onClose={() => undefined}
    />
  );
};

it('блокирует поля заявки до выбора группы компонента крови', () => {
  render(<RequestHarness />);
  expect(screen.getByRole('dialog', { name: 'Компонент крови и показания' })).toBeTruthy();
  const dependent = dependentFields();
  expect(dependent.disabled).toBe(true);
  expect(
    Array.from(dependent.querySelectorAll('input, select, textarea, button')).every((control) =>
      control.matches(':disabled'),
    ),
  ).toBe(true);
  const quantity = screen.getByRole('spinbutton', {
    name: 'Количество, единиц (графа 7)',
  });
  expect(quantity.matches(':disabled')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Эритроциты' }));
  expect(dependent.disabled).toBe(false);
  expect(quantity.matches(':disabled')).toBe(false);
  const indicationSelect = screen.getByRole('combobox', {
    name: 'Код показания к трансфузии (графа 8)',
  });
  expect(indicationSelect.matches(':disabled')).toBe(false);
});

it('блокирует количество и показания в направлении до выбора группы', () => {
  render(<DirectionHarness />);
  const dependent = dependentFields();
  expect(dependent.disabled).toBe(true);
  const quantity = screen.getByRole('spinbutton', { name: 'Количество доз' });
  const indication = screen.getByRole('textbox', {
    name: 'Показания для индивидуального подбора',
  });
  expect(quantity.matches(':disabled')).toBe(true);
  expect(indication.matches(':disabled')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Плазма' }));
  expect(dependent.disabled).toBe(false);
  expect(quantity.matches(':disabled')).toBe(false);
  expect(indication.matches(':disabled')).toBe(false);
});
