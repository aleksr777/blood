// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RecipientHistoryFields } from './recipient-history-fields';
import { chooseCount, countInput, countRadio } from './obstetric-test-controls';
import type { ProtocolValues } from './protocol-types';

afterEach(cleanup);
const stored = {
  recipientSex: 'Женский',
  recipientPregnanciesCount: '2',
  recipientBirthsCount: '1',
  recipientSpontaneousAbortionsCount: '1',
  recipientHemolyticDiseaseNewbornHistory: 'Да',
};

const renderEditableHistory = (initialValues: ProtocolValues = stored) => {
  const onChange = vi.fn();
  const History = () => {
    const [values, setValues] = useState(initialValues);
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
  return onChange;
};

it.each([
  ['recipientBirthsCount', 'Количество родов'],
  ['recipientSpontaneousAbortionsCount', 'Самопроизвольные аборты в анамнезе'],
])('limits %s to the entered pregnancy count', (name, label) => {
  const onChange = renderEditableHistory();
  const input = countInput(label);
  expect(input.max).toBe('2');
  for (const value of ['3', '99', '0', '-1']) {
    fireEvent.change(input, { target: { value } });
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('1');
  }
  fireEvent.change(input, { target: { value: '2' } });
  expect(onChange).toHaveBeenLastCalledWith({ [name]: '2' });
  chooseCount(label, 'Не было');
  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ [name]: '0' }));
  fireEvent.change(countInput('Количество беременностей'), { target: { value: '3' } });
  chooseCount(label, 'Количество:');
  fireEvent.change(countInput(label), { target: { value: '3' } });
  expect(countInput(label).max).toBe('3');
  expect(countInput(label).value).toBe('3');
});

it('clears only excessive counts when the pregnancy count is decreased', () => {
  const onChange = renderEditableHistory({
    ...stored,
    recipientPregnanciesCount: '6',
    recipientBirthsCount: '5',
    recipientSpontaneousAbortionsCount: '2',
  });
  fireEvent.change(countInput('Количество беременностей'), { target: { value: '4' } });
  expect(onChange).toHaveBeenLastCalledWith({
    recipientPregnanciesCount: '4',
    recipientBirthsCount: 'Не известно',
    recipientHemolyticDiseaseNewbornHistory: 'Не известно',
  });
  expect(countRadio('Количество родов', 'Не известно').checked).toBe(true);
  expect(countInput('Самопроизвольные аборты в анамнезе').value).toBe('2');
  chooseCount('Количество родов', 'Количество:');
  fireEvent.change(countInput('Количество родов'), { target: { value: '4' } });
  fireEvent.change(countInput('Самопроизвольные аборты в анамнезе'), {
    target: { value: '4' },
  });
  fireEvent.change(countInput('Количество беременностей'), { target: { value: '1' } });
  expect(onChange).toHaveBeenLastCalledWith({
    recipientPregnanciesCount: '1',
    recipientBirthsCount: 'Не известно',
    recipientSpontaneousAbortionsCount: 'Не известно',
  });
  for (const label of ['Количество родов', 'Самопроизвольные аборты в анамнезе']) {
    expect(countRadio(label, 'Не известно').checked).toBe(true);
    expect(countInput(label).max).toBe('1');
  }
});

it('preserves inconsistent saved counts on opening and validates subsequent edits', () => {
  const onChange = renderEditableHistory({
    ...stored,
    recipientBirthsCount: '3',
    recipientSpontaneousAbortionsCount: '4',
  });
  const births = countInput('Количество родов');
  expect(onChange).not.toHaveBeenCalled();
  expect([
    births.value,
    countInput('Самопроизвольные аборты в анамнезе').value,
    births.max,
  ]).toEqual(['3', '4', '2']);
  fireEvent.change(births, { target: { value: '5' } });
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.change(births, { target: { value: '2' } });
  expect(onChange).toHaveBeenLastCalledWith({ recipientBirthsCount: '2' });
});
