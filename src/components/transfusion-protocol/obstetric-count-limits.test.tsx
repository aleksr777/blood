// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RecipientHistoryFields } from './recipient-history-fields';
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

const countInput = (name: string) => screen.getByRole('spinbutton', { name }) as HTMLInputElement;

it.each([
  ['recipientBirthsCount', 'Количество родов'],
  ['recipientSpontaneousAbortionsCount', 'Самопроизвольные аборты в анамнезе'],
])('limits %s to the entered pregnancy count', (name, label) => {
  const onChange = renderEditableHistory();
  const input = countInput(label);
  expect(input.max).toBe('2');
  for (const value of ['3', '03', '99']) {
    fireEvent.change(input, { target: { value } });
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('1');
  }
  for (const value of ['2', '02', '0', '']) {
    fireEvent.change(input, { target: { value } });
    expect(onChange).toHaveBeenLastCalledWith({ [name]: value });
    expect(input.value).toBe(value);
  }
  fireEvent.change(countInput('Количество беременностей'), { target: { value: '3' } });
  expect(input.max).toBe('3');
  fireEvent.change(input, { target: { value: '3' } });
  expect(input.value).toBe('3');
});

it('clears only excessive counts when the pregnancy count is decreased', () => {
  const onChange = renderEditableHistory({
    ...stored,
    recipientPregnanciesCount: '6',
    recipientBirthsCount: '5',
    recipientSpontaneousAbortionsCount: '2',
  });
  const pregnancy = countInput('Количество беременностей');
  const births = countInput('Количество родов');
  const abortions = countInput('Самопроизвольные аборты в анамнезе');
  fireEvent.change(pregnancy, { target: { value: '4' } });
  expect(onChange).toHaveBeenLastCalledWith({
    recipientPregnanciesCount: '4',
    recipientBirthsCount: '',
  });
  expect(births.value).toBe('');
  expect(abortions.value).toBe('2');
  fireEvent.change(births, { target: { value: '4' } });
  fireEvent.change(abortions, { target: { value: '4' } });
  expect(births.value).toBe('4');
  expect(abortions.value).toBe('4');
  fireEvent.change(pregnancy, { target: { value: '1' } });
  expect(onChange).toHaveBeenLastCalledWith({
    recipientPregnanciesCount: '1',
    recipientBirthsCount: '',
    recipientSpontaneousAbortionsCount: '',
  });
  expect([births.value, abortions.value, births.max, abortions.max]).toEqual(['', '', '1', '1']);
});

it('keeps the 0–99 range and existing counts when pregnancies are left blank', () => {
  renderEditableHistory();
  fireEvent.change(countInput('Количество беременностей'), { target: { value: '' } });
  for (const label of ['Количество родов', 'Самопроизвольные аборты в анамнезе']) {
    const input = countInput(label);
    expect(input.value).toBe('1');
    expect(input.max).toBe('99');
    fireEvent.change(input, { target: { value: '99' } });
    expect(input.value).toBe('99');
  }
});

it('preserves inconsistent saved counts on opening and validates subsequent edits', () => {
  const onChange = renderEditableHistory({
    ...stored,
    recipientBirthsCount: '3',
    recipientSpontaneousAbortionsCount: '4',
  });
  const births = countInput('Количество родов');
  const abortions = countInput('Самопроизвольные аборты в анамнезе');
  expect(onChange).not.toHaveBeenCalled();
  expect([births.value, abortions.value, births.max, abortions.max]).toEqual(['3', '4', '2', '2']);
  fireEvent.change(births, { target: { value: '5' } });
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.change(births, { target: { value: '2' } });
  expect(onChange).toHaveBeenLastCalledWith({ recipientBirthsCount: '2' });
  expect(abortions.value).toBe('4');
});
