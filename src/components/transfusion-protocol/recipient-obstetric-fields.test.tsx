// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RecipientHistoryFields } from './recipient-history-fields';
import type { ProtocolValues } from './protocol-types';

afterEach(cleanup);

const fields = [
  ['recipientPregnanciesCount', 'Количество беременностей'],
  ['recipientBirthsCount', 'Количество родов'],
  ['recipientSpontaneousAbortionsCount', 'Самопроизвольные аборты в анамнезе'],
] as const;

it.each(fields)('keeps %s within 0–99 when editing and clearing', (name, label) => {
  const onChange = vi.fn();
  const History = () => {
    const [values, setValues] = useState<ProtocolValues>({
      recipientSex: 'Женский',
      [name]: '2',
    });
    return (
      <RecipientHistoryFields
        values={values}
        showTransfusionHistory={false}
        onChange={(changes) => {
          onChange(changes);
          setValues((current) => ({ ...current, ...changes }));
        }}
      />
    );
  };
  render(<History />);
  const input = screen.getByRole('spinbutton', { name: label }) as HTMLInputElement;
  expect([input.min, input.max, input.step]).toEqual(['0', '99', '1']);
  for (const value of ['0', '1', '99']) {
    fireEvent.change(input, { target: { value } });
    expect(onChange).toHaveBeenLastCalledWith({ [name]: value });
    expect(input.value).toBe(value);
  }
  onChange.mockClear();
  for (const value of ['-1', '100', '999', '1.5', '1e1']) {
    fireEvent.change(input, { target: { value } });
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('99');
  }
  fireEvent.change(input, { target: { value: '' } });
  expect(onChange).toHaveBeenLastCalledWith({ [name]: '' });
  expect(input.value).toBe('');
});

it('does not rewrite stored obstetric history when opening a saved document', () => {
  const onChange = vi.fn();
  render(
    <RecipientHistoryFields
      values={{ recipientSex: 'Женский', recipientPregnanciesCount: '100' }}
      applyDefaults={false}
      showTransfusionHistory={false}
      onChange={onChange}
    />,
  );
  expect(onChange).not.toHaveBeenCalled();
  expect(
    (screen.getByRole('spinbutton', { name: 'Количество беременностей' }) as HTMLInputElement)
      .value,
  ).toBe('100');
  fireEvent.click(
    screen.getByRole('button', { name: 'Гемолитическая болезнь новорождённого в анамнезе' }),
  );
  fireEvent.click(screen.getByRole('option', { name: 'Да' }));
  expect(onChange).toHaveBeenLastCalledWith({ recipientHemolyticDiseaseNewbornHistory: 'Да' });
});
