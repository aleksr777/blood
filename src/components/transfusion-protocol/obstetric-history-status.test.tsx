// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ObstetricHistoryFields } from './obstetric-history-fields';
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

it('lets each field be unknown and prints one common message when all four are unknown', () => {
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
    fireEvent.click(screen.getByRole('button', { name: `Варианты: ${label}` }));
    const list = screen.getByRole('listbox', { name: label });
    expect(within(list).queryByRole('option', { name: 'Не выбрано' })).toBeNull();
    fireEvent.click(within(list).getByRole('option', { name: 'Не известно' }));
    if (index === 0) {
      for (const countLabel of labels.slice(1, 3)) {
        const input = screen.getByRole('spinbutton', { name: countLabel }) as HTMLInputElement;
        expect([input.value, input.max]).toEqual(['1', '99']);
        fireEvent.change(input, { target: { value: '99' } });
        expect(input.value).toBe('99');
        fireEvent.change(input, { target: { value: '100' } });
        expect(input.value).toBe('99');
      }
    }
  }
  expect(screen.getByText('Не известен').closest('td')?.getAttribute('colspan')).toBe('6');
  for (const input of screen.getAllByRole('textbox'))
    expect(input.matches(':disabled')).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Варианты: Количество беременностей' }));
  fireEvent.click(screen.getByRole('option', { name: '2' }));
  expect(screen.queryByText('Не известен')).toBeNull();
  expect(screen.getByText(/Количество родов неизвестно/)).toBeTruthy();
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
  expect((screen.getByRole('textbox', { name: labels[0] }) as HTMLInputElement).value).toBe(
    'Не было',
  );
  expect(screen.getByRole('textbox', { name: labels[1] }).matches(':disabled')).toBe(true);
  onChange.mockClear();
  rerender(<ObstetricHistoryFields values={{}} applyDefaults={false} onChange={onChange} />);
  expect(onChange).not.toHaveBeenCalled();
});

it('keeps a legacy unknown snapshot untouched until editing an individual field', () => {
  const values = Object.freeze({ ...counts, recipientObstetricHistoryStatus: 'unknown' });
  const onChange = vi.fn();
  render(<ObstetricHistoryFields values={values} applyDefaults={false} onChange={onChange} />);
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getAllByRole('textbox').map((input) => (input as HTMLInputElement).value)).toEqual([
    'Не известно',
    'Не известно',
    'Не известно',
  ]);
  fireEvent.click(screen.getByRole('button', { name: 'Варианты: Количество беременностей' }));
  fireEvent.click(screen.getByRole('option', { name: '2' }));
  expect(onChange).toHaveBeenCalledWith({
    recipientObstetricHistoryStatus: 'known',
    recipientPregnanciesCount: '2',
    recipientBirthsCount: 'Не известно',
    recipientSpontaneousAbortionsCount: 'Не известно',
    recipientHemolyticDiseaseNewbornHistory: 'Не известно',
  });
  expect(values.recipientBirthsCount).toBe('1');
});

it('prints only the unknown status in one full-width obstetric cell and preserves the profile field', () => {
  const values = { ...counts, recipientObstetricHistoryStatus: 'unknown' };
  expect(formatObstetricHistory(values)).toBe('Не известен');
  expect(formatObstetricHistory({ ...values, recipientPregnanciesCount: '0' })).toBe('Не известен');
  expect(hasStructuredObstetricHistory({ recipientObstetricHistoryStatus: 'unknown' })).toBe(true);
  expect(profileFromValues(values).recipientObstetricHistoryStatus).toBe('unknown');
  render(
    <table>
      <HistoryBlock values={values} part="main" onOpenBlock={vi.fn()} />
    </table>,
  );
  const message = screen.getByText('Не известен');
  expect(message.closest('td')?.getAttribute('colspan')).toBe('6');
  expect(screen.queryByText(/беременности в анамнезе/)).toBeNull();
});
