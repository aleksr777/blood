// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ObstetricHistoryFields } from './obstetric-history-fields';
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

it.each(['0', '00', 'Не было', 'Не известно'])(
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
      fireEvent.click(screen.getByRole('button', { name: 'Варианты: Количество родов' }));
      fireEvent.click(screen.getByRole('option', { name: value }));
    };
    expect(formatObstetricHistory(current)).toContain('болезнь новорождённых отмечалась');
    chooseBirths(births);
    expect(current.recipientBirthsCount).toBe(births === 'Не было' ? '0' : births);
    expect(current.recipientHemolyticDiseaseNewbornHistory).toBe('Не известно');
    expect(screen.getByRole('button', { name: label }).matches(':disabled')).toBe(true);
    expect(formatObstetricHistory(current)).not.toMatch(/болезн/);
    chooseBirths('1');
    expect(screen.getByRole('button', { name: label }).matches(':disabled')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(screen.queryByRole('option', { name: 'Не выбрано' })).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: 'Нет' }));
    expect(formatObstetricHistory(current)).toContain('болезнь новорождённых не отмечалась');
  },
);
