// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadSavedOptions } from '../../storage/repositories/saved-options';
import { BloodComponentSelector, type BloodComponentSelection } from './blood-component-selector';
import { IndividualSelectionComponentModal } from '../blood-requests/individual-selection-component-modal';
import type { ReactNode } from 'react';

vi.mock('../modal/modal', () => ({
  default: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

vi.mock('../../storage/repositories/saved-options', () => ({
  loadSavedOptions: vi.fn(async () => []),
  subscribeSavedOptions: () => () => undefined,
  rememberSavedOption: vi.fn(async () => []),
}));
beforeEach(() => {
  vi.clearAllMocks();
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

const Harness = ({
  initial = { group: '', name: '' },
  fixedGroup,
}: {
  initial?: BloodComponentSelection;
  fixedGroup?: string;
}) => {
  const [value, setValue] = useState(initial);
  return <BloodComponentSelector {...value} fixedGroup={fixedGroup} onChange={setValue} />;
};
const nameInput = () =>
  screen.getByRole('textbox', {
    name: 'Наименование компонента донорской крови',
  }) as HTMLInputElement;
const openNames = () =>
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Показать сохранённые варианты: Наименование компонента донорской крови',
    }),
  );

it('requires a group and clears an incompatible name only when the group actually changes', async () => {
  render(<Harness />);
  expect(
    screen.queryByRole('textbox', { name: 'Наименование компонента донорской крови' }),
  ).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Эритроциты' }));
  fireEvent.change(nameInput(), { target: { value: 'Мой компонент' } });
  fireEvent.click(screen.getByRole('button', { name: 'Эритроциты' }));
  expect(nameInput().value).toBe('Мой компонент');
  fireEvent.click(screen.getByRole('button', { name: 'Плазма' }));
  expect(nameInput().value).toBe('');
  openNames();
  fireEvent.click(screen.getByRole('button', { name: 'Свежезамороженная плазма' }));
  expect(nameInput().value).toBe('Свежезамороженная плазма');
  await waitFor(() => expect(loadSavedOptions).toHaveBeenCalledWith('componentName:plasma-cryo'));
});

it('supports a fixed component group while offering its shared names', async () => {
  render(<Harness fixedGroup="erythrocytes" />);
  expect((screen.getByRole('button', { name: 'Эритроциты' }) as HTMLButtonElement).disabled).toBe(
    true,
  );
  expect(screen.queryByRole('button', { name: 'Плазма' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Тромбоциты' })).toBeNull();
  openNames();
  fireEvent.click(screen.getByRole('button', { name: 'Отмытые эритроциты' }));
  expect(nameInput().value).toBe('Отмытые эритроциты');
  await waitFor(() => expect(loadSavedOptions).toHaveBeenCalledWith('componentName:erythrocytes'));
});

it('offers platelet names without leaking the previous group presets', async () => {
  render(<Harness initial={{ group: 'erythrocytes', name: 'Эритроцитная взвесь' }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Тромбоциты' }));
  openNames();
  expect(screen.queryByRole('button', { name: 'Эритроцитная взвесь' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Концентрат тромбоцитов' }));
  expect(nameInput().value).toBe('Концентрат тромбоцитов');
  await waitFor(() => expect(loadSavedOptions).toHaveBeenCalledWith('componentName:platelets'));
});

it('retains a legacy request name when its missing group is inferred and selected', async () => {
  const onLocalChange = vi.fn();
  const onIndicationsChange = vi.fn();
  render(
    <IndividualSelectionComponentModal
      requiredComponent="Отмытые эритроциты"
      quantity="2"
      individualSelectionIndications=""
      indicationValues={{}}
      showRequestOptions
      onLocalChange={onLocalChange}
      onIndicationsChange={onIndicationsChange}
      onClose={() => undefined}
    />,
  );
  expect(nameInput().value).toBe('Отмытые эритроциты');
  fireEvent.click(screen.getByRole('button', { name: 'Эритроциты' }));
  expect(onLocalChange).toHaveBeenLastCalledWith({ requiredComponent: 'Отмытые эритроциты' });
  expect(onIndicationsChange).toHaveBeenCalledWith({
    componentGroup: 'erythrocytes',
    indicationComponent: 'erythrocytes',
  });
  await waitFor(() => expect(loadSavedOptions).toHaveBeenCalledWith('componentName:erythrocytes'));
});
