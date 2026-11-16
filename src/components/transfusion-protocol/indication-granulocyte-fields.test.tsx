// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { GRANULOCYTE_NEUTROPHIL_INDICATION } from '../../domain/granulocyte-indications';
import { getProtocolBlockConfig } from './editor-config';
import { GranulocyteIndications } from './indication-granulocyte-fields';
import { formatIndications } from './indications-model';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

it('offers only the requested neutrophil threshold and free-text other indication', () => {
  const onChange = vi.fn();
  const { rerender } = render(<GranulocyteIndications values={{}} onChange={onChange} />);
  expect(screen.getAllByRole('checkbox').map((input) => input.parentElement?.textContent)).toEqual([
    GRANULOCYTE_NEUTROPHIL_INDICATION,
    'Другие показания',
  ]);
  expect(screen.queryByRole('textbox')).toBeNull();
  fireEvent.click(screen.getByRole('checkbox', { name: GRANULOCYTE_NEUTROPHIL_INDICATION }));
  expect(onChange).toHaveBeenLastCalledWith({ indicationGranulocyteNeutrophilsLow: '1' });

  rerender(
    <GranulocyteIndications
      values={{ indicationGranulocyteNeutrophilsLow: '1' }}
      onChange={onChange}
    />,
  );
  fireEvent.click(screen.getByRole('checkbox', { name: GRANULOCYTE_NEUTROPHIL_INDICATION }));
  expect(onChange).toHaveBeenLastCalledWith({ indicationGranulocyteNeutrophilsLow: '' });
});

it('expands the other-reason textarea and prints both indications in order', () => {
  const onChange = vi.fn();
  const values = {
    indicationComponent: 'granulocytes',
    indicationGranulocyteNeutrophilsLow: '1',
    indicationGranulocyteOther: '1',
    indicationGranulocyteOtherText: '  Дополнительная причина  ',
  };
  render(<GranulocyteIndications values={values} onChange={onChange} />);
  const other = screen.getByRole('textbox');
  fireEvent.change(other, { target: { value: 'Ещё одна причина' } });
  expect(onChange).toHaveBeenLastCalledWith({ indicationGranulocyteOtherText: 'Ещё одна причина' });
  expect(formatIndications(values)).toBe(
    `${GRANULOCYTE_NEUTROPHIL_INDICATION} Дополнительная причина.`,
  );
});

it('includes granulocyte fields in the protocol editor', () => {
  const names = getProtocolBlockConfig('donor').fields.map(({ name }) => name);
  for (const field of [
    'indications',
    'indicationGranulocyteNeutrophilsLow',
    'indicationGranulocyteOther',
    'indicationGranulocyteOtherText',
  ]) {
    expect(names).toContain(field);
  }
});
