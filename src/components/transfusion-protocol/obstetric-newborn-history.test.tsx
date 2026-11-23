// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ObstetricHistoryFields } from './obstetric-history-fields';
import { chooseCount, countInput } from './obstetric-test-controls';
import { formatObstetricHistory } from './obstetric-history';
import type { ProtocolValues } from './protocol-types';

afterEach(cleanup);
const label = 'Гемолитическая болезнь новорождённого в анамнезе';
const stored = {
  recipientSex: 'Женский',
  recipientPregnanciesCount: '3',
  recipientBirthsCount: '2',
  recipientSpontaneousAbortionsCount: '0',
  recipientHemolyticDiseaseNewbornHistory: 'Да',
};

it.each(['0', '00', 'Не было', 'Не известно', ''])(
  'blocks newborn history at %s births without rewriting an opened snapshot',
  (births) => {
    const values = Object.freeze({ ...stored, recipientBirthsCount: births });
    const onChange = vi.fn();
    render(<ObstetricHistoryFields values={values} applyDefaults={false} onChange={onChange} />);
    expect(screen.getByRole('button', { name: label }).matches(':disabled')).toBe(true);
    expect(formatObstetricHistory(values)).not.toMatch(/болезн/);
    expect(onChange).not.toHaveBeenCalled();
    expect(values.recipientHemolyticDiseaseNewbornHistory).toBe('Да');
  },
);

it.each(['Не было', 'Не известно'])(
  'resets newborn history when births change to %s and enables it after a positive count',
  (births) => {
    let current: ProtocolValues = {};
    const Form = () => {
      const [values, setValues] = useState<ProtocolValues>(stored);
      current = values;
      return (
        <ObstetricHistoryFields
          values={values}
          onChange={(changes) => setValues((previous) => ({ ...previous, ...changes }))}
        />
      );
    };
    render(<Form />);
    const chooseBirths = (value: string) => {
      if (value === '1') {
        chooseCount('Количество родов', 'Количество:');
        fireEvent.change(countInput('Количество родов'), { target: { value } });
      } else chooseCount('Количество родов', value);
    };
    expect(formatObstetricHistory(current)).toContain(
      'В анамнезе была гемолитическая болезнь новорождённого',
    );
    chooseBirths(births);
    expect(current.recipientBirthsCount).toBe(births === 'Не было' ? '0' : births);
    expect(current.recipientHemolyticDiseaseNewbornHistory).toBe('Не известно');
    expect(screen.getByRole('button', { name: label }).matches(':disabled')).toBe(true);
    expect(formatObstetricHistory(current)).not.toMatch(/болезн/);
    chooseBirths('1');
    expect(screen.getByRole('button', { name: label }).matches(':disabled')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(screen.queryByRole('option', { name: 'Не выбрано' })).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: 'Не было' }));
    expect(current.recipientHemolyticDiseaseNewbornHistory).toBe('Не было');
    expect(formatObstetricHistory(current)).toContain('болезни новорождённого в анамнезе не было');
    fireEvent.click(screen.getByRole('button', { name: label }));
    fireEvent.click(screen.getByRole('option', { name: 'Было' }));
    expect(current.recipientHemolyticDiseaseNewbornHistory).toBe('Было');
    expect(formatObstetricHistory(current)).toContain(
      'В анамнезе была гемолитическая болезнь новорождённого',
    );
  },
);

it.each([
  ['Да', 'Было'],
  ['Нет', 'Не было'],
])('shows a saved %s choice as %s without rewriting the saved data', (saved, displayed) => {
  const values = Object.freeze({ ...stored, recipientHemolyticDiseaseNewbornHistory: saved });
  const onChange = vi.fn();
  render(<ObstetricHistoryFields values={values} applyDefaults={false} onChange={onChange} />);
  const control = screen.getByRole('button', { name: label });
  expect(control.textContent).toContain(displayed);
  fireEvent.click(control);
  expect(screen.getByRole('option', { name: displayed, selected: true })).toBeTruthy();
  expect(screen.queryByRole('option', { name: saved })).toBeNull();
  expect(onChange).not.toHaveBeenCalled();
  expect(values.recipientHemolyticDiseaseNewbornHistory).toBe(saved);
});
