// @vitest-environment jsdom
import { useState, type ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ComponentRequestDetailsModal } from './component-request-details-modal';
import { IndividualSelectionComponentModal } from './individual-selection-component-modal';
import type { ComponentRequestDetailsValues } from './component-request-details-types';
import type { ProtocolValues } from '../transfusion-protocol/protocol-types';

vi.mock('../modal/modal', () => ({
  default: ({ children }: { children: ReactNode }) => <section>{children}</section>,
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
const storedRequest: ComponentRequestDetailsValues = {
  requiredComponent: 'Эритроцитная взвесь лейкоредуцированная',
  componentCode: 'ЭВ-Л',
  quantity: '2',
  estimatedVolumeMl: '450',
  transfusionIndicationCode: '1.1',
  individualSelectionRequired: 'yes',
  individualSelectionCode: '3',
  indicationValues: { componentGroup: 'erythrocytes', indicationComponent: 'erythrocytes' },
};
const RequestHarness = () => {
  const [values, setValues] = useState(storedRequest);
  return (
    <>
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
      <output data-testid="draft">{JSON.stringify(values)}</output>
    </>
  );
};
it('restores code, name, quantity, and indications after deselecting and reselecting', () => {
  render(<RequestHarness />);
  const button = screen.getByRole('button', { name: 'Эритроциты' });
  fireEvent.click(button);
  const raw = screen.getByTestId('draft').textContent ?? '{}';
  const cleared = JSON.parse(raw) as ComponentRequestDetailsValues;
  expect(cleared.indicationValues.componentGroup).toBe('');
  expect(cleared.componentCode).toBe('ЭВ-Л');
  expect(cleared.requiredComponent).toBe(storedRequest.requiredComponent);
  expect(cleared.transfusionIndicationCode).toBe('1.1');
  const quantity = screen.getByRole('spinbutton', { name: 'Количество, единиц (графа 7)' });
  expect(quantity.matches(':disabled')).toBe(true);
  fireEvent.click(button);
  const codeInput = screen.getByRole('textbox', {
    name: 'Идентификационный код (графа 6)',
  }) as HTMLInputElement;
  expect(codeInput.value).toContain('ЭВ-Л');
  expect((quantity as HTMLInputElement).value).toBe('2');
});
const DirectionHarness = () => {
  const [local, setLocal] = useState({
    requiredComponent: 'Отмытые эритроциты',
    quantity: '2',
    individualSelectionIndications: 'Причина подбора',
  });
  const [indicationValues, setIndicationValues] = useState<ProtocolValues>({
    componentGroup: 'erythrocytes',
    indicationComponent: 'erythrocytes',
  });
  return (
    <>
      <IndividualSelectionComponentModal
        {...local}
        indicationValues={indicationValues}
        onLocalChange={(changes) => setLocal((current) => ({ ...current, ...changes }))}
        onIndicationsChange={(changes) =>
          setIndicationValues((current) => ({ ...current, ...changes }))
        }
        onClose={() => undefined}
      />
      <output data-testid="local">{JSON.stringify(local)}</output>
    </>
  );
};
it('preserves direction inputs through deselecting and reselecting the group', () => {
  render(<DirectionHarness />);
  const erythrocytes = screen.getByRole('button', { name: 'Эритроциты' });
  fireEvent.click(erythrocytes);
  expect(screen.getByTestId('local').textContent).toContain('Отмытые эритроциты');
  expect(screen.getByTestId('local').textContent).toContain('Причина подбора');
  const reason = screen.getByRole('textbox', { name: 'Показания для индивидуального подбора' });
  expect(reason.matches(':disabled')).toBe(true);
  fireEvent.click(erythrocytes);
  const name = screen.getByRole('textbox', {
    name: 'Наименование компонента донорской крови',
  }) as HTMLInputElement;
  expect(name.value).toBe('Отмытые эритроциты');
  expect((reason as HTMLInputElement).value).toBe('Причина подбора');
});
