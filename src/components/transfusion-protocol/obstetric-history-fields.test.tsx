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
  'disables dependent fields at %s and restores them without data loss',
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
      screen.getByRole('spinbutton', { name: 'Количество родов' }) as HTMLInputElement;
    const controls = () => [
      births(),
      screen.getByRole('spinbutton', { name: 'Самопроизвольные аборты в анамнезе' }),
      screen.getByRole('button', { name: newbornLabel }),
    ];
    fireEvent.change(pregnancy, { target: { value: zero } });
    expect(pregnancy.matches(':disabled')).toBe(false);
    for (const control of controls()) expect(control.matches(':disabled')).toBe(true);
    onChange.mockClear();
    fireEvent.change(births(), { target: { value: '3' } });
    expect(onChange).not.toHaveBeenCalled();
    expect(births().value).toBe('1');
    fireEvent.change(pregnancy, { target: { value: '1' } });
    for (const control of controls()) expect(control.matches(':disabled')).toBe(false);
    expect(births().value).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: newbornLabel }));
    fireEvent.click(screen.getByRole('option', { name: 'Да' }));
    expect(onChange).toHaveBeenLastCalledWith({ recipientHemolyticDiseaseNewbornHistory: 'Да' });
    fireEvent.change(pregnancy, { target: { value: zero } });
    fireEvent.change(pregnancy, { target: { value: '' } });
    expect(screen.getByRole('button', { name: newbornLabel }).matches(':disabled')).toBe(false);
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
