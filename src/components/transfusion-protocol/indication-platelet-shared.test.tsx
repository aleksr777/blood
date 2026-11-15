// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { IndividualSelectionComponentModal } from '../blood-requests/individual-selection-component-modal';
import { IndicationsFields } from './indications-fields';
import { formatIndications } from './indications-model';

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

const group = { componentGroup: 'platelets', indicationComponent: 'platelets' };

it('uses the platelet checklist including other indications in the transfusion protocol', () => {
  const onChange = vi.fn();
  render(<IndicationsFields values={group} onChange={onChange} />);
  expect(screen.getAllByRole('checkbox')).toHaveLength(5);
  expect(screen.getByRole('textbox', { name: 'Порог количества тромбоцитов' })).toBeTruthy();
  fireEvent.click(
    screen.getByRole('checkbox', { name: 'Планируется инвазивное медицинское вмешательство.' }),
  );
  expect(onChange).toHaveBeenCalledWith({
    indicationPlateletInvasiveProcedure: '1',
    indicationPlateletVersion: '2',
  });
});

it('uses the same expanded checklist in the individual selection direction', () => {
  const onIndicationsChange = vi.fn();
  render(
    <IndividualSelectionComponentModal
      requiredComponent="Концентрат тромбоцитов"
      quantity="1"
      individualSelectionIndications=""
      indicationValues={{ ...group, indicationPlateletThrombocytopenia: '1' }}
      onLocalChange={vi.fn()}
      onIndicationsChange={onIndicationsChange}
      onClose={() => {}}
    />,
  );
  expect(screen.getAllByRole('checkbox')).toHaveLength(5);
  const threshold = screen.getByRole('textbox', {
    name: 'Порог количества тромбоцитов',
  }) as HTMLInputElement;
  expect(threshold.value).toBe('50');
  fireEvent.change(threshold, { target: { value: '60' } });
  expect(onIndicationsChange).toHaveBeenCalledWith({
    ...group,
    indicationPlateletCount: '60',
    indicationPlateletVersion: '2',
  });
  expect(
    formatIndications({
      ...group,
      indicationPlateletVersion: '2',
      indicationPlateletThrombocytopenia: '1',
      indicationPlateletCount: '60',
    }),
  ).toBe('Количество тромбоцитов менее 60 × 10⁹/л.');
});
