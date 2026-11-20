// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RecipientHistoryFields } from './recipient-history-fields';
import { chooseCount, countInput, countRadio } from './obstetric-test-controls';
import type { ProtocolValues } from './protocol-types';

afterEach(cleanup);

const fields = [
  ['recipientPregnanciesCount', 'Количество беременностей'],
  ['recipientBirthsCount', 'Количество родов'],
  ['recipientSpontaneousAbortionsCount', 'Самопроизвольные аборты в анамнезе'],
] as const;

it.each(fields)('offers cancellable choices and accepts 1–99 for %s', (name, label) => {
  const onChange = vi.fn();
  const History = () => {
    const [values, setValues] = useState<ProtocolValues>({
      recipientSex: 'Женский',
      recipientPregnanciesCount: 'Не известно',
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
  const input = countInput(label);
  expect([input.min, input.max, input.step]).toEqual(['1', '99', '1']);
  for (const value of ['1', '99']) {
    fireEvent.change(input, { target: { value } });
    expect(onChange).toHaveBeenLastCalledWith({ [name]: value });
    expect(input.value).toBe(value);
  }
  onChange.mockClear();
  for (const value of ['0', '-1', '100', '999', '1.5', '1e1', '03']) {
    fireEvent.change(input, { target: { value } });
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('99');
  }
  chooseCount(label, 'Не было');
  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ [name]: '0' }));
  expect(countRadio(label, 'Не было').checked).toBe(true);
  chooseCount(label, 'Не было');
  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ [name]: '' }));
  expect(countRadio(label, 'Не было').checked).toBe(false);
  chooseCount(label, 'Количество:');
  expect(input.disabled).toBe(false);
  fireEvent.change(input, { target: { value: '3' } });
  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ [name]: '3' }));
  fireEvent.change(input, { target: { value: '' } });
  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ [name]: '' }));
  expect(countRadio(label, 'Количество:').checked).toBe(true);
  chooseCount(label, 'Количество:');
  expect(countRadio(label, 'Количество:').checked).toBe(false);
  chooseCount(label, 'Не известно');
  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ [name]: 'Не известно' }));
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
  expect(countInput('Количество беременностей').value).toBe('100');
});
