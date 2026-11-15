// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  INDIVIDUAL_SELECTION_INDICATIONS,
  individualSelectionReasonLabel,
} from './component-request-447n';
import { IndividualSelectionReasonSelect } from './individual-selection-reason-select';

afterEach(cleanup);

it('offers every matching indication by description only and saves the selected wording', () => {
  const onChange = vi.fn();
  render(<IndividualSelectionReasonSelect value="" onChange={onChange} />);
  const select = screen.getByRole('combobox', {
    name: 'Показания для индивидуального подбора',
  }) as HTMLSelectElement;
  const options = Array.from(select.options);
  expect(options.map((option) => option.textContent)).toEqual([
    'Выберите показание',
    ...INDIVIDUAL_SELECTION_INDICATIONS.map(({ label }) => label),
  ]);
  expect(options.slice(1).map((option) => option.value)).toEqual(
    INDIVIDUAL_SELECTION_INDICATIONS.map(({ label }) => label),
  );
  fireEvent.change(select, {
    target: { value: 'Аллоиммунные антитела к эритроцитам' },
  });
  expect(onChange).toHaveBeenCalledWith('Аллоиммунные антитела к эритроцитам');
});

it.each(INDIVIDUAL_SELECTION_INDICATIONS)(
  'resolves a legacy code $code to its description rather than showing the code',
  ({ code, label }) => {
    expect(individualSelectionReasonLabel(code)).toBe(label);
    render(<IndividualSelectionReasonSelect value={code} onChange={() => {}} />);
    const select = screen.getByRole('combobox', {
      name: 'Показания для индивидуального подбора',
    }) as HTMLSelectElement;
    expect(select.value).toBe(label);
    expect(Array.from(select.options).some((option) => option.textContent === code)).toBe(false);
  },
);

it('retains old free-text indications until an explicit replacement or clearing', () => {
  const onChange = vi.fn();
  const legacy = 'Собственное клиническое обоснование';
  render(<IndividualSelectionReasonSelect value={legacy} onChange={onChange} />);
  const select = screen.getByRole('combobox', {
    name: 'Показания для индивидуального подбора',
  }) as HTMLSelectElement;
  expect(select.value).toBe(legacy);
  expect(Array.from(select.options).some((option) => option.value === legacy)).toBe(true);
  fireEvent.change(select, { target: { value: '' } });
  expect(onChange).toHaveBeenCalledWith('');
});
