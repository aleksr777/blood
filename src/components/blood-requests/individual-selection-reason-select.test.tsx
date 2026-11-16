// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { INDIVIDUAL_SELECTION_INDICATIONS } from './component-request-447n';
import { IndividualSelectionReasonSelect } from './individual-selection-reason-select';

vi.mock('../../storage/repositories/saved-options', () => ({
  loadSavedOptions: vi.fn(async () => [{ id: 1, value: 'Своё показание' }]),
  subscribeSavedOptions: () => () => undefined,
}));
afterEach(cleanup);

it.each([false, true])('shows editable saved reasons above presets (coded: %s)', async (coded) => {
  const onChange = vi.fn();
  const label = coded
    ? 'Показание для индивидуального подбора (графа 10)'
    : 'Показания для индивидуального подбора';
  render(<IndividualSelectionReasonSelect coded={coded} value="" onChange={onChange} />);
  fireEvent.click(screen.getByRole('button', { name: `Показать сохранённые варианты: ${label}` }));
  const custom = await screen.findByRole('button', { name: 'Своё показание' });
  const preset = screen.getByRole('button', {
    name: coded ? '3 — Аллоиммунные антитела к эритроцитам' : 'Аллоиммунные антитела к эритроцитам',
  });
  expect(custom.compareDocumentPosition(preset) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(custom.closest('div')?.querySelector('[aria-label="Изменить значение"]')).toBeTruthy();
  expect(screen.queryByText('Выберите показание')).toBeNull();
  fireEvent.click(preset);
  expect(onChange).toHaveBeenCalledWith(coded ? '3' : INDIVIDUAL_SELECTION_INDICATIONS[2].label);
  fireEvent.change(screen.getByRole('textbox', { name: label }), { target: { value: 'Новое' } });
  expect(onChange).toHaveBeenCalledWith('Новое');
});

it.each(INDIVIDUAL_SELECTION_INDICATIONS)(
  'displays a legacy code $code as its description',
  ({ code, label }) => {
    render(<IndividualSelectionReasonSelect value={code} onChange={vi.fn()} />);
    expect(
      (
        screen.getByRole('textbox', {
          name: 'Показания для индивидуального подбора',
        }) as HTMLInputElement
      ).value,
    ).toBe(label);
  },
);
