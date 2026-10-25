// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadSavedOptions } from '../../storage/repositories/saved-options';
import { IndicationsFields } from './indications-fields';
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

const nameLabel = 'Наименование компонента донорской крови';
it('selects protocol indications by group while preserving an existing name for the same group', () => {
  const onChange = vi.fn();
  render(
    <IndicationsFields
      values={{ componentName: 'Отмытые эритроциты', componentGroup: 'erythrocytes' }}
      onChange={onChange}
    />,
  );
  expect(screen.queryByText(nameLabel)).toBeNull();
  expect(loadSavedOptions).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Признаки гемической гипоксии' }));
  expect(onChange).toHaveBeenLastCalledWith({ indicationRbcHemicHypoxia: '1' });
  fireEvent.click(screen.getByRole('button', { name: 'Эритроциты' }));
  expect(onChange).toHaveBeenLastCalledWith({
    componentGroup: 'erythrocytes',
    indicationComponent: 'erythrocytes',
    componentName: 'Отмытые эритроциты',
  });
  fireEvent.click(screen.getByRole('button', { name: 'Плазма' }));
  expect(onChange).toHaveBeenLastCalledWith({
    componentGroup: 'plasma-cryo',
    indicationComponent: 'plasma-cryo',
    componentName: '',
  });
});

it.each([true, false])(
  'keeps the component name and indications editable in both directions (request options: %s)',
  async (showRequestOptions) => {
    const onLocalChange = vi.fn();
    const onIndicationsChange = vi.fn();
    render(
      <IndividualSelectionComponentModal
        requiredComponent="Отмытые эритроциты"
        quantity="1"
        individualSelectionIndications=""
        indicationValues={{ indicationComponent: 'erythrocytes' }}
        showRequestOptions={showRequestOptions}
        fixedIndicationComponent={showRequestOptions ? undefined : 'erythrocytes'}
        onLocalChange={onLocalChange}
        onIndicationsChange={onIndicationsChange}
        onClose={() => undefined}
      />,
    );
    const nameInput = screen.getByRole('textbox', { name: nameLabel }) as HTMLInputElement;
    expect(nameInput.value).toBe('Отмытые эритроциты');
    expect(nameInput.disabled).toBe(false);
    expect(screen.getByRole('button', { name: 'Эритроциты' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Признаки гемической гипоксии' }));
    expect(onIndicationsChange).toHaveBeenLastCalledWith({
      componentGroup: 'erythrocytes',
      indicationComponent: 'erythrocytes',
      indicationRbcHemicHypoxia: '1',
    });
    expect(onLocalChange).not.toHaveBeenCalled();
    fireEvent.change(nameInput, { target: { value: 'Эритроцитная взвесь, лейкоредуцированная' } });
    expect(onLocalChange).toHaveBeenLastCalledWith({
      requiredComponent: 'Эритроцитная взвесь, лейкоредуцированная',
    });
    fireEvent.click(
      screen.getByRole('button', { name: `Показать сохранённые варианты: ${nameLabel}` }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Эритроцитная взвесь' }));
    expect(onLocalChange).toHaveBeenLastCalledWith({ requiredComponent: 'Эритроцитная взвесь' });
    await waitFor(() =>
      expect(loadSavedOptions).toHaveBeenCalledWith('componentName:erythrocytes'),
    );
  },
);
