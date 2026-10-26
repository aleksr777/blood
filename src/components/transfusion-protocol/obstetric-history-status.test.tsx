// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

it('blocks all details for unknown history and restores them when it becomes known', () => {
  const Form = () => {
    const [values, setValues] = useState<ProtocolValues>(counts);
    return (
      <ObstetricHistoryFields
        values={values}
        onChange={(changes) => setValues((current) => ({ ...current, ...changes }))}
      />
    );
  };
  render(<Form />);
  fireEvent.click(screen.getByRole('radio', { name: 'Не известен' }));
  for (const input of screen.getAllByRole('spinbutton'))
    expect(input.matches(':disabled')).toBe(true);
  expect(
    screen
      .getByRole('button', { name: 'Гемолитическая болезнь новорождённого в анамнезе' })
      .matches(':disabled'),
  ).toBe(true);
  fireEvent.click(screen.getByRole('radio', { name: 'Известен' }));
  const input = screen.getByRole('spinbutton', {
    name: 'Количество беременностей',
  }) as HTMLInputElement;
  expect(input.matches(':disabled')).toBe(false);
  expect(input.value).toBe('2');
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
