// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DateTimeInputs } from './date-time-inputs';
import {
  formatRequestDateTime,
  restoreRequestDateTime,
} from '../blood-requests/component-request-447n';
import { getFormContentKey } from '../../domain/form-content';
import { formatDateTime } from '../transfusion-protocol/protocol-types';

afterEach(cleanup);

it('preserves a legacy request date without restoring an explicitly cleared value', () => {
  expect(restoreRequestDateTime('', '2026-11-18', '')).toBe('2026-11-18');
  expect(restoreRequestDateTime('', '2026-11-18', '1')).toBe('');
  expect(restoreRequestDateTime('T12:30', '2026-11-18', '1')).toBe('T12:30');
  expect(getFormContentKey({ requestDateTimeExplicit: '1' })).toBe('{}');
});

it('edits and clears date and time independently without inventing values', () => {
  const Demo = () => {
    const [value, setValue] = useState('2026-11-18T08:30');
    return (
      <>
        <DateTimeInputs
          name="requestDateTime"
          label="Дата и время подачи заявки"
          value={value}
          onChange={setValue}
        />
        <output>{value}</output>
      </>
    );
  };
  render(<Demo />);
  const date = screen.getByLabelText('Дата') as HTMLInputElement;
  const time = screen.getByLabelText('Время') as HTMLInputElement;
  fireEvent.change(date, { target: { value: '' } });
  expect(screen.getByText('T08:30')).toBeTruthy();
  expect(time.value).toBe('08:30');
  fireEvent.change(time, { target: { value: '' } });
  expect(date.value).toBe('');
  expect(time.value).toBe('');
  fireEvent.change(time, { target: { value: '12:45' } });
  expect(screen.getByText('T12:45')).toBeTruthy();
  fireEvent.change(date, { target: { value: '2026-12-01' } });
  expect(screen.getByText('2026-12-01T12:45')).toBeTruthy();
  fireEvent.change(time, { target: { value: '' } });
  expect(screen.getByText('2026-12-01')).toBeTruthy();
});

it.each([
  ['2026-11-18T08:30', '18.11.2026 08:30'],
  ['2026-11-18', '18.11.2026'],
  ['T08:30', '08:30'],
  ['', ''],
])('formats a saved complete or partial value %s', (value, expected) => {
  expect(formatRequestDateTime(value)).toBe(expected);
  expect(formatDateTime(value)).toBe(expected);
});

it('leaves the request date cell empty after clearing both inputs', async () => {
  const { ComponentRequestForm } = await import('../blood-requests/component-request-form');
  const { request } = await import('../blood-requests/component-request-form.fixture');
  render(
    <ComponentRequestForm
      values={{ ...request, requestDateTime: '', directionDate: '2026-11-10' }}
      examination={{}}
      readOnly={false}
      onEdit={() => {}}
    />,
  );
  const cell = screen.getByText('Дата и время подачи заявки').closest('tr')?.querySelector('td');
  expect(cell?.textContent).toBe('');
});
