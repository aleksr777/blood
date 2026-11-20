// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RecipientHistoryFields } from './recipient-history-fields';
import { chooseCount, countInput, countRadio } from './obstetric-test-controls';
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

it('clears excessive counts at zero pregnancies and re-enables fields for a positive count', () => {
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
  const pregnancy = countInput('Количество беременностей');
  const births = () => countInput('Количество родов');
  const controls = () => [
    countRadio('Количество родов', 'Не известно'),
    countRadio('Самопроизвольные аборты в анамнезе', 'Не известно'),
    screen.getByRole('button', { name: newbornLabel }),
  ];
  chooseCount('Количество беременностей', 'Не было');
  expect(onChange).toHaveBeenLastCalledWith({
    recipientPregnanciesCount: '0',
    recipientBirthsCount: 'Не известно',
    recipientSpontaneousAbortionsCount: 'Не известно',
    recipientHemolyticDiseaseNewbornHistory: 'Не известно',
  });
  expect(countRadio('Количество беременностей', 'Не было').matches(':disabled')).toBe(false);
  for (const control of controls()) expect(control.matches(':disabled')).toBe(true);
  onChange.mockClear();
  fireEvent.change(births(), { target: { value: '3' } });
  expect(onChange).not.toHaveBeenCalled();
  expect(countRadio('Количество родов', 'Не известно').checked).toBe(true);
  expect(countRadio('Количество беременностей', 'Не было').checked).toBe(true);
  chooseCount('Количество беременностей', 'Количество:');
  fireEvent.change(pregnancy, { target: { value: '1' } });
  for (const control of controls().slice(0, 2)) expect(control.matches(':disabled')).toBe(false);
  expect(screen.getByRole('button', { name: newbornLabel }).matches(':disabled')).toBe(true);
  chooseCount('Количество родов', 'Количество:');
  fireEvent.change(births(), { target: { value: '1' } });
  expect(births().value).toBe('1');
  fireEvent.click(screen.getByRole('button', { name: newbornLabel }));
  fireEvent.click(screen.getByRole('option', { name: 'Было' }));
  expect(onChange).toHaveBeenLastCalledWith({ recipientHemolyticDiseaseNewbornHistory: 'Было' });
  chooseCount('Количество беременностей', 'Не было');
  chooseCount('Количество беременностей', 'Не известно');
  expect(screen.getByRole('button', { name: newbornLabel }).matches(':disabled')).toBe(true);
});

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
