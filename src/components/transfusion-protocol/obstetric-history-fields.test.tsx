// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RecipientHistoryFields } from './recipient-history-fields';
import type { ProtocolValues } from './protocol-types';

afterEach(cleanup);
const newbornLabel = 'Гемолитическая болезнь новорождённого в анамнезе';
const stored = {
  recipientSex: 'Женский',
  recipientPregnanciesCount: '2',
  recipientBirthsCount: '1',
  recipientSpontaneousAbortionsCount: '1',
  recipientHemolyticDiseaseNewbornHistory: 'Да',
};

it.each(['0', '00'])(
  'clears excessive counts at %s and re-enables the fields when pregnancies are entered',
  (zero) => {
    const onChange = vi.fn();
    const History = () => {
      const [values, setValues] = useState<ProtocolValues>(stored);
      return (
        <RecipientHistoryFields
          values={values}
          applyDefaults={false}
          showTransfusionHistory={false}
          onChange={(changes) => {
            onChange(changes);
            setValues((current) => ({ ...current, ...changes }));
          }}
        />
      );
    };
    render(<History />);
    const pregnancy = screen.getByRole('spinbutton', { name: 'Количество беременностей' });
    const births = () =>
      screen.getByLabelText('Количество родов', { selector: 'input' }) as HTMLInputElement;
    const controls = () => [
      births(),
      screen.getByLabelText('Самопроизвольные аборты в анамнезе', { selector: 'input' }),
      screen.getByRole('button', { name: newbornLabel }),
    ];
    fireEvent.change(pregnancy, { target: { value: zero } });
    expect(onChange).toHaveBeenLastCalledWith({
      recipientPregnanciesCount: zero,
      recipientBirthsCount: 'Не известно',
      recipientSpontaneousAbortionsCount: 'Не известно',
      recipientHemolyticDiseaseNewbornHistory: 'Не известно',
    });
    expect(pregnancy.matches(':disabled')).toBe(false);
    for (const control of controls()) expect(control.matches(':disabled')).toBe(true);
    onChange.mockClear();
    fireEvent.change(births(), { target: { value: '3' } });
    expect(onChange).not.toHaveBeenCalled();
    expect(births().value).toBe('Не известно');
    expect((pregnancy as HTMLInputElement).value).toBe('Не было');
    fireEvent.click(screen.getByRole('button', { name: 'Варианты: Количество беременностей' }));
    fireEvent.click(screen.getByRole('option', { name: '1' }));
    for (const control of controls().slice(0, 2)) expect(control.matches(':disabled')).toBe(false);
    expect(screen.getByRole('button', { name: newbornLabel }).matches(':disabled')).toBe(true);
    expect(births().value).toBe('Не известно');
    fireEvent.click(screen.getByRole('button', { name: 'Варианты: Количество родов' }));
    fireEvent.click(screen.getByRole('option', { name: '1' }));
    expect(births().value).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: newbornLabel }));
    fireEvent.click(screen.getByRole('option', { name: 'Да' }));
    expect(onChange).toHaveBeenLastCalledWith({ recipientHemolyticDiseaseNewbornHistory: 'Да' });
    fireEvent.change(pregnancy, { target: { value: zero } });
    fireEvent.click(screen.getByRole('button', { name: 'Варианты: Количество беременностей' }));
    fireEvent.click(screen.getByRole('option', { name: 'Не известно' }));
    expect(screen.getByRole('button', { name: newbornLabel }).matches(':disabled')).toBe(true);
  },
);

it('does not alter stored values when zero-pregnancy history is opened', () => {
  const onChange = vi.fn();
  render(
    <RecipientHistoryFields
      values={{ ...stored, recipientPregnanciesCount: '0' }}
      applyDefaults={false}
      showTransfusionHistory={false}
      onChange={onChange}
    />,
  );
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: newbornLabel }).matches(':disabled')).toBe(true);
});
