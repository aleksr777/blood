// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ObstetricHistoryFields } from './obstetric-history-fields';
import { chooseCount, countInput, countRadio } from './obstetric-test-controls';
import { formatObstetricHistory } from './obstetric-history';
import { HistoryBlock } from './first-page-blocks-secondary';
import { hasStructuredObstetricHistory } from '../blood-requests/direction-history';
import { profileFromValues } from '../../storage/sqlite/recipient-data';
import type { ProtocolValues } from './protocol-types';

afterEach(cleanup);
const counts = {
  recipientSex: 'Женский',
  recipientPregnanciesCount: '2',
  recipientBirthsCount: '1',
  recipientSpontaneousAbortionsCount: '1',
  recipientHemolyticDiseaseNewbornHistory: 'Да',
};

const labels = [
  'Количество беременностей',
  'Количество родов',
  'Самопроизвольные аборты в анамнезе',
  'Гемолитическая болезнь новорождённого в анамнезе',
];

it('prints unknown values separately and hides inactive newborn history', () => {
  const Form = () => {
    const [values, setValues] = useState<ProtocolValues>(counts);
    return (
      <>
        <ObstetricHistoryFields
          values={values}
          onChange={(changes) => setValues((current) => ({ ...current, ...changes }))}
        />
        <table>
          <HistoryBlock values={values} part="main" onOpenBlock={vi.fn()} />
        </table>
      </>
    );
  };
  render(<Form />);
  for (const [index, label] of labels.slice(0, 3).entries()) {
    chooseCount(label, 'Не известно');
    if (index === 0) {
      for (const countLabel of labels.slice(1, 3)) {
        const input = countInput(countLabel);
        expect(input.max).toBe('99');
        chooseCount(countLabel, 'Количество:');
        fireEvent.change(input, { target: { value: '99' } });
        expect(input.value).toBe('99');
        fireEvent.change(input, { target: { value: '100' } });
        expect(input.value).toBe('99');
      }
    }
  }
  const message = screen.getByText(/Количество беременностей - не известно/);
  expect(message.closest('.cell-value')?.textContent).toBe(
    'Количество беременностей - не известно. Количество родов - не известно. ' +
      'Количество самопроизвольных абортов - не известно.',
  );
  expect(message.closest('td')?.getAttribute('colspan')).toBe('6');
  chooseCount('Количество беременностей', 'Количество:');
  fireEvent.change(countInput('Количество беременностей'), { target: { value: '2' } });
  expect(screen.getByText(/Количество беременностей в анамнезе - 2/)).toBeTruthy();
  expect(screen.getByText(/Количество родов - не известно/)).toBeTruthy();
  expect(screen.getByRole('button', { name: labels[3] }).matches(':disabled')).toBe(true);
});

it('defaults new history to zero pregnancies without filling missing saved history', () => {
  const onChange = vi.fn();
  const { rerender } = render(<ObstetricHistoryFields values={{}} onChange={onChange} />);
  expect(onChange).toHaveBeenCalledWith({
    recipientPregnanciesCount: '0',
    recipientBirthsCount: 'Не известно',
    recipientSpontaneousAbortionsCount: 'Не известно',
    recipientHemolyticDiseaseNewbornHistory: 'Не известно',
  });
  expect(countRadio(labels[0], 'Не было').checked).toBe(true);
  expect(countInput(labels[1]).matches(':disabled')).toBe(true);
  onChange.mockClear();
  rerender(<ObstetricHistoryFields values={{}} applyDefaults={false} onChange={onChange} />);
  expect(onChange).not.toHaveBeenCalled();
});

it('keeps a legacy unknown snapshot untouched until editing an individual field', () => {
  const values = Object.freeze({ ...counts, recipientObstetricHistoryStatus: 'unknown' });
  const onChange = vi.fn();
  render(<ObstetricHistoryFields values={values} applyDefaults={false} onChange={onChange} />);
  expect(onChange).not.toHaveBeenCalled();
  for (const label of labels.slice(0, 3))
    expect(countRadio(label, 'Не известно').checked).toBe(true);
  chooseCount('Количество беременностей', 'Количество:');
  fireEvent.change(countInput('Количество беременностей'), { target: { value: '2' } });
  expect(onChange).toHaveBeenCalledWith({
    recipientObstetricHistoryStatus: 'known',
    recipientPregnanciesCount: '2',
    recipientBirthsCount: 'Не известно',
    recipientSpontaneousAbortionsCount: 'Не известно',
    recipientHemolyticDiseaseNewbornHistory: 'Не известно',
  });
  expect(values.recipientBirthsCount).toBe('1');
});

it('prints unknown legacy history by active field and preserves the profile field', () => {
  const values = { ...counts, recipientObstetricHistoryStatus: 'unknown' };
  const unknownText =
    'Количество беременностей - не известно. Количество родов - не известно. ' +
    'Количество самопроизвольных абортов - не известно.';
  expect(formatObstetricHistory(values)).toBe(unknownText);
  expect(formatObstetricHistory({ ...values, recipientPregnanciesCount: '0' })).toBe(unknownText);
  expect(hasStructuredObstetricHistory({ recipientObstetricHistoryStatus: 'unknown' })).toBe(true);
  expect(profileFromValues(values).recipientObstetricHistoryStatus).toBe('unknown');
  render(
    <table>
      <HistoryBlock values={values} part="main" onOpenBlock={vi.fn()} />
    </table>,
  );
  const message = screen.getByText('Количество беременностей - не известно.');
  expect(message.closest('.cell-value')?.textContent).toBe(unknownText);
  expect(message.closest('td')?.getAttribute('colspan')).toBe('6');
});
